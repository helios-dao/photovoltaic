// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import "./LP.sol";

import "../../HlsRewards.sol";

import "../../interfaces/IPool.sol";

contract Farmer is LP {

    HlsRewards public hlsRewards;
    IERC20     public poolFDT;

    constructor(HlsRewards _hlsRewards, IERC20 _poolFDT) public {
        hlsRewards = _hlsRewards;
        poolFDT    = _poolFDT;
    }

    /************************/
    /*** DIRECT FUNCTIONS ***/
    /************************/

    function approve(address account, uint256 amt) public {
        poolFDT.approve(account, amt);
    }

    function increaseCustodyAllowance(address pool, address account, uint256 amt) public {
        IPool(pool).increaseCustodyAllowance(account, amt);
    }

    function transfer(address asset, address to, uint256 amt) public {
        IERC20(asset).transfer(to, amt);
    }

    function stake(uint256 amt) public {
        hlsRewards.stake(amt);
    }

    function withdraw(uint256 amt) public {
        hlsRewards.withdraw(amt);
    }

    function getReward() public {
        hlsRewards.getReward();
    }

    function exit() public {
        hlsRewards.exit();
    }

    /*********************/
    /*** TRY FUNCTIONS ***/
    /*********************/

    function try_stake(uint256 amt) external returns (bool ok) {
        string memory sig = "stake(uint256)";
        (ok,) = address(hlsRewards).call(abi.encodeWithSignature(sig, amt));
    }

    function try_withdraw(uint256 amt) external returns (bool ok) {
        string memory sig = "withdraw(uint256)";
        (ok,) = address(hlsRewards).call(abi.encodeWithSignature(sig, amt));
    }

    function try_increaseCustodyAllowance(address pool, address account, uint256 amt) external returns (bool ok) {
        string memory sig = "increaseCustodyAllowance(address,uint256)";
        (ok,) = pool.call(abi.encodeWithSignature(sig, account, amt));
    }
}
