// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

import "./TestUtil.sol";

contract GulpTest is TestUtil {

    using SafeMath for uint256;

    function setUp() public {
        setUpGlobals();
        setUpTokens();
        setUpOracles();
        setUpFactories();
        setUpCalcs();
        setUpActors();
        setUpBalancerPoolForStakers();
        setUpLiquidityPool();
        createLoan();
    }

    function setUpLoanAndDrawdown() public {
        mint("USDC", address(leo), 10_000_000 * USD);  // Mint USDC to LP
        leo.approve(USDC, address(pool), MAX_UINT);    // LP approves USDC

        leo.deposit(address(pool), 10_000_000 * USD);                                      // LP deposits 10m USDC to Pool
        pat.fundLoan(address(pool), address(loan), address(dlFactory), 10_000_000 * USD);  // PD funds loan for 10m USDC

        uint256 cReq = loan.collateralRequiredForDrawdown(10_000_000 * USD);  // WETH required for 100_000_000 USDC drawdown on loan
        mint("WETH", address(bob), cReq);                                  // Mint WETH to borrower
        bob.approve(WETH, address(loan), MAX_UINT);                        // Borrower approves WETH
        bob.drawdown(address(loan), 10_000_000 * USD);                     // Borrower draws down 10m USDC
    }

    function test_gulp() public {

        Governor fakeGov = new Governor();
        fakeGov.setGovGlobals(globals);  // Point to globals created by gov

        gov.setGovTreasury(treasury);
        fakeGov.setGovTreasury(treasury);

        // Drawdown on loan will transfer fee to HLS token contract.
        setUpLoanAndDrawdown();

        // Treasury processes fees, sends to HLS token holders.
        // treasury.distributeToHolders();
        assertTrue(!fakeGov.try_distributeToHolders());
        assertTrue(     gov.try_distributeToHolders());

        uint256 totalFundsToken = usdc.balanceOf(address(hls));
        uint256 hlsBal          = hls.balanceOf(address(bPool));
        uint256 earnings        = hls.withdrawableFundsOf(address(bPool));

        assertEq(totalFundsToken, loan.principalOwed() * globals.treasuryFee() / 10_000);
        assertEq(hlsBal,          155_000 * WAD);
        withinDiff(earnings, totalFundsToken * hlsBal / hls.totalSupply(), 1);

        // HLS is held by Balancer Pool, claim on behalf of BPool.
        hls.withdrawFundsOnBehalf(address(bPool));

        uint256 usdcBal_preGulp = bPool.getBalance(USDC);

        bPool.gulp(USDC); // Update BPool with gulp(token).

        uint256 usdcBal_postGulp = bPool.getBalance(USDC);

        assertEq(usdcBal_preGulp,  1_550_000 * USD);
        assertEq(usdcBal_postGulp, usdcBal_preGulp + earnings); // USDC is transferred into Balancer pool, increasing value of HLS
    }

    function test_uniswap_pool_skim() public {
        setUpUniswapHlsUsdcPool(75_000 * WAD, 1_500_000 * USD);

        gov.setGovTreasury(treasury);
        // Drawdown on loan will transfer fee to HLS token contract.
        setUpLoanAndDrawdown();

        assertTrue(gov.try_distributeToHolders());

        uint256 totalFundsToken = IERC20(USDC).balanceOf(address(hls));
        uint256 hlsBal          = hls.balanceOf(address(uniswapPair));
        uint256 earnings        = hls.withdrawableFundsOf(address(uniswapPair));

        assertEq(totalFundsToken, loan.principalOwed() * globals.treasuryFee() / 10_000);
        assertEq(hlsBal,          75_000 * WAD);
        withinDiff(earnings, totalFundsToken * hlsBal / hls.totalSupply(), 1);

        (uint256 before_reserve0, uint256 before_reserve1, ) = uniswapPair.getReserves();

        // HLS is held by Balancer Pool, claim on behalf of BPool.
        hls.withdrawFundsOnBehalf(address(uniswapPair));

        (uint256 after_reserve0, uint256 after_reserve1, ) = uniswapPair.getReserves();

        assertEq(before_reserve0, after_reserve0, "Should not be any change in reserve0");
        assertEq(before_reserve1, after_reserve1, "Should not be any change in reserve1");

        uint256 usdcBal_preSkim     = usdc.balanceOf(address(uniswapPair));
        uint256 lex_usdcBal_preSkim = usdc.balanceOf(address(lex));

        uniswapPair.skim(address(lex)); // Get the extra fund out of it.

        uint256 usdcBal_postSkim     = usdc.balanceOf(address(uniswapPair));
        uint256 lex_usdcBal_postSkim = usdc.balanceOf(address(lex));

        (uint256 reserve0_afterSkim, uint256 reserve1_afterSkim, ) = uniswapPair.getReserves();

        assertEq(usdcBal_preSkim - usdcBal_postSkim,         earnings,       "Should only transfer earnings amount");
        assertEq(lex_usdcBal_postSkim - lex_usdcBal_preSkim, earnings,       "Should lex's USDC balance increase by earnings");
        assertEq(reserve0_afterSkim,                         after_reserve0, "Should not be a change");
        assertEq(reserve1_afterSkim,                         after_reserve1, "Should not be a change");
    }
}
