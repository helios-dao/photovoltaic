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
const FLFAddress = require("../../contracts/localhost/addresses/FundingLockerFactory.address.js");
const FLFABI = require("../../contracts/localhost/abis/FundingLockerFactory.abi.js");
const GlobalsAddress = require("../../contracts/localhost/addresses/MapleGlobals.address.js");
const GlobalsABI = require("../../contracts/localhost/abis/MapleGlobals.abi.js");
const LoanVaultABI = require("../../contracts/localhost/abis/LoanVault.abi.js");

describe("create 1000 DAI loan, fund 500 DAI, drawdown 20% wBTC collateralized loan", function () {

  const BUNK_ADDRESS = "0x0000000000000000000000000000000000000020";

  let DAI,USDC,MPL,WETH,WBTC;
  let LoanVaultFactory,FundingLockerFactory,CollateralLockerFactory;
  let Globals,accounts;

  before(async () => {
    accounts = await ethers.provider.listAccounts();
    DAI = new ethers.Contract(DAIAddress, DAIABI, ethers.provider.getSigner(0));
    DAI_EXT_1 = new ethers.Contract(DAIAddress, DAIABI, ethers.provider.getSigner(1));
    DAI_EXT_2 = new ethers.Contract(DAIAddress, DAIABI, ethers.provider.getSigner(2));
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
    Globals = new ethers.Contract(
      GlobalsAddress,
      GlobalsABI,
      ethers.provider.getSigner(0)
    );
  });

  let vaultAddress;

  it("createLoanVault(), requesting 1000 DAI", async function () {

    
    // Grab preIncrementor to get LoanVaultID
    // Note: consider networkVersion=1 interactions w.r.t. async flow
    const preIncrementorValue = await LoanVaultFactory.loanVaultsCreated();

    // 5% APR, 90 Day Term, 30 Day Interval, 1000 DAI, 20% Collateral, 7 Day Funding Period
    await LoanVaultFactory.createLoanVault(
      DAIAddress,
      WBTCAddress,
      [500, 90, 30, BigNumber.from(10).pow(18).mul(1000), 2000, 7], 
      ethers.utils.formatBytes32String('BULLET')
    )
    
    vaultAddress = await LoanVaultFactory.getLoanVault(preIncrementorValue);

  });

  it("fund loan for 500 DAI", async function () {

    await DAI_EXT_1.mintSpecial(accounts[1], 500)
    await DAI_EXT_1.approve(vaultAddress,BigNumber.from(10).pow(18).mul(500))

    LoanVault = new ethers.Contract(
      vaultAddress,
      LoanVaultABI,
      ethers.provider.getSigner(1)
    );

    // Fund loan with 500 DAI
    await LoanVault.fundLoan(
      BigNumber.from(10).pow(18).mul(500),
      accounts[1]
    )

  });

  it("view collateral amount required", async function () {

    LoanVault = new ethers.Contract(
      vaultAddress,
      LoanVaultABI,
      ethers.provider.getSigner(0)
    );

    const drawdownAmount_500DAI = await LoanVault.collateralRequiredForDrawdown(
      BigNumber.from(10).pow(18).mul(500)
    )

    // console.log(parseInt(drawdownAmount_500DAI["_hex"]))

  });

  it("drawdown 500 DAI and commence the loan (failure)", async function () {

    LoanVault = new ethers.Contract(
      vaultAddress,
      LoanVaultABI,
      ethers.provider.getSigner(0)
    );

    const drawdownAmount_500DAI = await LoanVault.collateralRequiredForDrawdown(
      BigNumber.from(10).pow(18).mul(500)
    )

    await WBTC.approve(
      vaultAddress,
      BigNumber.from(10).pow(8).mul(Math.round(parseInt(drawdownAmount_500DAI["_hex"]) / 10**6)).mul(100)
    )
    
    await expect(
      LoanVault.drawdown(BigNumber.from(10).pow(18).mul(1000))
    ).to.be.revertedWith("LoanVault::endFunding::ERR_DRAWDOWN_AMOUNT_ABOVE_FUNDING_LOCKER_BALANCE");

    await expect(
      LoanVault.drawdown(BigNumber.from(10).pow(18).mul(500))
    ).to.be.revertedWith("LoanVault::endFunding::ERR_DRAWDOWN_AMOUNT_BELOW_MIN_RAISE");
    
  });

  it("fund 1000 more DAI", async function () {

    await DAI_EXT_1.mintSpecial(accounts[1], 1000)
    await DAI_EXT_1.approve(vaultAddress,BigNumber.from(10).pow(18).mul(1000))

    LoanVault = new ethers.Contract(
      vaultAddress,
      LoanVaultABI,
      ethers.provider.getSigner(1)
    );

    // Fund loan with 1000 USDC
    await LoanVault.fundLoan(
      BigNumber.from(10).pow(18).mul(1000),
      accounts[1]
    )
    
  });

  it("drawdown 1000 DAI and commence loan", async function () {

    LoanVault = new ethers.Contract(
      vaultAddress,
      LoanVaultABI,
      ethers.provider.getSigner(0)
    );

    const drawdownAmount_1000DAI = await LoanVault.collateralRequiredForDrawdown(
      BigNumber.from(10).pow(18).mul(1000)
    )

    await WBTC.approve(
      vaultAddress,
      BigNumber.from(10).pow(8).mul(Math.round(parseInt(drawdownAmount_1000DAI["_hex"]) / 10**4)).mul(10000)
    )
    
    
    const PRE_LOCKER_BALANCE = await LoanVault.getFundingLockerBalance();
    const PRE_BORROWER_BALANCE = await DAI.balanceOf(accounts[0]);
    const PRE_LOANVAULT_BALANCE = await DAI.balanceOf(vaultAddress);

    await LoanVault.drawdown(BigNumber.from(10).pow(18).mul(1000));
    
    const POST_LOCKER_BALANCE = await LoanVault.getFundingLockerBalance();
    const POST_BORROWER_BALANCE = await DAI.balanceOf(accounts[0]);
    const POST_LOANVAULT_BALANCE = await DAI.balanceOf(vaultAddress);

    // Confirm the state of various contracts.
    
    const LoanVaultState = await LoanVault.loanState();

    expect(LoanVaultState).to.equals(1);

    expect(
      parseInt(POST_BORROWER_BALANCE["_hex"]) - parseInt(PRE_BORROWER_BALANCE["_hex"])
    ).to.be.greaterThan(parseInt(BigNumber.from(10).pow(18).mul(1000)["_hex"]));

    expect(
      parseInt(PRE_LOCKER_BALANCE["_hex"]) - parseInt(POST_LOCKER_BALANCE["_hex"])
    ).to.equals(parseInt(BigNumber.from(10).pow(18).mul(1500)["_hex"]));

    expect(
      parseInt(POST_LOANVAULT_BALANCE["_hex"]) - parseInt(PRE_LOANVAULT_BALANCE["_hex"])
    ).to.equals(parseInt(BigNumber.from(10).pow(18).mul(500)["_hex"]));
    
  });

});