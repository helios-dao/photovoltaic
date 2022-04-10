// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

interface IHlsRewardsFactory {

    function globals() external view returns (address);

    function isHlsRewards(address) external view returns (bool);

    function setGlobals(address _globals) external;

    function createHlsRewards(address rewardsToken, address stakingToken) external returns (address mplRewards);

}
