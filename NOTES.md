# To do a first deploy:
0. prereq - have node@16 installed for hardhat compatibility

[CN] - which directories were you in when you ran these commands?

1. run `yarn` to install all deps
2. Get an account on https://app.tryethernal.com and login using `yarn ethernal login`
[CN] - had issues between 2 and 3. I needed to add default network to harthat-config.js. 
3. `yarn hardhat node` to run test node on localhost. Will also compile and deploy.
4. done? you should see your contract on https://app.tryethernal.com

[CN] - do you find using yarn instead of direct npx hardhat commands to be better?

# How deploying the whole protocol would work:
- need to figure out which contracts need to be deployed. The live list here is probably the full list: https://github.com/maple-labs/maple-core#mainnet
- see below for detailed list of contracts
- in hardhat, we'd write deploy scripts under /deploy(/protocol), in order of what needs to be deployed first. Each contract might need deploy arguments, which we'll need to figure out
    - [CN] - think this will help us figure out relationships between the contracts: https://github.com/maple-labs/maple-core/wiki/Smart-Contract-Architecture
    - Maple Global seems to be first



# Contracts
key:
- own contracts that we need to deploy: -*
- third party contracts we need to deploy: -+

-+ Governor, GlobalAdmin, SecurityAdmin: those look like (old) gnosis proxies. Can we use new gnosis proxies? probably yes  
     - address public globalAdmin;  // The Global Admin of the whole network. Has the power to switch off/on the functionality of entire protocol. 
- USDC, WBTC, WETH9: the external tokens of the same name
-* MapleToken: the underlying token, would need to be renamed
- UniswapV2Router02: the uniswap router contract, used to "Liquidates a Borrower's collateral, when a default is triggered."
- BFactory: the Balancer pool factory. Don't think it's used outside of tests?
- ChainLinkAggregatorWBTC: lib?
-+ BPool: the MPL/USDC pool, used for staking MPL tokens
-* MapleGlobals: contract that holds a bunch of config variables for the entire protocol
- Util: util lib that's imported in a bunch of contracts... does it really need to be deployed?
- PoolLib: pool lib; necessary?
- LoanLib: loan lib; necessary?
- MapleTreasury: the treasury, holds all the money
- RepaymentCalc: lib; necessary?
- LateFeeCalc: lib; necessary?
- PremiumCalc: lib; necessary?
-* PoolFactory:
-* StakeLockerFactory:
-* LiquidityLockerFactory:
-* DebtLockerFactory:
-* LoanFactory:
-* CollateralLockerFactory:
-* FundingLockerFactory:
-* MplRewardsFactory:
-* PriceOracleUSDC: oracle (named UsdOracle)
-* PriceOracleWBTC: oracle (named ChainlinkOracle)

# Ethernal Commands
To listen for transactions:
```
ETHERNAL_EMAIL=your@email.com ETHERNAL_PASSWORD=yourpwd ethernal listen
```

# Debugging
1. Heap OOO errors - https://stackoverflow.com/questions/53230823/fatal-error-ineffective-mark-compacts-near-heap-limit-allocation-failed-javas
2. 