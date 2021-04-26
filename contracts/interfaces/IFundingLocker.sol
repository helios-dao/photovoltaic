// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface IFundingLocker {
    function liquidityAsset() external view returns (address);

    function loan() external view returns (address);

    function pull(address, uint256) external;

    function drain() external;
}
