// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./interfaces/IHeliosGlobals.sol";

import "./HlsRewards.sol";

/// @title HlsRewardsFactory instantiates HlsRewards contracts.
contract HlsRewardsFactory {

    IHeliosGlobals public globals;  // Instance of HeliosGlobals, used to retrieve the current Governor.

    mapping(address => bool) public isHlsRewards;  // True only if an HlsRewards was created by this factory.

    event HlsRewardsCreated(address indexed rewardsToken, address indexed stakingToken, address indexed hlsRewards, address owner);

    constructor(address _globals) public {
        globals = IHeliosGlobals(_globals);
    }

    /**
        @dev   Updates the HeliosGlobals instance. Only the Governor can call this function.
        @param _globals Address of new HeliosGlobals contract.
    */
    function setGlobals(address _globals) external {
        require(msg.sender == globals.governor(), "RF:NOT_GOV");
        globals = IHeliosGlobals(_globals);
    }

    /**
        @dev   Instantiates a HlsRewards contract. Only the Governor can call this function.
        @dev   It emits a `HlsRewardsCreated` event.
        @param rewardsToken Address of the rewards token (will always be HLS).
        @param stakingToken Address of the staking token (token used to stake to earn rewards).
                            (i.e., Pool address for PoolFDT mining, StakeLocker address for staked BPT mining.)
        @return hlsRewards  Address of the instantiated HlsRewards.
    */
    function createHlsRewards(address rewardsToken, address stakingToken) external returns (address hlsRewards) {
        require(msg.sender == globals.governor(), "RF:NOT_GOV");
        hlsRewards               = address(new HlsRewards(rewardsToken, stakingToken, msg.sender));
        isHlsRewards[hlsRewards] = true;

        emit HlsRewardsCreated(rewardsToken, stakingToken, hlsRewards, msg.sender);
    }

}
