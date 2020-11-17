pragma solidity 0.7.0;

interface IGlobals {
  function governor() external view returns (address);
  function mapleToken() external view returns (address);
  function mapleTreasury() external view returns (address);
  function establishmentFeeBasisPoints() external view returns (uint);
  function treasuryFeeBasisPoints() external view returns (uint);
  function gracePeriod() external view returns (uint);
  function stakeAmountRequired() external view returns (uint);
}