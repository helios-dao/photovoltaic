// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

import "./TestUtil.sol";

import "./user/Custodian.sol";

contract PoolCustodialTest is TestUtil {

    using SafeMath for uint256;

    uint256 principalOut;        // Total outstanding principal of Pool
    uint256 liquidityLockerBal;  // Total liquidityAsset balance of LiquidityLocker
    uint256 fdtTotalSupply;      // PoolFDT total supply
    uint256 interestSum;         // FDT accounting of interest earned
    uint256 poolLosses;          // FDT accounting of recognizable losses

    TestObj withdrawableFundsOf_fay;  // FDT accounting of interest
    TestObj withdrawableFundsOf_fez;  // FDT accounting of interest
    TestObj withdrawableFundsOf_fox;  // FDT accounting of interest

    TestObj hlsEarnings_fay;  // HLS earnings from yield farming
    TestObj hlsEarnings_fez;  // HLS earnings from yield farming
    TestObj hlsEarnings_fox;  // HLS earnings from yield farming

    function setUp() public {
        setUpGlobals();
        setUpTokens();
        setUpOracles();
        setUpFactories();
        setUpCalcs();
        setUpActors();
        createBalancerPool(100_000 * USD, 10_000 * USD);
        transferBptsToPoolDelegates();
        setUpLiquidityPool();
        setUpHlsRewardsFactory();
        setUpHlsRewards();
        createFarmers();
    }

    function updateState() internal {
        // Update pre state
        withdrawableFundsOf_fay.pre = withdrawableFundsOf_fay.post;
        withdrawableFundsOf_fez.pre = withdrawableFundsOf_fez.post;
        withdrawableFundsOf_fox.pre = withdrawableFundsOf_fox.post;

        hlsEarnings_fay.pre = hlsEarnings_fay.post;
        hlsEarnings_fez.pre = hlsEarnings_fez.post;
        hlsEarnings_fox.pre = hlsEarnings_fox.post;

        // Update post state
        principalOut       = pool.principalOut();
        liquidityLockerBal = usdc.balanceOf(pool.liquidityLocker());
        fdtTotalSupply     = pool.totalSupply();
        interestSum        = pool.interestSum();
        poolLosses         = pool.poolLosses();

        withdrawableFundsOf_fay.post = pool.withdrawableFundsOf(address(fay));
        withdrawableFundsOf_fez.post = pool.withdrawableFundsOf(address(fez));
        withdrawableFundsOf_fox.post = pool.withdrawableFundsOf(address(fox));

        hlsEarnings_fay.post = hlsRewards.earned(address(fay));
        hlsEarnings_fez.post = hlsRewards.earned(address(fez));
        hlsEarnings_fox.post = hlsRewards.earned(address(fox));
    }

    function test_interest_plus_farming(uint256 depositAmt1, uint256 depositAmt2, uint256 depositAmt3) public {
        uint256 start = block.timestamp;

        // Set up fuzzing amounts
        depositAmt1 = constrictToRange(depositAmt1, 1000 * USD, 10_000_000 * USD, true);
        depositAmt2 = constrictToRange(depositAmt2, 1000 * USD, 10_000_000 * USD, true);
        depositAmt3 = constrictToRange(depositAmt3, 1000 * USD, 10_000_000 * USD, true);

        /**********************************************************************/
        /*** Fay and Fez both deposit into the pool and start yield farming ***/
        /**********************************************************************/
        setUpFarming(300_000 * WAD, 180 days);

        mintFundsAndDepositIntoPool(fay, pool, depositAmt1, depositAmt1);
        stakeIntoFarm(fay, toWad(depositAmt1));

        mintFundsAndDepositIntoPool(fez, pool, depositAmt2, depositAmt2);
        stakeIntoFarm(fez, toWad(depositAmt2));

        uint256 totalDeposits = depositAmt1 + depositAmt2;

        /**********************/
        /*** Pre-Loan State ***/
        /**********************/
        updateState();

        assertEq(withdrawableFundsOf_fay.post, 0);
        assertEq(withdrawableFundsOf_fez.post, 0);
        assertEq(withdrawableFundsOf_fox.post, 0);

        assertEq(hlsEarnings_fay.post, 0);
        assertEq(hlsEarnings_fez.post, 0);
        assertEq(hlsEarnings_fox.post, 0);

        /*************************************************************/
        /*** Create Loan, draw down, make payment, claim from Pool ***/
        /*************************************************************/
        {
            uint256[5] memory specs = [500, 180, 30, totalDeposits, 2000];
            createLoan(specs);
            pat.fundLoan(address(pool), address(loan), address(dlFactory), totalDeposits);
            drawdown(loan, bob, totalDeposits);
            hevm.warp(loan.nextPaymentDue());  // Will affect yield farming
            doPartialLoanPayment(loan, bob);
            pat.claim(address(pool), address(loan), address(dlFactory));
        }

        // Update variables to reflect change in accounting from last dTime
        updateState();
        uint256 dTime = block.timestamp - start;

        uint256 interest          = interestSum;
        uint256 totalHlsDisbursed = hlsRewards.rewardRate() * dTime;

        uint256 poolApy = toApy(interest,          totalDeposits, dTime);
        uint256 hlsApy  = toApy(totalHlsDisbursed, toWad(totalDeposits), dTime);

        /***********************************/
        /*** Post One Loan Payment State ***/
        /***********************************/
        withinPrecision(withdrawableFundsOf_fay.post, calcPortion(depositAmt1, interestSum, totalDeposits), 6);
        withinPrecision(withdrawableFundsOf_fez.post, calcPortion(depositAmt2, interestSum, totalDeposits), 6);

        assertEq(withdrawableFundsOf_fox.post, 0);

        withinPrecision(hlsEarnings_fay.post, calcPortion(depositAmt1, totalHlsDisbursed, totalDeposits), 10);
        withinPrecision(hlsEarnings_fez.post, calcPortion(depositAmt2, totalHlsDisbursed, totalDeposits), 10);

        assertEq(hlsEarnings_fox.post, 0);

        withinDiff(toApy(withdrawableFundsOf_fay.post, depositAmt1, dTime), poolApy, 1);
        withinDiff(toApy(withdrawableFundsOf_fez.post, depositAmt2, dTime), poolApy, 1);

        withinDiff(toApy(hlsEarnings_fay.post, toWad(depositAmt1), dTime), hlsApy, 1);
        withinDiff(toApy(hlsEarnings_fez.post, toWad(depositAmt2), dTime), hlsApy, 1);

        /***********************************************************/
        /*** Fox deposits into the pool and starts yield farming ***/
        /***********************************************************/
        mintFundsAndDepositIntoPool(fox, pool, depositAmt3, depositAmt3);
        stakeIntoFarm(fox, toWad(depositAmt3));

        totalDeposits = totalDeposits + depositAmt3;

        /********************************************/
        /*** Make second payment, claim from Pool ***/
        /********************************************/
        hevm.warp(loan.nextPaymentDue() - 6 hours);  // Will affect yield farming (using a different timestamp just for the sake of yield farming assertions)
        doPartialLoanPayment(loan, bob);
        pat.claim(address(pool), address(loan), address(dlFactory));

        // Update variables to reflect change in accounting from last dTime
        updateState();
        dTime = block.timestamp - start - dTime;

        totalHlsDisbursed = hlsRewards.rewardRate() * dTime;
        interest          = interestSum - interest;

        poolApy = toApy(interest,          totalDeposits, dTime);
        hlsApy  = toApy(totalHlsDisbursed, toWad(totalDeposits), dTime);

        /***********************************/
        /*** Post One Loan Payment State ***/
        /***********************************/
        withinPrecision(withdrawableFundsOf_fay.post, withdrawableFundsOf_fay.pre + calcPortion(depositAmt1, interest, totalDeposits), 6);
        withinPrecision(withdrawableFundsOf_fez.post, withdrawableFundsOf_fez.pre + calcPortion(depositAmt2, interest, totalDeposits), 6);
        withinPrecision(withdrawableFundsOf_fox.post,                               calcPortion(depositAmt3, interest, totalDeposits), 6);

        withinPrecision(hlsEarnings_fay.post, hlsEarnings_fay.pre + calcPortion(depositAmt1, totalHlsDisbursed, totalDeposits), 10);
        withinPrecision(hlsEarnings_fez.post, hlsEarnings_fez.pre + calcPortion(depositAmt2, totalHlsDisbursed, totalDeposits), 10);
        withinPrecision(hlsEarnings_fox.post,                       calcPortion(depositAmt3, totalHlsDisbursed, totalDeposits), 10);

        withinDiff(toApy(withdrawableFundsOf_fay.post - withdrawableFundsOf_fay.pre, depositAmt1, dTime), poolApy, 1);
        withinDiff(toApy(withdrawableFundsOf_fez.post - withdrawableFundsOf_fez.pre, depositAmt2, dTime), poolApy, 1);
        withinDiff(toApy(withdrawableFundsOf_fox.post,                               depositAmt3, dTime), poolApy, 1);

        withinDiff(toApy(hlsEarnings_fay.post - hlsEarnings_fay.pre, toWad(depositAmt1), dTime), hlsApy, 1);
        withinDiff(toApy(hlsEarnings_fez.post - hlsEarnings_fez.pre, toWad(depositAmt2), dTime), hlsApy, 1);
        withinDiff(toApy(hlsEarnings_fox.post,                       toWad(depositAmt3), dTime), hlsApy, 1);
    }

    function test_custody_and_transfer(uint256 depositAmt, uint256 custodyAmt1, uint256 custodyAmt2) public {
        Custodian custodian1 = new Custodian();  // Custodial contract for PoolFDTs - will start out as liquidity mining but could be broader DeFi eventually
        Custodian custodian2 = new Custodian();  // Custodial contract for PoolFDTs - will start out as liquidity mining but could be broader DeFi eventually

        depositAmt  = constrictToRange(depositAmt,  100, 1E9,            true);  // $1 - $1b
        custodyAmt1 = constrictToRange(custodyAmt1,  40, depositAmt / 2, true);  // $1 - half of deposit
        custodyAmt2 = constrictToRange(custodyAmt2,  40, depositAmt / 2, true);  // $1 - half of deposit

        mintFundsAndDepositIntoPool(fay, pool, depositAmt * USD, depositAmt * USD);
        mintFundsAndDepositIntoPool(fez, pool, depositAmt * USD, depositAmt * USD);

        pat.setLockupPeriod(address(pool), 0);

        // Convert all amounts to WAD, USD not needed for the rest of the test
        depositAmt  *= WAD;
        custodyAmt1 *= WAD;
        custodyAmt2 *= WAD;

        // Testing failure modes with Fay
        assertTrue(!fay.try_increaseCustodyAllowance(address(pool), address(0),              depositAmt));  // P:INVALID_ADDRESS
        assertTrue(!fay.try_increaseCustodyAllowance(address(pool), address(custodian1),              0));  // P:INVALID_AMT
        assertTrue(!fay.try_increaseCustodyAllowance(address(pool), address(custodian1), depositAmt + 1));  // P:INSUF_BALANCE
        assertTrue( fay.try_increaseCustodyAllowance(address(pool), address(custodian1),     depositAmt));  // Fay can custody entire balance

        // Testing state transition and transfers with Fez
        assertEq(pool.custodyAllowance(address(fez), address(custodian1)), 0);
        assertEq(pool.totalCustodyAllowance(address(fez)),                 0);

        fez.increaseCustodyAllowance(address(pool), address(custodian1), custodyAmt1);

        assertEq(pool.custodyAllowance(address(fez), address(custodian1)), custodyAmt1);  // Fez gives custody to custodian 1
        assertEq(pool.totalCustodyAllowance(address(fez)),                 custodyAmt1);  // Total custody allowance goes up

        fez.increaseCustodyAllowance(address(pool), address(custodian2), custodyAmt2);

        assertEq(pool.custodyAllowance(address(fez), address(custodian2)),               custodyAmt2);  // Fez gives custody to custodian 2
        assertEq(pool.totalCustodyAllowance(address(fez)),                 custodyAmt1 + custodyAmt2);  // Total custody allowance goes up

        uint256 transferableAmt = depositAmt - custodyAmt1 - custodyAmt2;

        assertEq(pool.balanceOf(address(fez)), depositAmt);
        assertEq(pool.balanceOf(address(fox)),          0);

        assertTrue(!fez.try_transfer(address(pool), address(fox), transferableAmt + 1));  // Fez cannot transfer more than balance - totalCustodyAllowance
        assertTrue( fez.try_transfer(address(pool), address(fox),     transferableAmt));  // Fez can transfer transferableAmt

        assertEq(pool.balanceOf(address(fez)), depositAmt - transferableAmt);
        assertEq(pool.balanceOf(address(fox)), transferableAmt);
    }

    function test_custody_and_withdraw(uint256 depositAmt, uint256 custodyAmt) public {
        Custodian custodian = new Custodian();

        depositAmt = constrictToRange(depositAmt, 1, 1E9,        true);  // $1 - $1b
        custodyAmt = constrictToRange(custodyAmt, 1, depositAmt, true);  // $1 - deposit

        mintFundsAndDepositIntoPool(fez, pool, depositAmt * USD, depositAmt * USD);

        pat.setLockupPeriod(address(pool), 0);

        assertEq(pool.custodyAllowance(address(fez), address(custodian)), 0);
        assertEq(pool.totalCustodyAllowance(address(fez)),                0);

        fez.increaseCustodyAllowance(address(pool), address(custodian), custodyAmt * WAD);

        assertEq(pool.custodyAllowance(address(fez), address(custodian)), custodyAmt * WAD);
        assertEq(pool.totalCustodyAllowance(address(fez)),                custodyAmt * WAD);

        uint256 withdrawableAmt = (depositAmt - custodyAmt) * USD;

        assertEq(pool.balanceOf(address(fez)), depositAmt * WAD);

        make_withdrawable(fez, pool);

        assertTrue(!fez.try_withdraw(address(pool), withdrawableAmt + 1));
        assertTrue( fez.try_withdraw(address(pool),     withdrawableAmt));

        assertEq(pool.balanceOf(address(fez)), custodyAmt * WAD);
        assertEq(usdc.balanceOf(address(fez)), withdrawableAmt);
    }

    function test_transferByCustodian(uint256 depositAmt, uint256 custodyAmt) public {
        Custodian custodian = new Custodian();  // Custodial contract for PoolFDTs - will start out as liquidity mining but could be broader DeFi eventually

        depositAmt  = constrictToRange(depositAmt, 1, 1E9,        true);  // $1 - $1b
        custodyAmt  = constrictToRange(custodyAmt, 1, depositAmt, true);  // $1 - deposit

        mintFundsAndDepositIntoPool(fay, pool, depositAmt * USD, depositAmt * USD);

        depositAmt  *= WAD;
        custodyAmt  *= WAD;

        fay.increaseCustodyAllowance(address(pool), address(custodian), custodyAmt);

        assertEq(pool.custodyAllowance(address(fay), address(custodian)), custodyAmt);  // Fay gives custody to custodian
        assertEq(pool.totalCustodyAllowance(address(fay)),                custodyAmt);  // Total custody allowance goes up

        assertTrue(!custodian.try_transferByCustodian(address(pool), address(fay), address(fox),     custodyAmt));  // P:INVALID_RECEIVER
        assertTrue(!custodian.try_transferByCustodian(address(pool), address(fay), address(fay),              0));  // P:INVALID_AMT
        assertTrue(!custodian.try_transferByCustodian(address(pool), address(fay), address(fay), custodyAmt + 1));  // P:INSUF_ALLOWANCE
        assertTrue( custodian.try_transferByCustodian(address(pool), address(fay), address(fay),     custodyAmt));  // Able to transfer custody amount back

        assertEq(pool.custodyAllowance(address(fay), address(custodian)), 0);  // Custodian allowance has been reduced
        assertEq(pool.totalCustodyAllowance(address(fay)),                0);  // Total custody allowance has been reduced, giving Fay access to funds again
    }
}
