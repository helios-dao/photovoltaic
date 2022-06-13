## Background
Helios is a decentralized corporate credit market. Helios provides capital to institutional borrowers through globally accessible fixed-income yield opportunities.

For Borrowers, Helios offers **transparent and efficient financing done entirely on-chain.**

* Funds can leverage their reputation to borrow undercollateralized without constant fear of liquidation and margin calls
* Borrowers access pools of capital governed by smart contracts and liaise with Pool Delegates to confidentially complete loan assessments

For Liquidity Providers, Helios offers a **sustainable yield source through professionally managed lending pools.**

* Diversified exposure across premium borrowers with staked `HLS-<liquidityAsset>` 50-50 Balancer Pool Tokens (BPTs) providing reserve capital against loan defaults (E.g., HLS-USDC 50-50 BPTs for USDC Pools)
* Set and forget solution with diligence outsourced to Pool Delegates
* Interest is accrued and reinvested to enable capital to compound over time

For Pool Delegates, Helios is a **vehicle to attract funding and earn performance fees.**

* Helios is a new platform providing decentralised asset management infrastructure
* Globally accessible pools enable increased AUM from varied liquidity sources to be provided to networks of premium, creditworthy borrowers

## Technical Documentation

## Toolset

- <a href="https://github.com/dapphub/dapptools">dapptools</a>
- <a href="https://docs.soliditylang.org/en/v0.6.11/">Solidity 0.6.11</a>

## Development Setup

```sh
git clone git@github.com:helios-dao/protocol.git
cd protocol
yarn
```

## Dapp
To run dapp on localhost,
```
cd packages/client
yarn dev
```

## Testing

- To run all unit tests: `make test` (runs `./test.sh`)
- To run a specific unit test: `./test.sh <test_name>` (e.g. `./test.sh test_fundLoan`)

To alter number of fuzz runs, change the `--fuzz-runs` flag in `test.sh`. Note: Number of `--fuzz-runs` in `test.sh` should remain constant on push. Only change for local testing if needed.

## Audit Reports
| Auditor | Report link |
|---|---|

# Deployed Addresses

## Mainnet
### v1.0.0
| Contract | Address |
| -------- | ------- |

## Mumbai
### v1.0.0
| Contract | Address |
| -------- | ------- |
| USDC                    | [0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747](https://mumbai.polygonscan.com/address/0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747) |
| HeliosToken              | [0x1DECb99d0a0Cc5e8c7396c853A64d71C6eEe5683](https://mumbai.polygonscan.com/address/0x1DECb99d0a0Cc5e8c7396c853A64d71C6eEe5683) |
| UniswapV2Router02       | [0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D](https://mumbai.polygonscan.com/address/0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D) |
| BFactory                | [0xB80296a2992b1d95B14af96F8c33d365E4f15226](https://mumbai.polygonscan.com/address/0x9C84391B443ea3a48788079a5f98e2EaD55c9309) |
| BPool                   | [0x306B91Bb278698F0552AD67805076711f162CCA4](https://mumbai.polygonscan.com/address/0x306B91Bb278698F0552AD67805076711f162CCA4) |
| HeliosGlobals            | [0x5D6Ba1933d3A36365d1782147BEc1f1BE4DDfD21](https://mumbai.polygonscan.com/address/0x5D6Ba1933d3A36365d1782147BEc1f1BE4DDfD21) |
| Util                    | [0xa5E83f916524cf0B1084b6304149D79Fe6D293E6](https://mumbai.polygonscan.com/address/0xa5E83f916524cf0B1084b6304149D79Fe6D293E6) |
| PoolLib                 | [0xFd5901572A11d59Fc963C251cC1Ed62Eb55562B8](https://mumbai.polygonscan.com/address/0xFd5901572A11d59Fc963C251cC1Ed62Eb55562B8) |
| LoanLib                 | [0xB2eD0F800a34982339b23DA4F71d231c9fE6c955](https://mumbai.polygonscan.com/address/0xB2eD0F800a34982339b23DA4F71d231c9fE6c955) |
| HeliosTreasury           | [0xfEA3dd663eC9215257330791EDC72BF90FE43552](https://mumbai.polygonscan.com/address/0xfEA3dd663eC9215257330791EDC72BF90FE43552) |
| RepaymentCalc           | [0x72884391bAC6119D4F35Fc864ffBc40cB888AAa3](https://mumbai.polygonscan.com/address/0x72884391bAC6119D4F35Fc864ffBc40cB888AAa3) |
| LateFeeCalc             | [0xf35A8349168887C716DA579Ef69038c2d4Bff532](https://mumbai.polyygonscan.com/address/0xf35A8349168887C716DA579Ef69038c2d4Bff532) |
| PremiumCalc             | [0xb0989A37D912A361eCbef7e8B38bC8B4Dd059A84](https://mumbai.polygonscan.com/address/0xb0989A37D912A361eCbef7e8B38bC8B4Dd059A84) |
| PoolFactory             | [0xECc84723c46415899D225122f603eA8fEA2Dd5d1](https://mumbai.polygonscan.com/address/0xECc84723c46415899D225122f603eA8fEA2Dd5d1) |
| StakeLockerFactory      | [0xF5d9901878850B1Ba7823d7B5d3e6520b4FFAaF4](https://mumbai.polygonscan.com/address/0xF5d9901878850B1Ba7823d7B5d3e6520b4FFAaF4) |
| LiquidityLockerFactory  | [0x235FE370Fcbe5CbBe731BF3E1EB81456BFf7B7ba](https://mumbai.polygonscan.com/address/0x235FE370Fcbe5CbBe731BF3E1EB81456BFf7B7ba) |
| DebtLockerFactory       | [0x94b9Fe08EFC07ff5311196764310d1911dE233B9](https://mumbai.polygonscan.com/address/0x94b9Fe08EFC07ff5311196764310d1911dE233B9) |
| LoanFactory             | [0x759225A7CB027008c8fAF5bd4DD60D4E2240fE35](https://mumbai.polygonscan.com/address/0x759225A7CB027008c8fAF5bd4DD60D4E2240fE35) |
| CollateralLockerFactory | [0x921A1C2BAeBE36Ff2762a95930407960B4174ffF](https://mumbai.polygonscan.com/address/0x921A1C2BAeBE36Ff2762a95930407960B4174ffF) |
| FundingLockerFactory    | [0x912b2aB5bcC361A57d68Fe9E552d9AC48D9C193C](https://mumbai.polygonscan.com/address/0x912b2aB5bcC361A57d68Fe9E552d9AC48D9C193C) |
| HlsRewardsFactory       | [0x1B81e2745C95a12879aA5151eE6eBCeD6d5E2565](https://mumbai.polygonscan.com/address/0x1B81e2745C95a12879aA5151eE6eBCeD6d5E2565) |
| ChainlinkOracle         | [0x306B91Bb278698F0552AD67805076711f162CCA4](https://mumbai.polygonscan.com/address/0x306B91Bb278698F0552AD67805076711f162CCA4) |

## Join us on Discord

<a href="https://discord.gg/tuNYQse">Helios Discord</a>

---

<p align="center">
  <img src="https://user-images.githubusercontent.com/44272939/116272804-33e78d00-a74f-11eb-97ab-77b7e13dc663.png" height="100" />
</p>
