// SPDX-License-Identifier: MIT

pragma solidity >=0.6.11;

import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

import "./math/CalcBPool.sol";
import "./interfaces/ILoan.sol";
import "./interfaces/IBPool.sol";
import "./interfaces/IGlobals.sol";
import "./interfaces/ILoanFactory.sol";
import "./interfaces/IStakeLocker.sol";
import "./interfaces/IStakeLockerFactory.sol";
import "./interfaces/ILiquidityLocker.sol";
import "./interfaces/ILiquidityLockerFactory.sol";
import "./interfaces/IDebtLockerFactory.sol";
import "./interfaces/IDebtLocker.sol";
import "./interfaces/IERC20Details.sol";

// TODO: Implement a delete function, calling stakeLocker's deleteLP() function.

/// @title Pool is the core contract for liquidity pools.
contract Pool is IERC20, ERC20, CalcBPool {

    using SafeMath for uint256;

    address public immutable poolDelegate;     // The pool delegate, who maintains full authority over this Pool.
    address public immutable liquidityLocker;  // The LiquidityLocker owned by this contract.
    address public immutable stakeAsset;       // The asset deposited by stakers into the StakeLocker, for liquidation during default events.
    address public immutable stakeLocker;      // Address of the StakeLocker, escrowing the staked asset.
    address public immutable liquidityAsset;   // The asset deposited by lenders into the LiquidityLocker, for funding loans.
    address public immutable slFactory;        // Maple Globals contract
    address public           globals;          // Maple Globals contract

    uint256 private           liquidityAssetDecimals;  // decimals() precision for the liquidityAsset. (TODO: Examine the use of this variable, make immutable)
    uint256 private immutable ONELiquidityAsset;       // 10^k where k = liquidityAssetDecimals, representing one LiquidityAsset unit in 'wei'. (TODO: Examine the use of this variable)

    uint256 public principalOut;     // Sum of all outstanding principal on loans
    uint256 public interestSum;      // Sum of all interest currently inside the liquidity locker
    uint256 public stakingFee;       // The fee for stakers (in basis points).
    uint256 public delegateFee;      // The fee for delegates (in basis points).
    uint256 public principalPenalty; // max penalty on principal in bips on early withdrawl
    uint256 public interestDelay;    // time until total interest is available after a deposit, in seconds

    bool public isFinalized;  // True if this Pool is setup and the poolDelegate has met staking requirements.
    bool public isDefunct;    // True when the pool is closed, enabling poolDelegate to withdraw their stake.

    mapping(address => uint256)                     public depositDate;  // Used for interest penalty calculation
    mapping(address => mapping(address => address)) public debtLockers;  // loans[LOAN_VAULT][LOCKER_FACTORY] = DebtLocker

    event LoanFunded(address loan, address debtLocker, uint256 amountFunded);
    event BalanceUpdated(address who, address token, uint256 balance);
    event Claim(address loan, uint interest, uint principal, uint fee);

    /**
        @dev Constructor for a Pool.
        @param  _poolDelegate   The address that has manager privlidges for the Pool.
        @param  _liquidityAsset The asset escrowed in LiquidityLocker.
        @param  _stakeAsset     The asset escrowed in StakeLocker.
        @param  _slFactory      Factory used to instantiate StakeLocker.
        @param  _llFactory      Factory used to instantiate LiquidityLocker.
        @param  _stakingFee     Fee that stakers earn on interest, in bips.
        @param  _delegateFee    Fee that _poolDelegate earns on interest, in bips.
        @param  name            Name of pool token.
        @param  symbol          Symbol of pool token.
        @param  _globals        Globals contract address.
    */
    constructor(
        address _poolDelegate,
        address _liquidityAsset,
        address _stakeAsset,
        address _slFactory,
        address _llFactory,
        uint256 _stakingFee,
        uint256 _delegateFee,
        string memory name,
        string memory symbol,
        address _globals
    ) ERC20(name, symbol) public {
        require(
            address(_liquidityAsset) != address(0),
            "FDT_ERC20Extension: INVALID_FUNDS_TOKEN_ADDRESS"
        );

        address[] memory tokens = IBPool(_stakeAsset).getFinalTokens();

        uint256  i = 0;
        bool valid = false;

        while(i < tokens.length && !valid) { valid = tokens[i] == _liquidityAsset; i++; }

        require(valid, "Pool:INVALID_STAKING_POOL");

        // Assign variables relating to the LiquidityAsset.
        liquidityAsset         = _liquidityAsset;
        liquidityAssetDecimals = ERC20(_liquidityAsset).decimals();
        ONELiquidityAsset      = 10 ** (liquidityAssetDecimals);

        // Assign misc. state variables.
        stakeAsset   = _stakeAsset;
        slFactory    = _slFactory;
        globals      = _globals;
        poolDelegate = _poolDelegate;
        stakingFee   = _stakingFee;
        delegateFee  = _delegateFee;

        // Initialize the LiquidityLocker and StakeLocker.
        stakeLocker     = createStakeLocker(_stakeAsset, _slFactory, _liquidityAsset);
        liquidityLocker = address(ILiquidityLockerFactory(_llFactory).newLocker(_liquidityAsset));

        // Withdrawal penalty default settings.
        principalPenalty = 500;
        interestDelay    = 30 days;
    }

    modifier finalized() {
        require(isFinalized, "Pool:ERR_NOT_FINALIZED");
        _;
    }

    modifier notDefunct() {
        require(!isDefunct, "Pool:ERR_IS_DEFUNCT");
        _;
    }

    modifier isDelegate() {
        require(msg.sender == poolDelegate, "Pool:ERR_MSG_SENDER_NOT_DELEGATE");
        _;
    }

    /**
        @dev Deploys and assigns a StakeLocker for this Pool (only used once in constructor).
        @param stakeAsset     Address of the asset used for staking.
        @param slFactory      Address of the StakeLocker factory used for instantiation.
        @param liquidityAsset Address of the liquidity asset, required when burning stakeAsset.
    */
    function createStakeLocker(address stakeAsset, address slFactory, address liquidityAsset) private returns (address) {
        require(
            IBPool(stakeAsset).isBound(IGlobals(globals).mpl()) &&
            IBPool(stakeAsset).isFinalized(),
            "Pool::createStakeLocker:ERR_INVALID_BALANCER_POOL"
        );
        return IStakeLockerFactory(slFactory).newLocker(stakeAsset, liquidityAsset, globals);
    }

    /**
        @dev Finalize the pool, enabling deposits. Checks poolDelegate amount deposited to StakeLocker.
    */
    function finalize() public {
        (,, bool stakePresent,,) = getInitialStakeRequirements();
        require(stakePresent, "Pool::finalize:ERR_NOT_ENOUGH_STAKE");
        isFinalized = true;
        IStakeLocker(stakeLocker).finalizeLP();
    }

    /**
        @dev Returns information on the stake requirements.
        @return [0] = Amount of stake required.
                [1] = Current swap out value of stake present.
                [2] = If enough stake is present from Pool Delegate for finalization.
                [3] = Amount of pool shares required.
                [4] = Amount of pool shares present.
    */
    // TODO: Resolve the dissonance between poolSharesRequired / swapOutAmountRequired / getSwapOutValue
    function getInitialStakeRequirements() public view returns (uint256, uint256, bool, uint256, uint256) {

        address balancerPool = stakeAsset;
        address swapOutAsset = liquidityAsset;
        uint256 swapOutAmountRequired = IGlobals(globals).swapOutRequired() * (10 ** IERC20Details(liquidityAsset).decimals());

        (
            uint256 poolAmountInRequired, 
            uint256 poolAmountPresent
        ) = this.getPoolSharesRequired(balancerPool, swapOutAsset, poolDelegate, stakeLocker, swapOutAmountRequired);

        return (
            swapOutAmountRequired,
            this.getSwapOutValue(balancerPool, swapOutAsset, poolDelegate, stakeLocker),
            this.getSwapOutValue(balancerPool, swapOutAsset, poolDelegate, stakeLocker) >= swapOutAmountRequired,
            poolAmountInRequired,
            poolAmountPresent
        );
    }

    // Note: Tether is unusable as a LiquidityAsset!
    /**
        @dev Liquidity providers can deposit LiqudityAsset into the LiquidityLocker, minting FDTs.
        @param amt The amount of LiquidityAsset to deposit, in wei.
    */
    function deposit(uint256 amt) external notDefunct finalized {
        updateDepositDate(amt, msg.sender);
        IERC20(liquidityAsset).transferFrom(msg.sender, liquidityLocker, amt);
        uint256 wad = liq2FDT(amt);
        _mint(msg.sender, wad);

        emit BalanceUpdated(liquidityLocker, liquidityAsset, IERC20(liquidityAsset).balanceOf(liquidityLocker));
    }

    /**
        @dev Liquidity providers can withdraw LiqudityAsset from the LiquidityLocker, burning FDTs.
        @param amt The amount of LiquidityAsset to withdraw, in wei.
    */
    // TODO: Confirm if amt param supplied is in wei of FDT, or in wei of LiquidtyAsset.
    function withdraw(uint256 amt) external notDefunct finalized {
        require(balanceOf(msg.sender) >= amt, "Pool::withdraw:USER_BAL_LESS_THAN_AMT");

        uint256 share = amt.mul(WAD).div(totalSupply());
        uint256 bal   = IERC20(liquidityAsset).balanceOf(liquidityLocker);
        uint256 due   = share.mul(principalOut.add(bal)).div(WAD);

        uint256 ratio      = (WAD).mul(interestSum).div(principalOut.add(bal));          // interest/totalMoney ratio
        uint256 interest   = due.mul(ratio).div(WAD);                                    // Get nominal interest owned by sender
        uint256 priPenalty = principalPenalty.mul(due.sub(interest)).div(10000);         // Calculate flat principal penalty
        uint256 totPenalty = calcInterestPenalty(interest.add(priPenalty), msg.sender);  // Get total penalty, however it may be calculated
        
        due         = due.sub(totPenalty);                        // Remove penalty from due amount
        interestSum = interestSum.sub(interest).add(totPenalty);  // Update interest total reflecting withdrawn amount (distributes principal penalty as interest)

        _burn(msg.sender, amt); // TODO: Unit testing on _burn / _mint for ERC-2222
        require(IERC20(liquidityLocker).transfer(msg.sender, due), "Pool::ERR_WITHDRAW_TRANSFER");
        emit BalanceUpdated(liquidityLocker, liquidityAsset, IERC20(liquidityAsset).balanceOf(liquidityLocker));
    }

    /**
        @dev Fund a loan for amt, utilize the supplied dlFactory for debt lockers.
        @param  loan      Address of the loan to fund.
        @param  dlFactory The debt locker factory to utilize.
        @param  amt       Amount to fund the loan.
    */
    function fundLoan(address loan, address dlFactory, uint256 amt) external notDefunct finalized isDelegate {

        // Auth checks.
        require(
            IGlobals(globals).validLoanFactories(ILoan(loan).superFactory()),
            "Pool::fundLoan:ERR_LOAN_FACTORY_INVALID"
        );
        require(
            ILoanFactory(ILoan(loan).superFactory()).isLoan(loan),
            "Pool::fundLoan:ERR_LOAN_INVALID"
        );

        // Instantiate locker if it doesn't exist with this factory type.
        if (debtLockers[loan][dlFactory] == address(0)) {
            address debtLocker = IDebtLockerFactory(dlFactory).newLocker(loan);
            debtLockers[loan][dlFactory] = debtLocker;
        }
        
        principalOut += amt;

        // Fund loan.
        ILiquidityLocker(liquidityLocker).fundLoan(loan, debtLockers[loan][dlFactory], amt);
        
        emit LoanFunded(loan, debtLockers[loan][dlFactory], amt);
        emit BalanceUpdated(liquidityLocker, liquidityAsset, IERC20(liquidityAsset).balanceOf(liquidityLocker));
    }

    /**
        @dev Claim available funds for loan through specified debt locker factory.
        @param  loan      Address of the loan to claim from.
        @param  dlFactory The debt locker factory (always maps to a single debt locker).
        @return [0] = Total amount claimed.
                [1] = Interest portion claimed.
                [2] = Principal portion claimed.
                [3] = Fee portion claimed.
                [4] = Excess portion claimed.
                [5] = TODO: Liquidation portion claimed.
    */
    function claim(address loan, address dlFactory) public returns(uint[5] memory) { 
        
        uint[5] memory claimInfo = IDebtLocker(debtLockers[loan][dlFactory]).claim();

        // Distribute "interest" to appropriate parties.
        require(IERC20(liquidityAsset).transfer(poolDelegate, claimInfo[1].mul(delegateFee).div(10000)));
        require(IERC20(liquidityAsset).transfer(stakeLocker,  claimInfo[1].mul(stakingFee).div(10000)));

        // Distribute "fee" to poolDelegate.
        require(IERC20(liquidityAsset).transfer(poolDelegate, claimInfo[3]));

        // Transfer remaining balance (remaining interest + principal + excess + rounding error) to liqudityLocker
        uint remainder = IERC20(liquidityAsset).balanceOf(address(this));
        require(IERC20(liquidityAsset).transfer(liquidityLocker, remainder));

        // Update outstanding principal, the interest distribution mechanism.
        principalOut = principalOut.sub(claimInfo[2]).sub(claimInfo[4]); // Reversion here indicates critical error
        interestSum  = interestSum.add(claimInfo[1]).sub(claimInfo[1].mul(delegateFee).div(10000)).sub(claimInfo[1].mul(stakingFee).div(10000));

        // Update funds received for ERC-2222 StakeLocker tokens.
        IStakeLocker(stakeLocker).updateFundsReceived();

        emit BalanceUpdated(liquidityLocker, liquidityAsset, IERC20(liquidityAsset).balanceOf(liquidityLocker));
        emit BalanceUpdated(stakeLocker,     liquidityAsset, IERC20(liquidityAsset).balanceOf(stakeLocker));

        emit Claim(loan, claimInfo[1], claimInfo[2] + claimInfo[4], claimInfo[3]);

        return claimInfo;
    }

    /*these are to convert between FDT of 18 decim and liquidityasset locker of 0 to 256 decimals
    if we change the decimals on the FDT to match liquidityasset this would not be necessary
    but that will cause frontend interface complications!
    if we dont support decimals > 18, that would half this code, but some jerk probably has a higher decimal coin
    */
    function liq2FDT(uint256 _amt) internal view returns (uint256 _out) {
        if (liquidityAssetDecimals > 18) {
            _out = _amt.div(10**(liquidityAssetDecimals - 18));
        } else {
            uint _offset = 18 - liquidityAssetDecimals;
            _out = _amt.mul(10 ** _offset);
        }
        return _out;
    }

    // TODO: Optimize FDT2liq and liq2FDT
    // TODO: Consider removing the one below if not being used after withdraw() is implemented.
    function FDT2liq(uint256 _amt) internal view returns (uint256 _out) {
        if (liquidityAssetDecimals > 18) {
            _out = _amt.mul(10**(liquidityAssetDecimals - 18));
        } else {
            _out = _amt.div(10**(18 - liquidityAssetDecimals));
        }
        return _out;
    }

    /** 
     * This is to establish the function signatur by which an interest penalty will be calculated
     * The resulting value will be removed from the interest used in a repayment
    **/
    // TODO: Chris add NatSpec
    function calcInterestPenalty(uint256 interest, address who) public returns (uint256 out) {
        uint256 dTime    = (block.timestamp.sub(depositDate[who])).mul(WAD);
        uint256 unlocked = dTime.div(interestDelay).mul(interest) / WAD;

        out = unlocked > interest ? 0 : interest - unlocked;
    }

    // TODO: Chris add NatSpec
    function updateDepositDate(uint256 amt, address who) internal {
        if (depositDate[who] == 0) {
            depositDate[who] = block.timestamp;
        } else {
            uint256 depDate  = depositDate[who];
            uint256 coef     = (WAD.mul(amt)).div(balanceOf(who) + amt); // Yes, i want 0 if amt is too small
            depositDate[who] = (depDate.mul(WAD).add((block.timestamp.sub(depDate)).mul(coef))).div(WAD);  // date + (now - depDate) * coef
        }
    }

    // TODO: Chris add NatSpec
    function setInterestDelay(uint256 _interestDelay) public isDelegate {
        interestDelay = _interestDelay;
    }

    // TODO: Chris add NatSpec
    function setPrincipalPenalty(uint256 _principalPenalty) public isDelegate {
        principalPenalty = _principalPenalty;
    }

}