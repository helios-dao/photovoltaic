// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;

import "../interfaces/ICollateralLocker.sol";
import "../interfaces/ICollateralLockerFactory.sol";
import "../interfaces/IERC20Details.sol";
import "../interfaces/IFundingLocker.sol";
import "../interfaces/IFundingLockerFactory.sol";
import "../interfaces/IGlobals.sol";
import "../interfaces/ILateFeeCalc.sol";
import "../interfaces/ILoanFactory.sol";
import "../interfaces/IPremiumCalc.sol";
import "../interfaces/IRepaymentCalc.sol";
import "../interfaces/IUniswapRouter.sol";
import "../library/Util.sol";

import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "lib/openzeppelin-contracts/contracts/math/SafeMath.sol";

library LoanLib {

    using SafeMath for uint256;

    enum State { Live, Active, Matured, Expired, Liquidated }

    address public constant UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    /**
        @dev If the borrower has not drawn down loan past grace period, return capital to lenders.
    */
    function unwind(IERC20 loanAsset, address superFactory, address fundingLocker, uint256 createdAt) external returns(uint256 excessReturned) {
        IGlobals globals = _globals(superFactory);

        // Only callable if time has passed drawdown grace period, set in MapleGlobals.
        require(block.timestamp > createdAt.add(globals.drawdownGracePeriod()));

        // Drain funding from FundingLocker, transfers all loanAsset to this Loan.
        IFundingLocker(fundingLocker).drain();

        // Update accounting for claim()
        return loanAsset.balanceOf(address(this));
    }

    /**
        @dev Triggers default flow for loan, liquidating all collateral and updating accounting.
    */
    function triggerDefault(
        IERC20Details collateralAsset,
        uint256 liquidationAmt,
        address loanAsset,
        address superFactory,
        address collateralLocker
    ) 
        external
        returns (
            uint256 amountLiquidated,
            uint256 amountRecovered
        ) 
    {

        // Pull collateralAsset from collateralLocker.
        require(ICollateralLocker(collateralLocker).pull(address(this), liquidationAmt), "Loan:COLLATERAL_PULL");

        if (address(collateralAsset) != loanAsset) {
            // Swap collateralAsset for loanAsset.
            collateralAsset.approve(UNISWAP_ROUTER, liquidationAmt);

            IGlobals globals = _globals(superFactory);

            uint256 minAmount = Util.calcMinAmount(globals, address(collateralAsset), loanAsset, liquidationAmt);  // Minimum amount of loan asset get after swapping collateral asset.

            // Generate path.
            address uniswapAssetForPath = globals.defaultUniswapPath(address(collateralAsset), loanAsset);
            bool middleAsset = uniswapAssetForPath != loanAsset && uniswapAssetForPath != address(0);

            address[] memory path = new address[](middleAsset ? 3 : 2);

            path[0] = address(collateralAsset);
            path[1] = middleAsset ? uniswapAssetForPath : loanAsset;

            if(middleAsset) path[2] = loanAsset;

            uint256[] memory returnAmounts = IUniswapRouter(UNISWAP_ROUTER).swapExactTokensForTokens(
                liquidationAmt,
                minAmount.sub(minAmount.mul(globals.maxSwapSlippage()).div(10000)),
                path,
                address(this),
                block.timestamp
            );

            amountLiquidated = returnAmounts[0];
            amountRecovered  = returnAmounts[path.length - 1];
        } else {
            amountLiquidated = liquidationAmt;
            amountRecovered  = liquidationAmt;
        }
    }

    /**
        @dev Trigger a default. Does nothing if block.timestamp <= nextPaymentDue + gracePeriod.
    */
    function canTriggerDefault(uint256 nextPaymentDue, address superFactory, uint256 balance) external returns(bool) {

        uint256 gracePeriodEnd         = nextPaymentDue.add(_globals(superFactory).gracePeriod());
        bool pastGracePeriod           = block.timestamp > gracePeriodEnd;
        bool withinExtendedGracePeriod = pastGracePeriod && block.timestamp <= gracePeriodEnd.add(_globals(superFactory).extendedGracePeriod());

        // It checks following conditions - 
        // 1. If `current time - nextPaymentDue` is within the (gracePeriod, gracePeriod + extendedGracePeriod] & `msg.sender` is
        //    a pool delegate (Assumption: Only pool delegate will have non zero balance) then liquidate the loan.
        // 2. If `current time - nextPaymentDue` is greater than gracePeriod + extendedGracePeriod then any msg.sender can liquidate the loan.
        return ((withinExtendedGracePeriod && balance > 0) || (pastGracePeriod && !withinExtendedGracePeriod));
    }

    /**
        @dev Returns information on next payment amount.
        @return total           Principal + Interest
        @return principal       Principal 
        @return interest        Interest
        @return nextPaymentDue  Payment Due Date
    */
    function getNextPayment(
        address superFactory,
        address repaymentCalc,
        uint256 nextPaymentDue,
        address lateFeeCalc
    ) 
        public
        view
        returns (
            uint256 total,
            uint256 principal,
            uint256 interest,
            uint256
        ) 
    {

        IGlobals globals = _globals(superFactory);

        (
            total, 
            principal, 
            interest
        ) = IRepaymentCalc(repaymentCalc).getNextPayment(address(this));

        if (block.timestamp > nextPaymentDue && block.timestamp <= nextPaymentDue.add(globals.gracePeriod())) {
            (
                uint256 totalExtra, 
                uint256 principalExtra, 
                uint256 interestExtra
            ) = ILateFeeCalc(lateFeeCalc).getLateFee(address(this));

            total     = total.add(totalExtra);
            interest  = interest.add(interestExtra);
            principal = principal.add(principalExtra);
        }
        
        return (total, principal, interest, nextPaymentDue);
    }

    /**
        @dev Helper for calculating collateral required to drawdown amt.
        @return collateralRequiredFIN The amount of collateralAsset required to post in CollateralLocker for given drawdown amt.
    */
    function collateralRequiredForDrawdown(
        IERC20Details collateralAsset,
        IERC20Details loanAsset,
        uint256 collateralRatio,
        address superFactory,
        uint256 amt
    ) 
        external
        view
        returns (uint256 collateralRequiredFIN) 
    {
        IGlobals globals = _globals(superFactory);

        uint256 wad = _toWad(amt, loanAsset);  // Convert to WAD precision.

        // Fetch value of collateral and funding asset.
        uint256 loanAssetPrice  = globals.getLatestPrice(address(loanAsset));
        uint256 collateralPrice = globals.getLatestPrice(address(collateralAsset));

        // Calculate collateral required.
        uint256 collateralRequiredUSD = loanAssetPrice.mul(wad).mul(collateralRatio).div(10000);
        uint256 collateralRequiredWEI = collateralRequiredUSD.div(collateralPrice);
        collateralRequiredFIN = collateralRequiredWEI.div(10 ** (18 - collateralAsset.decimals()));
    }

    function _globals(address loanFactory) internal view returns (IGlobals) {
        return IGlobals(ILoanFactory(loanFactory).globals());
    }

    function _toWad(uint256 amt, IERC20Details loanAsset) internal view returns(uint256) {
        return amt.mul(10 ** 18).div(10 ** loanAsset.decimals());
    }
    
}