# To do a first deploy:
1. run `yarn` to install all deps
2. Get an account on https://app.tryethernal.com and login using `yarn ethernal login`
3. `yarn hardhat node` to run test node on localhost. Will also compile and deploy.
4. done? you should see your contract on https://app.tryethernal.com

# How deploying the whole protocol would work:
- need to figure out which contracts need to be deployed. The live list here is probably the full list: https://github.com/maple-labs/maple-core#mainnet
- see below for detailed list of contracts
- in hardhat, we'd write deploy scripts under /deploy(/protocol), in order of what needs to be deployed first. Each contract might need deploy arguments, which we'll need to figure out


# Contracts
key:
- own contracts that we need to deploy: -*
- third party contracts we need to deploy: -+

-+ Governor, GlobalAdmin, SecurityAdmin: those look like (old) gnosis proxies. Can we use new gnosis proxies? probably yes
- USDC, WBTC, WETH9: the external tokens of the same name
-* HeliosToken: the underlying token, would need to be renamed
- UniswapV2Router02: the uniswap router contract, used to "Liquidates a Borrower's collateral, when a default is triggered."
- BFactory: the Balancer pool factory. Don't think it's used outside of tests?
- ChainLinkAggregatorWBTC: lib?
-+ BPool: the HLS/USDC pool, used for staking HLS tokens
-* HeliosGlobals: contract that holds a bunch of config variables for the entire protocol
- Util: util lib that's imported in a bunch of contracts... does it really need to be deployed?
- PoolLib: pool lib; necessary?
- LoanLib: loan lib; necessary?
-* HeliosTreasury: the treasury, holds all the money
-* RepaymentCalc:
-* LateFeeCalc:
-* PremiumCalc:
-* PoolFactory:
-* StakeLockerFactory:
-* LiquidityLockerFactory:
-* DebtLockerFactory:
-* LoanFactory:
-* CollateralLockerFactory:
-* FundingLockerFactory:
-* HlsRewardsFactory:
-* PriceOracleUSDC: oracle (named UsdOracle)
-* PriceOracleWBTC: oracle (named ChainlinkOracle)
-+ one more gnosis proxy to be the owner of the PriceOracleWBTC

4/1/22:
- protocol successfully deployed locally (apparently)
- next steps:
  x add token to deploy scripts
  x update deploy scripts to include actual dependency addresses
  x replace mentions of Helios with Helios in contracts
  x deploy to testnet
  * figure out which functions are used by the dapp (check transactions for each live Helios contract for clues)
  * write some integration tests?

4/8/22 TODO:
- run and pass existing tests
- choose a chain (Avalanche or Polygon) and deploy on its testnet
