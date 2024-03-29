// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

import "../../token/interfaces/IBaseFDT.sol";

contract Holder {
    function withdrawFunds(address token) external {
        IBaseFDT(token).withdrawFunds();
    }
}
