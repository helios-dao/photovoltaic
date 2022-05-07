import usdc from "./FakeUSDC.json";
import pool from "./Pool.json";
import poolFactory from "./PoolFactory.json";

export default {
  pool: pool.abi,
  poolFactory: poolFactory.abi,
  usdc: usdc.abi,
};
