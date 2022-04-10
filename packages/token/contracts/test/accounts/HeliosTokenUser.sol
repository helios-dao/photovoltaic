// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

// TODO: odd bug not allowing IERC2222 selectors via IHeliosToken
import { IHeliosToken } from "../../interfaces/IHeliosToken.sol";
import { IERC2222 }    from "../../interfaces/IERC2222.sol";

import { ERC20User } from "./ERC20User.sol";

contract HeliosTokenUser is ERC20User {

    /************************/
    /*** Direct Functions ***/
    /************************/

    function fdt_withdrawFunds(address fdt) external {
        IHeliosToken(fdt).withdrawFunds();
    }

    function fdt_withdrawFundsOnBehalf(address fdt, address user) external {
        IHeliosToken(fdt).withdrawFundsOnBehalf(user);
    }

    function fdt_updateFundsReceived(address fdt) external {
        IHeliosToken(fdt).updateFundsReceived();
    }

    function mplToken_permit(
        address mplToken,
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        external
    {
        IHeliosToken(mplToken).permit(owner, spender, amount, deadline, v, r, s);
    }

    /*********************/
    /*** Try functions ***/
    /*********************/

    function try_fdt_withdrawFunds(address fdt) external returns (bool ok) {
        (ok,) = fdt.call(abi.encodeWithSelector(IERC2222.withdrawFunds.selector));
    }

    function try_fdt_withdrawFundsOnBehalf(address fdt, address user) external returns (bool ok) {
        (ok,) = fdt.call(abi.encodeWithSelector(IERC2222.withdrawFundsOnBehalf.selector, user));
    }

    function try_fdt_updateFundsReceived(address fdt) external returns (bool ok) {
        (ok,) = fdt.call(abi.encodeWithSelector(IERC2222.updateFundsReceived.selector));
    }

    function try_permit(
        address mplToken,
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        external returns (bool ok)
    {
        (ok,) = mplToken.call(abi.encodeWithSelector(IHeliosToken.permit.selector, owner, spender, amount, deadline, v, r, s));
    }

}
