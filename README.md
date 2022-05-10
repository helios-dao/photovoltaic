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
| USDC                    | [0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747](https://mumbai.polygonscan.com/address/0xe6b8a5cf854791412c1f6efc7caf629f5df1c747) |
| HeliosToken              | [0xb7DdED5867c49040B765032412295047e113AeBa](https://mumbai.polygonscan.com/address/0xb7DdED5867c49040B765032412295047e113AeBa) |
| UniswapV2Router02       | [0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D](https://mumbai.polygonscan.io/address/0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D) |
| BFactory                | [0xB80296a2992b1d95B14af96F8c33d365E4f15226](https://mumbai.polygonscan.com/address/0x9C84391B443ea3a48788079a5f98e2EaD55c9309) |
| BPool                   | [0x306B91Bb278698F0552AD67805076711f162CCA4](https://mumbai.polygonscan.com/address/0x306B91Bb278698F0552AD67805076711f162CCA4) |
| HeliosGlobals            | [0x0bBf151826CAd245DE3fEc0628f5C8e78e22e5aD](https://mumbai.polygonscan.com/address/0x0bBf151826CAd245DE3fEc0628f5C8e78e22e5aD) |
| Util                    | [0x0BB0EE5510c0D4b9fa04c24A47313b790985C99e](https://mumbai.polygonscan.com/address/0x0BB0EE5510c0D4b9fa04c24A47313b790985C99e) |
| PoolLib                 | [0x64b0dD6Fef23172abfE34fae0B954FE66F270274](https://mumbai.polygonscan.com/address/0x64b0dD6Fef23172abfE34fae0B954FE66F270274) |
| LoanLib                 | [0xb143899EAcd22C1A744DdeeffCF0D5fa72274638](https://mumbai.polygonscan.com/address/0xb143899EAcd22C1A744DdeeffCF0D5fa72274638) |
| HeliosTreasury           | [0xF3f7Aaad3586d25089DaaC28b0493c2857e010a9](https://mumbai.polygonscan.com/address/0xF3f7Aaad3586d25089DaaC28b0493c2857e010a9) |
| RepaymentCalc           | [0xFD025e44ECE1D3099a869a27780135b00998F39b](https://mumbai.polygonscan.com/address/0xFD025e44ECE1D3099a869a27780135b00998F39b) |
| LateFeeCalc             | [0x021344E135Fa870b7BEdeE3f61ac745c9a4c5211](https://mumbai.polyygonscan.com/address/0x021344E135Fa870b7BEdeE3f61ac745c9a4c5211) |
| PremiumCalc             | [0x62E8311266bcaC3603b1c2d0528E0c86Ea127076](https://mumbai.polygonscan.com/address/0x62E8311266bcaC3603b1c2d0528E0c86Ea127076) |
| PoolFactory             | [0xE7E4320c9b36cC3E0CD2b6Cac56A4ca10A7A89DE](https://mumbai.polygonscan.com/address/0xE7E4320c9b36cC3E0CD2b6Cac56A4ca10A7A89DE) |
| StakeLockerFactory      | [0x85322f42ED83C64C4c41937Ae485733EB6896c06](https://mumbai.polygonscan.com/address/0x85322f42ED83C64C4c41937Ae485733EB6896c06) |
| LiquidityLockerFactory  | [0xa387a75585440791ddf23b58cF9E77a2918284D8](https://mumbai.polygonscan.io/address/0xa387a75585440791ddf23b58cF9E77a2918284D8) |
| DebtLockerFactory       | [0x0be0121bcE7A08C9A4260a49ff7747944994f4C6](https://mumbai.polygonscan.com/address/0x0be0121bcE7A08C9A4260a49ff7747944994f4C6) |
| LoanFactory             | [0x1e79Dc2aae758ad8dea0FbFeA2e38178518e859E](https://mumbai.polygonscan.com/address/0x1e79Dc2aae758ad8dea0FbFeA2e38178518e859E) |
| CollateralLockerFactory | [0xaC0F8d4C0b94584335A6D250A2768f45D1Ea7A61](https://mumbai.polygonscan.com/address/0xaC0F8d4C0b94584335A6D250A2768f45D1Ea7A61) |
| FundingLockerFactory    | [0x3f11b2d7958Dd5F1797A9CaAeBE6A315a4475350](https://mumbai.polygonscan.com/address/0x3f11b2d7958Dd5F1797A9CaAeBE6A315a4475350) |
| HlsRewardsFactory       | [0xe52eef7bD31dB7d6fEfB6985d6A8aC6872519f69](https://mumbai.polygonscan.com/address/0xe52eef7bD31dB7d6fEfB6985d6A8aC6872519f69) |

## Join us on Discord

<a href="https://discord.gg/tuNYQse">Helios Discord</a>

---

<p align="center">
  <img src="https://user-images.githubusercontent.com/44272939/116272804-33e78d00-a74f-11eb-97ab-77b7e13dc663.png" height="100" />
</p>
