// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;

import { IHeliosToken } from "./interfaces/IHeliosToken.sol";

import { ERC2222 } from "./ERC2222.sol";

contract HeliosToken is IHeliosToken, ERC2222 {

    bytes32 public immutable override DOMAIN_SEPARATOR;

    // bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)");
    bytes32 public constant override PERMIT_TYPEHASH = 0xfc77c2b9d30fe91687fd39abb7d16fcdfe1472d065740051ab8b13e4bf4a617f;

    mapping (address => uint256) public override nonces;

    /**
        @dev Instantiates the HeliosToken.
        @param name       Name of the token.
        @param symbol     Symbol of the token.
        @param fundsToken The asset claimable / distributed via ERC-2222, deposited to HeliosToken contract.
     */
    constructor (
        string memory name,
        string memory symbol,
        address fundsToken,
        uint256 amount
    ) ERC2222(name, symbol, fundsToken) public {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(name)),
                keccak256(bytes('1')),
                chainId,
                address(this)
            )
        );

        require(address(fundsToken) != address(0), "HeliosToken:INVALID_FUNDS_TOKEN");
        require(amount >= 0, "HeliosToken:INVALID_MINT_AMNT");
        _mint(msg.sender, amount * 10 ** 18);
    }

    /**
        @dev Approve by signature.
        @param owner    Owner address that signed the permit
        @param spender  Spender of the permit
        @param amount   Permit approval spend limit
        @param deadline Deadline after which the permit is invalid
        @param v        ECDSA signature v component
        @param r        ECDSA signature r component
        @param s        ECDSA signature s component
     */
    function permit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external override {
        require(deadline >= block.timestamp, 'HeliosToken:EXPIRED');
        bytes32 digest = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, amount, nonces[owner]++, deadline))
            )
        );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress == owner, 'HeliosToken:INVALID_SIGNATURE');
        _approve(owner, spender, amount);
    }

}
