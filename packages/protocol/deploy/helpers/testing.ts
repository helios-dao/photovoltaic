const { getContractAddress } = require('./helpers.ts');

const CHAIN_ID = 80001;

const createPool = async (bPoolAddress) => {
  const usdcAddress = await getContractAddress('USDC', CHAIN_ID);
  const slFactory = await hre.ethers.getContract('StakeLockerFactory');
  const llFactory = await hre.ethers.getContract('LiquidityLockerFactory');
  const poolFactory = await hre.ethers.getContract('PoolFactory');
  const index = await poolFactory.poolsCreated()
  const tx = await poolFactory.createPool(usdcAddress, bPoolAddress, slFactory.address, llFactory.address, 0, 0, 10 ** 13);
  await tx.await();
  const poolAddress = await poolFactory.pools(index);
  console.log(`Pool created at ${poolAddress}.`);
  const pool = await hre.ethers.getContractAt('Pool', poolAddress);
  await pool.finalize();
  await pool.setOpenToPublic(true);
  return poolAddress;
};

const deposit = async (poolAddress, amount) => {
  const usdcAddress = await getContractAddress('USDC', CHAIN_ID);
  const pool = await hre.ethers.getContractAt('Pool', poolAddress);
  const usdcToken = await hre.ethers.getContractAt('FakeUSDC', usdcAddress);
  await usdcToken.approve(pool.address, amount);
  await pool.deposit(amount);
  const totalAmount = await usdcToken.balanceOf(await pool.liquidityLocker());
  console.log(`Deposited $${amount}. Now $${totalAmount} in pool.`);
};

const createLoan = async (poolAddress, amount) => {
  const usdcAddress = await getContractAddress('USDC', CHAIN_ID);
  const flFactory = await hre.ethers.getContract('FundingLockerFactory');
  const clFactory = await hre.ethers.getContract('CollateralLockerFactory');
  const loanFactory = await hre.ethers.getContract('LoanFactory');
  const lateFeeCalc = await hre.ethers.getContract('LateFeeCalc');
  const premiumCalc = await hre.ethers.getContract('PremiumCalc');
  const repaymentCalc = await hre.ethers.getContract('RepaymentCalc');
  const index = await loanFactory.loansCreated()
  await loanFactory.createLoan(usdcAddress, usdcAddress, flFactory.address, clFactory.address, [1000, 365 * 6, 30, amount, 0], [repaymentCalc.address, lateFeeCalc.address, premiumCalc.address]);
  const loanAddress = await loanFactory.loans(index);
  console.log(`Loan created at ${loanAddress}.`);
  const dlFactory = await hre.ethers.getContract('DebtLockerFactory');
  const pool = await hre.ethers.getContractAt('Pool', poolAddress);
  await pool.fundLoan(loanAddress, dlFactory.address, amount);
  const loan = await hre.ethers.getContractAt('Loan', loanAddress);
  await loan.drawdown(amount);
  console.log('Loan funded');
};

/*
User-accessible stuff needed for launch:
- see all pools
- contribute to a pool
- see how much is contributed
Admin-accessible stuff needed for launch:
- create a pool
Admin stuff needed for later (soon after):
- create and fund a loan
- repay loan
User stuff needed for later (soon after):
- distribute repayments
*/

module.exports = {
  createPool,
  deposit,
  createLoan
};
