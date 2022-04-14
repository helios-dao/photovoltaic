// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

import "./TestUtil.sol";

contract HlsRewardsFactoryTest is TestUtil {

    function setUp() public {
        setUpGlobals();
        setUpHlsRewardsFactory();
    }

    function test_constructor() public {
        HlsRewardsFactory _hlsRewardsFactory = new HlsRewardsFactory(address(globals));  // Setup HlsRewardsFactory to support HlsRewards creation.
        assertEq(address(_hlsRewardsFactory.globals()), address(globals));
    }

    function test_createHlsRewards() public {
        address mockPool = address(1);  // Fake pool address so a pool doesn't have to be instantiated for PoolFDTs

        // Assert permissioning
        assertTrue(!fakeGov.try_createHlsRewards(address(hls), mockPool));
        assertTrue(     gov.try_createHlsRewards(address(hls), mockPool));

        HlsRewards hlsRewards = HlsRewards(gov.createHlsRewards(address(hls), mockPool));

        // Validate the storage of hlsRewardsFactory
        assertTrue(hlsRewardsFactory.isHlsRewards(address(hlsRewards)));

        // Validate the storage of hlsRewards.
        assertEq(address(hlsRewards.rewardsToken()), address(hls));
        assertEq(address(hlsRewards.stakingToken()),     mockPool);
        assertEq(hlsRewards.rewardsDuration(),             7 days);
        assertEq(address(hlsRewards.owner()),        address(gov));
    }

    function test_setGlobals() public {
        assertTrue(!fakeGov.try_setGlobals(address(hlsRewardsFactory), address(1)));
        assertTrue(     gov.try_setGlobals(address(hlsRewardsFactory), address(1)));
        assertEq(address(hlsRewardsFactory.globals()), address(1));
    }
}
