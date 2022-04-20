const { getUSDCAddress } = require('./helpers.ts');

const createPool = async (bPoolAddress) => {
  const slFactory = await hre.ethers.getContract('StakeLockerFactory');
  const llFactory = await hre.ethers.getContract('LiquidityLockerFactory');
  const poolFactory = await hre.ethers.getContract('PoolFactory');
  const usdcToken = getUSDCAddress();
  const index = await poolFactory.poolsCreated()
  await poolFactory.createPool(usdcToken, bPoolAddress, slFactory.address, llFactory.address, 0, 0, 10 ** 13);
  const poolAddress = await poolFactory.pools(index);
  console.log(`Pool created at ${poolAddress}.`);
  const pool = await hre.ethers.getContractAt('Pool', poolAddress);
  await pool.finalize();
  await pool.setOpenToPublic(true);
  return poolAddress;
};

const deposit = async (poolAddress, amount) => {
  const pool = await hre.ethers.getContractAt('Pool', poolAddress);
  const usdcToken = await hre.ethers.getContract('FakeUSDC');
  await usdcToken.approve(pool.address, amount);
  await pool.deposit(amount);
  const totalAmount = await usdcToken.balanceOf(await pool.liquidityLocker());
  console.log(`Deposited $${amount}. Now $${totalAmount} in pool.`);
};

const createLoan = async (poolAddress, amount) => {
  const flFactory = await hre.ethers.getContract('FundingLockerFactory');
  const clFactory = await hre.ethers.getContract('CollateralLockerFactory');
  const loanFactory = await hre.ethers.getContract('LoanFactory');
  const usdcToken = getUSDCAddress();
  const lateFeeCalc = await hre.ethers.getContract('LateFeeCalc');
  const premiumCalc = await hre.ethers.getContract('PremiumCalc');
  const repaymentCalc = await hre.ethers.getContract('RepaymentCalc');
  const index = await loanFactory.loansCreated()
  await loanFactory.createLoan(usdcToken, usdcToken, flFactory.address, clFactory.address, [1000, 365 * 6, 30, amount, 0], [repaymentCalc.address, lateFeeCalc.address, premiumCalc.address]);
  const loanAddress = await loanFactory.loans(index);
  console.log(`Loan created at ${loanAddress}.`);
  const dlFactory = await hre.ethers.getContract('DebtLockerFactory');
  const pool = await hre.ethers.getContractAt('Pool', poolAddress);
  await pool.fundLoan(loanAddress, dlFactory.address, amount);
  const loan = await hre.ethers.getContractAt('Loan', loanAddress);
  await loan.drawdown(amount);
  console.log('Loan funded');
};

module.exports = {
  createPool,
  deposit,
  createLoan
};
