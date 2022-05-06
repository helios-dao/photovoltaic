import { parseUnits } from "@ethersproject/units";
import { USDC_DECIMALS } from "src/constants";

const parseUsdc = (amount) => parseUnits(amount, USDC_DECIMALS);

export default parseUsdc;
