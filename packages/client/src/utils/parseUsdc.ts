import { parseUnits } from "@ethersproject/units";
import { USDC_DECIMALS } from "src/constants";

const parseUsdc = (amount: string) => parseUnits(amount, USDC_DECIMALS);

export default parseUsdc;
