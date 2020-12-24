// SPDX-License-Identifier: MIT
pragma solidity >=0.6.11;

interface ICollateralLocker {
    function collateralAsset() external view returns (address);

    function loanVault() external view returns (address);

    function pull(address, uint256) external returns (bool);
}
