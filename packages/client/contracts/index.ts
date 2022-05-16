import usdc from "./ERC20.json";
import pool from "./Pool.json";
import poolFactory from "./PoolFactory.json";
import globals from "./HeliosGlobals.json"
import stakeLockerFactory from "./StakeLockerFactory.json"
import liquidityLockerFactory from "./LiquidityLockerFactory.json"
import bPool from "./BPool.json"

export default {
  pool: pool.abi,
  poolFactory: poolFactory.abi,
  usdc: usdc.abi,
  globals: globals.abi,
  stakeLockerFactory: stakeLockerFactory.abi,
  liquidityLockerFactory: liquidityLockerFactory.abi,
  bPool: bPool.abi
};
