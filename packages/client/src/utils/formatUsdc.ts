import { formatUnits } from "@ethersproject/units";
import { USDC_DECIMALS } from "src/constants";

const formatUsdc = (amount) => formatUnits(amount, USDC_DECIMALS);

export default formatUsdc;
