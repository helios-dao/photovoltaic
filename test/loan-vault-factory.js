const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");

const DAIAddress = require("../../contracts/localhost/addresses/MintableTokenDAI.address.js");
const DAIABI = require("../../contracts/localhost/abis/MintableTokenDAI.abi.js");
const USDCAddress = require("../../contracts/localhost/addresses/MintableTokenUSDC.address.js");
const USDCABI = require("../../contracts/localhost/abis/MintableTokenUSDC.abi.js");
const MPLAddress = require("../../contracts/localhost/addresses/MapleToken.address.js");
const MPLABI = require("../../contracts/localhost/abis/MapleToken.abi.js");
const WETHAddress = require("../../contracts/localhost/addresses/WETH9.address.js");
const WETHABI = require("../../contracts/localhost/abis/WETH9.abi.js");
const WBTCAddress = require("../../contracts/localhost/addresses/WBTC.address.js");
const WBTCABI = require("../../contracts/localhost/abis/WBTC.abi.js");
const LVFactoryAddress = require("../../contracts/localhost/addresses/LoanVaultFactory.address.js");
const LVFactoryABI = require("../../contracts/localhost/abis/LoanVaultFactory.abi.js");
const FLFAddress = require("../../contracts/localhost/addresses/LoanVaultFundingLockerFactory.address.js");
const FLFABI = require("../../contracts/localhost/abis/LoanVaultFundingLockerFactory.abi.js");
const CLFAddress = require("../../contracts/localhost/addresses/LoanVaultCollateralLockerFactory.address.js");
const CLFABI = require("../../contracts/localhost/abis/LoanVaultCollateralLockerFactory.abi.js");
const LALFAddress = require("../../contracts/localhost/addresses/LiquidAssetLockerFactory.address.js");
const LALFABI = require("../../contracts/localhost/abis/LiquidAssetLockerFactory.abi.js");
const GlobalsAddress = require("../../contracts/localhost/addresses/MapleGlobals.address.js");
const GlobalsABI = require("../../contracts/localhost/abis/MapleGlobals.abi.js");
const LoanVaultABI = require("../../contracts/localhost/abis/LoanVault.abi.js");
const LoanVaultFundingLockerFactoryAbi = require("../../contracts/localhost/abis/LoanVaultFundingLockerFactory.abi.js");

describe("LoanVault.sol", function () {
  const BUNK_ADDRESS = "0x0000000000000000000000000000000000000000";
  const BUNK_ADDRESS_V2 = "0x0000000000000000000000000000000000000001";

  let DAI,
    USDC,
    MPL,
    WETH,
    WBTC,
    LoanVaultFactory,
    FundingLockerFactory,
    CollateralLockerFactory,
    Globals;

  before(async () => {
    DAI = new ethers.Contract(DAIAddress, DAIABI, ethers.provider.getSigner(0));
    USDC = new ethers.Contract(
      USDCAddress,
      USDCABI,
      ethers.provider.getSigner(0)
    );
    MPL = new ethers.Contract(MPLAddress, MPLABI, ethers.provider.getSigner(0));
    WETH = new ethers.Contract(
      WETHAddress,
      WETHABI,
      ethers.provider.getSigner(0)
    );
    WBTC = new ethers.Contract(
      WBTCAddress,
      WBTCABI,
      ethers.provider.getSigner(0)
    );
    LoanVaultFactory = new ethers.Contract(
      LVFactoryAddress,
      LVFactoryABI,
      ethers.provider.getSigner(0)
    );
    FundingLockerFactory = new ethers.Contract(
      FLFAddress,
      FLFABI,
      ethers.provider.getSigner(0)
    );
    CollateralLockerFactory = new ethers.Contract(
      CLFAddress,
      CLFABI,
      ethers.provider.getSigner(0)
    );
    LiquidLockerFactory = new ethers.Contract(
      LALFAddress,
      LALFABI,
      ethers.provider.getSigner(0)
    );
    Globals = new ethers.Contract(
      GlobalsAddress,
      GlobalsABI,
      ethers.provider.getSigner(0)
    );
  });

  let vaultAddress;

  it("test invalid instantiations from loanVault from factory", async function () {
    
    // Revert validity of BUNK_ADDRESS for repaymentCalculator AND premiumCalculator.
    await expect(Globals.setRepaymentCalculatorValidity(BUNK_ADDRESS, false));
    await expect(Globals.setPremiumCalculatorValidity(BUNK_ADDRESS, false));

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 0, 0, 0, 0, 0, 0], 
        BUNK_ADDRESS, 
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_NUMBER_OF_PAYMENTS_LESS_THAN_1"
    );

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 0, 0, 0, 0, 0], 
        BUNK_ADDRESS, 
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_INVALID_PAYMENT_INTERVAL_SECONDS"
    );

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 2592000, 0, 0, 0, 0],
        BUNK_ADDRESS,
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_MIN_RAISE_ABOVE_DESIRED_RAISE_OR_MIN_RAISE_EQUALS_ZERO"
    );

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 2592000, 100000000, 0, 0, 0],
        BUNK_ADDRESS,
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_MIN_RAISE_ABOVE_DESIRED_RAISE_OR_MIN_RAISE_EQUALS_ZERO"
    );

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 2592000, 100000001, 100000000, 0, 0],
        BUNK_ADDRESS,
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_MIN_RAISE_ABOVE_DESIRED_RAISE_OR_MIN_RAISE_EQUALS_ZERO"
    );

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 2592000, 100000000, 500000000, 0, 0],
        BUNK_ADDRESS,
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_INVALID_REPAYMENT_CALCULATOR"
    );

    // Temporarily set repaymentCalculator validity of address(0) to TRUE.
    await Globals.setRepaymentCalculatorValidity(BUNK_ADDRESS, true);

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 2592000, 100000000, 500000000, 0, 0],
        BUNK_ADDRESS,
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_INVALID_PREMIUM_CALCULATOR"
    );

    // Temporarily set premiumCalculator validity of BUNK_ADDRESS to TRUE.
    await Globals.setPremiumCalculatorValidity(BUNK_ADDRESS, true);

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 2592000, 100000000, 500000000, 0, 0],
        BUNK_ADDRESS,
        BUNK_ADDRESS
      )
    ).to.be.revertedWith(
      "LoanVault::prepareLoan:ERR_FUNDING_PERIOD_LESS_THAN_86400"
    );
    
  });


  it("instantiate loanVault from factory", async function () {

    // Confirm incrementor pre/post-checks.
    const preIncrementorValue = await LoanVaultFactory.loanVaultsCreated();

    await expect(
      LoanVaultFactory.createLoanVault(
        DAIAddress,
        WETHAddress,
        FLFAddress,
        CLFAddress,
        "QuantFundLoan",
        "QFL",
        [1000, 1, 2592000, 100000000, 500000000, 0, 86400],
        BUNK_ADDRESS,
        BUNK_ADDRESS
      )
    );

    const postIncrementorValue = await LoanVaultFactory.loanVaultsCreated();

    expect(parseInt(postIncrementorValue["_hex"]) - 1).to.equals(
      parseInt(preIncrementorValue["_hex"])
    );

    // Fetch address of the LoanVault, confirm the address passes isLoanVault() identifcation check.
    const loanVaultAddress = await LoanVaultFactory.getLoanVault(
      preIncrementorValue
    );
    vaultAddress = loanVaultAddress;

    const isLoanVault = await LoanVaultFactory.isLoanVault(loanVaultAddress);

    expect(isLoanVault);

    let LoanVaultContract = new ethers.Contract(
      loanVaultAddress,
      LoanVaultABI,
      ethers.provider.getSigner(0)
    );

    const fundingLockerAddress = await LoanVaultContract.fundingLocker();
    const owner = await FundingLockerFactory.getOwner(fundingLockerAddress);

    expect(vaultAddress).to.equals(owner);

  });

  it("confirm loanVault borrower, other state vars, and specifications", async function () {
    LoanVault = new ethers.Contract(
      vaultAddress,
      LoanVaultABI,
      ethers.provider.getSigner(0)
    );

    const accounts = await ethers.provider.listAccounts();
    const borrower = await LoanVault.borrower();
    expect(borrower).to.equals(accounts[0]);

    // Ensure that state variables of new LoanVault has proper values.
    const APR_BIPS = await LoanVault.aprBips();
    const NUMBER_OF_PAYMENTS = await LoanVault.numberOfPayments();
    const PAYMENT_INTERVAL_SECONDS = await LoanVault.paymentIntervalSeconds();
    const MIN_RAISE = await LoanVault.minRaise();
    const DESIRED_RAISE = await LoanVault.desiredRaise();
    const COLLATERAL_AT_DESIRED_RAISE = await LoanVault.collateralAtDesiredRaise();
    const REPAYMENT_CALCULATOR = await LoanVault.repaymentCalculator();
    const PREMIUM_CALCULATOR = await LoanVault.premiumCalculator();
    const LOAN_STATE = await LoanVault.loanState();

    expect(parseInt(APR_BIPS["_hex"])).to.equals(1000);
    expect(parseInt(NUMBER_OF_PAYMENTS["_hex"])).to.equals(1);
    expect(parseInt(PAYMENT_INTERVAL_SECONDS["_hex"])).to.equals(2592000);
    expect(parseInt(MIN_RAISE["_hex"])).to.equals(100000000);
    expect(parseInt(DESIRED_RAISE["_hex"])).to.equals(500000000);
    expect(parseInt(COLLATERAL_AT_DESIRED_RAISE["_hex"])).to.equals(0);
    expect(REPAYMENT_CALCULATOR).to.equals(BUNK_ADDRESS);
    expect(PREMIUM_CALCULATOR).to.equals(BUNK_ADDRESS);
    expect(LOAN_STATE).to.equals(1);

    // Ensure that the LoanVault was issued and assigned a valid FundingLocker.
    const FUNDING_LOCKER = await LoanVault.fundingLocker();
    const IS_VALID_FUNDING_LOCKER = await FundingLockerFactory.verifyLocker(
      FUNDING_LOCKER
    );
    const FUNDING_LOCKER_OWNER = await FundingLockerFactory.getOwner(
      FUNDING_LOCKER
    );

    expect(FUNDING_LOCKER).to.not.equals(BUNK_ADDRESS);
    expect(IS_VALID_FUNDING_LOCKER);
    expect(FUNDING_LOCKER_OWNER).to.equals(vaultAddress);
    
  });

});
