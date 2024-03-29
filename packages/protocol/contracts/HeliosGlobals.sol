// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/IERC20Details.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/ISubFactory.sol";

interface ICalc { function calcType() external view returns (uint8); }

/// @title HeliosGlobals maintains a central source of parameters and allowlists for the Helios protocol.
contract HeliosGlobals {

    using SafeMath for uint256;

    address public immutable hls;         // The ERC-2222 Helios Token for the Helios protocol.

    address public pendingGovernor;       // The Governor that is declared for governorship transfer. Must be accepted for transfer to take effect.
    address public governor;              // The Governor responsible for management of global Helios variables.
    address public heliosTreasury;         // The HeliosTreasury is the Treasury where all fees pass through for conversion, prior to distribution.
    address public globalAdmin;           // The Global Admin of the whole network. Has the power to switch off/on the functionality of entire protocol.

    uint256 public defaultGracePeriod;    // Represents the amount of time a Borrower has to make a missed payment before a default can be triggered.
    uint256 public swapOutRequired;       // Represents minimum amount of Pool cover that a Pool Delegate has to provide before they can finalize a Pool.
    uint256 public fundingPeriod;         // Amount of time to allow a Borrower to drawdown on their Loan after funding period ends.
    uint256 public investorFee;           // Portion of drawdown that goes to the Pool Delegates and individual Lenders.
    uint256 public treasuryFee;           // Portion of drawdown that goes to the HeliosTreasury.
    uint256 public maxSwapSlippage;       // Maximum amount of slippage for Uniswap transactions.
    uint256 public minLoanEquity;         // Minimum amount of LoanFDTs required to trigger liquidations (basis points percentage of totalSupply).
    uint256 public stakerCooldownPeriod;  // Period (in secs) after which Stakers are allowed to unstake  their BPTs  from a StakeLocker.
    uint256 public lpCooldownPeriod;      // Period (in secs) after which LPs     are allowed to withdraw their funds from a Pool.
    uint256 public stakerUnstakeWindow;   // Window of time (in secs) after `stakerCooldownPeriod` that an account has to withdraw before their intent to unstake  is invalidated.
    uint256 public lpWithdrawWindow;      // Window of time (in secs) after `lpCooldownPeriod`     that an account has to withdraw before their intent to withdraw is invalidated.

    bool public protocolPaused;  // Switch to pause the functionality of the entire protocol.

    mapping(address => bool) public isValidLiquidityAsset;            // Mapping of valid Liquidity Assets.
    mapping(address => bool) public isValidCollateralAsset;           // Mapping of valid Collateral Assets.
    mapping(address => bool) public validCalcs;                       // Mapping of valid Calculators
    mapping(address => bool) public isValidPoolDelegate;              // Mapping of valid Pool Delegates (prevent unauthorized/unknown addresses from creating Pools).
    mapping(address => bool) public isValidBalancerPool;              // Mapping of valid Balancer Pools that Helios has approved for BPT staking.

    // Determines the liquidation path of various assets in Loans and the Treasury.
    // The value provided will determine whether or not to perform a bilateral or triangular swap on Uniswap.
    // For example, `defaultUniswapPath[WBTC][USDC]` value would indicate what asset to convert WBTC into before conversion to USDC.
    // If `defaultUniswapPath[WBTC][USDC] == USDC`, then the swap is bilateral and no middle asset is swapped.
    // If `defaultUniswapPath[WBTC][USDC] == WETH`, then swap WBTC for WETH, then WETH for USDC.
    mapping(address => mapping(address => address)) public defaultUniswapPath;

    mapping(address => address) public oracleFor;  // Chainlink oracle for a given asset.

    mapping(address => bool)                     public isValidPoolFactory;  // Mapping of valid Pool Factories.
    mapping(address => bool)                     public isValidLoanFactory;  // Mapping of valid Loan Factories.
    mapping(address => mapping(address => bool)) public validSubFactories;   // Mapping of valid sub factories.

    event                     Initialized();
    event              CollateralAssetSet(address asset, uint256 decimals, string symbol, bool valid);
    event               LiquidityAssetSet(address asset, uint256 decimals, string symbol, bool valid);
    event                       OracleSet(address asset, address oracle);
    event TransferRestrictionExemptionSet(address indexed exemptedContract, bool valid);
    event                 BalancerPoolSet(address balancerPool, bool valid);
    event              PendingGovernorSet(address indexed pendingGovernor);
    event                GovernorAccepted(address indexed governor);
    event                 GlobalsParamSet(bytes32 indexed which, uint256 value);
    event               GlobalsAddressSet(bytes32 indexed which, address addr);
    event                  ProtocolPaused(bool pause);
    event                  GlobalAdminSet(address indexed newGlobalAdmin);
    event                 PoolDelegateSet(address indexed delegate, bool valid);

    /**
        @dev Checks that `msg.sender` is the Governor.
    */
    modifier isGovernor() {
        require(msg.sender == governor, "MG:NOT_GOV");
        _;
    }

    /**
        @dev   Constructor function.
        @dev   It emits an `Initialized` event.
        @param _governor    Address of Governor.
        @param _hls         Address of the ERC-2222 Helios Token for the Helios protocol.
        @param _globalAdmin Address the Global Admin.
    */
    constructor(address _governor, address _hls, address _globalAdmin) public {
        governor             = _governor;
        hls                  = _hls;
        swapOutRequired      = 0;          // $0 of Pool cover; was $10,000
        fundingPeriod        = 10 days;
        defaultGracePeriod   = 5 days;
        investorFee          = 50;         // 0.5 %
        treasuryFee          = 50;         // 0.5 %
        maxSwapSlippage      = 1000;       // 10 %
        minLoanEquity        = 2000;       // 20 %
        globalAdmin          = _globalAdmin;
        stakerCooldownPeriod = 10 days;
        lpCooldownPeriod     = 10 days;
        stakerUnstakeWindow  = 2 days;
        lpWithdrawWindow     = 2 days;
        emit Initialized();
    }

    /************************/
    /*** Setter Functions ***/
    /************************/

    /**
        @dev  Sets the Staker cooldown period. This change will affect the existing cool down period for the Stakers that already intended to unstake.
              Only the Governor can call this function.
        @dev  It emits a `GlobalsParamSet` event.
        @param newCooldownPeriod New value for the cool down period.
    */
    function setStakerCooldownPeriod(uint256 newCooldownPeriod) external isGovernor {
        stakerCooldownPeriod = newCooldownPeriod;
        emit GlobalsParamSet("STAKER_COOLDOWN_PERIOD", newCooldownPeriod);
    }

    /**
        @dev   Sets the Liquidity Pool cooldown period. This change will affect the existing cool down period for the LPs that already intended to withdraw.
               Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param newCooldownPeriod New value for the cool down period.
    */
    function setLpCooldownPeriod(uint256 newCooldownPeriod) external isGovernor {
        lpCooldownPeriod = newCooldownPeriod;
        emit GlobalsParamSet("LP_COOLDOWN_PERIOD", newCooldownPeriod);
    }

    /**
        @dev   Sets the Staker unstake window. This change will affect the existing window for the Stakers that already intended to unstake.
               Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param newUnstakeWindow New value for the unstake window.
    */
    function setStakerUnstakeWindow(uint256 newUnstakeWindow) external isGovernor {
        stakerUnstakeWindow = newUnstakeWindow;
        emit GlobalsParamSet("STAKER_UNSTAKE_WINDOW", newUnstakeWindow);
    }

    /**
        @dev   Sets the Liquidity Pool withdraw window. This change will affect the existing window for the LPs that already intended to withdraw.
               Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param newLpWithdrawWindow New value for the withdraw window.
    */
    function setLpWithdrawWindow(uint256 newLpWithdrawWindow) external isGovernor {
        lpWithdrawWindow = newLpWithdrawWindow;
        emit GlobalsParamSet("LP_WITHDRAW_WINDOW", newLpWithdrawWindow);
    }

    /**
        @dev   Sets the allowed Uniswap slippage percentage, in basis points. Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param newMaxSlippage New max slippage percentage (in basis points)
    */
    function setMaxSwapSlippage(uint256 newMaxSlippage) external isGovernor {
        _checkPercentageRange(newMaxSlippage);
        maxSwapSlippage = newMaxSlippage;
        emit GlobalsParamSet("MAX_SWAP_SLIPPAGE", newMaxSlippage);
    }

    /**
      @dev   Sets the Global Admin. Only the Governor can call this function.
      @dev   It emits a `GlobalAdminSet` event.
      @param newGlobalAdmin New global admin address.
    */
    function setGlobalAdmin(address newGlobalAdmin) external {
        require(msg.sender == governor && newGlobalAdmin != address(0), "MG:NOT_GOV_OR_ADMIN");
        require(!protocolPaused, "MG:PROTO_PAUSED");
        globalAdmin = newGlobalAdmin;
        emit GlobalAdminSet(newGlobalAdmin);
    }

    /**
        @dev   Sets the validity of a Balancer Pool. Only the Governor can call this function.
        @dev   It emits a `BalancerPoolSet` event.
        @param balancerPool Address of Balancer Pool contract.
        @param valid        The new validity status of a Balancer Pool.
    */
    function setValidBalancerPool(address balancerPool, bool valid) external isGovernor {
        isValidBalancerPool[balancerPool] = valid;
        emit BalancerPoolSet(balancerPool, valid);
    }

    /**
      @dev   Sets the paused/unpaused state of the protocol. Only the Global Admin can call this function.
      @dev   It emits a `ProtocolPaused` event.
      @param pause Boolean flag to switch externally facing functionality in the protocol on/off.
    */
    function setProtocolPause(bool pause) external {
        require(msg.sender == globalAdmin, "MG:NOT_ADMIN");
        protocolPaused = pause;
        emit ProtocolPaused(pause);
    }

    /**
        @dev   Sets the validity of a PoolFactory. Only the Governor can call this function.
        @param poolFactory Address of PoolFactory.
        @param valid       The new validity status of a PoolFactory.
    */
    function setValidPoolFactory(address poolFactory, bool valid) external isGovernor {
        isValidPoolFactory[poolFactory] = valid;
    }

    /**
        @dev   Sets the validity of a LoanFactory. Only the Governor can call this function.
        @param loanFactory Address of LoanFactory.
        @param valid       The new validity status of a LoanFactory.
    */
    function setValidLoanFactory(address loanFactory, bool valid) external isGovernor {
        isValidLoanFactory[loanFactory] = valid;
    }

    /**
        @dev   Sets the validity of a sub factory as it relates to a super factory. Only the Governor can call this function.
        @param superFactory The core factory (e.g. PoolFactory, LoanFactory).
        @param subFactory   The sub factory used by core factory (e.g. LiquidityLockerFactory).
        @param valid        The new validity status of a subFactory within context of super factory.
    */
    function setValidSubFactory(address superFactory, address subFactory, bool valid) external isGovernor {
        require(isValidLoanFactory[superFactory] || isValidPoolFactory[superFactory], "MG:INVALID_SUPER_F");
        validSubFactories[superFactory][subFactory] = valid;
    }

    /**
        @dev   Sets the path to swap an asset through Uniswap. Only the Governor can call this function.
        @param from Asset being swapped.
        @param to   Final asset to receive. **
        @param mid  Middle asset.

        ** Set to == mid to enable a bilateral swap (single path swap).
           Set to != mid to enable a triangular swap (multi path swap).
    */
    function setDefaultUniswapPath(address from, address to, address mid) external isGovernor {
        defaultUniswapPath[from][to] = mid;
    }

    /**
        @dev   Sets the validity of a Pool Delegate (those allowed to create Pools). Only the Governor can call this function.
        @dev   It emits a `PoolDelegateSet` event.
        @param delegate Address to manage permissions for.
        @param valid    The new validity status of a Pool Delegate.
    */
    function setPoolDelegateAllowlist(address delegate, bool valid) external isGovernor {
        isValidPoolDelegate[delegate] = valid;
        emit PoolDelegateSet(delegate, valid);
    }

    /**
        @dev   Sets the validity of an asset for collateral. Only the Governor can call this function.
        @dev   It emits a `CollateralAssetSet` event.
        @param asset The asset to assign validity to.
        @param valid The new validity status of a Collateral Asset.
    */
    function setCollateralAsset(address asset, bool valid) external isGovernor {
        isValidCollateralAsset[asset] = valid;
        emit CollateralAssetSet(asset, IERC20Details(asset).decimals(), IERC20Details(asset).symbol(), valid);
    }

    /**
        @dev   Sets the validity of an asset for liquidity in Pools. Only the Governor can call this function.
        @dev   It emits a `LiquidityAssetSet` event.
        @param asset Address of the valid asset.
        @param valid The new validity status a Liquidity Asset in Pools.
    */
    function setLiquidityAsset(address asset, bool valid) external isGovernor {
        isValidLiquidityAsset[asset] = valid;
        emit LiquidityAssetSet(asset, IERC20Details(asset).decimals(), IERC20Details(asset).symbol(), valid);
    }

    /**
        @dev   Sets the validity of a calculator contract. Only the Governor can call this function.
        @param calc  Calculator address.
        @param valid The new validity status of a Calculator.
    */
    function setCalc(address calc, bool valid) external isGovernor {
        validCalcs[calc] = valid;
    }

    /**
        @dev   Sets the investor fee (in basis points). Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param _fee The fee, e.g., 50 = 0.50%.
    */
    function setInvestorFee(uint256 _fee) external isGovernor {
        _checkPercentageRange(treasuryFee.add(_fee));
        investorFee = _fee;
        emit GlobalsParamSet("INVESTOR_FEE", _fee);
    }

    /**
        @dev   Sets the treasury fee (in basis points). Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param _fee The fee, e.g., 50 = 0.50%.
    */
    function setTreasuryFee(uint256 _fee) external isGovernor {
        _checkPercentageRange(investorFee.add(_fee));
        treasuryFee = _fee;
        emit GlobalsParamSet("TREASURY_FEE", _fee);
    }

    /**
        @dev   Sets the HeliosTreasury. Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param _heliosTreasury New HeliosTreasury address.
    */
    function setHeliosTreasury(address _heliosTreasury) external isGovernor {
        require(_heliosTreasury != address(0), "MG:ZERO_ADDR");
        heliosTreasury = _heliosTreasury;
        emit GlobalsAddressSet("HELIOS_TREASURY", _heliosTreasury);
    }

    /**
        @dev   Sets the default grace period. Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param _defaultGracePeriod Number of seconds to set the grace period to.
    */
    function setDefaultGracePeriod(uint256 _defaultGracePeriod) external isGovernor {
        defaultGracePeriod = _defaultGracePeriod;
        emit GlobalsParamSet("DEFAULT_GRACE_PERIOD", _defaultGracePeriod);
    }

    /**
        @dev   Sets the minimum Loan equity. Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param _minLoanEquity Min percentage of Loan equity an account must have to trigger liquidations.
    */
    function setMinLoanEquity(uint256 _minLoanEquity) external isGovernor {
        _checkPercentageRange(_minLoanEquity);
        minLoanEquity = _minLoanEquity;
        emit GlobalsParamSet("MIN_LOAN_EQUITY", _minLoanEquity);
    }

    /**
        @dev   Sets the funding period. Only the Governor can call this function.
        @dev   It emits a `GlobalsParamSet` event.
        @param _fundingPeriod Number of seconds to set the drawdown grace period to.
    */
    function setFundingPeriod(uint256 _fundingPeriod) external isGovernor {
        fundingPeriod = _fundingPeriod;
        emit GlobalsParamSet("FUNDING_PERIOD", _fundingPeriod);
    }

    /**
        @dev   Sets the the minimum Pool cover required to finalize a Pool. Only the Governor can call this function. FIX
        @dev   It emits a `GlobalsParamSet` event.
        @param amt The new minimum swap out required.
    */
    function setSwapOutRequired(uint256 amt) external isGovernor {
        require(amt >= uint256(10_000), "MG:SWAP_OUT_TOO_LOW");
        swapOutRequired = amt;
        emit GlobalsParamSet("SWAP_OUT_REQUIRED", amt);
    }

    /**
        @dev   Sets a price feed's oracle. Only the Governor can call this function.
        @dev   It emits a `OracleSet` event.
        @param asset  Asset to update price for.
        @param oracle New oracle to use.
    */
    function setPriceOracle(address asset, address oracle) external isGovernor {
        oracleFor[asset] = oracle;
        emit OracleSet(asset, oracle);
    }

    /************************************/
    /*** Transfer Ownership Functions ***/
    /************************************/

    /**
        @dev   Sets a new Pending Governor. This address can become Governor if they accept. Only the Governor can call this function.
        @dev   It emits a `PendingGovernorSet` event.
        @param _pendingGovernor Address of new Pending Governor.
    */
    function setPendingGovernor(address _pendingGovernor) external isGovernor {
        require(_pendingGovernor != address(0), "MG:ZERO_ADDR");
        pendingGovernor = _pendingGovernor;
        emit PendingGovernorSet(_pendingGovernor);
    }

    /**
        @dev Accept the Governor position. Only the Pending Governor can call this function.
        @dev It emits a `GovernorAccepted` event.
    */
    function acceptGovernor() external {
        require(msg.sender == pendingGovernor, "MG:NOT_PENDING_GOV");
        governor        = msg.sender;
        pendingGovernor = address(0);
        emit GovernorAccepted(msg.sender);
    }

    /************************/
    /*** Getter Functions ***/
    /************************/

    /**
        @dev    Fetch price for asset from Chainlink oracles.
        @param  asset Asset to fetch price of.
        @return Price of asset in USD.
    */
    function getLatestPrice(address asset) external view returns (uint256) {
        return uint256(IOracle(oracleFor[asset]).getLatestPrice());
    }

    /**
        @dev   Checks that a subFactory is valid as it relates to a super factory.
        @param superFactory The core factory (e.g. PoolFactory, LoanFactory).
        @param subFactory   The sub factory used by core factory (e.g. LiquidityLockerFactory).
        @param factoryType  The type expected for the subFactory. References listed below.
                                0 = COLLATERAL_LOCKER_FACTORY
                                1 = DEBT_LOCKER_FACTORY
                                2 = FUNDING_LOCKER_FACTORY
                                3 = LIQUIDITY_LOCKER_FACTORY
                                4 = STAKE_LOCKER_FACTORY
    */
    function isValidSubFactory(address superFactory, address subFactory, uint8 factoryType) external view returns (bool) {
        return validSubFactories[superFactory][subFactory] && ISubFactory(subFactory).factoryType() == factoryType;
    }

    /**
        @dev   Checks that a Calculator is valid.
        @param calc     Calculator address.
        @param calcType Calculator type.
    */
    function isValidCalc(address calc, uint8 calcType) external view returns (bool) {
        return validCalcs[calc] && ICalc(calc).calcType() == calcType;
    }

    /**
        @dev    Returns the `lpCooldownPeriod` and `lpWithdrawWindow` as a tuple, for convenience.
        @return [0] = lpCooldownPeriod
                [1] = lpWithdrawWindow
    */
    function getLpCooldownParams() external view returns (uint256, uint256) {
        return (lpCooldownPeriod, lpWithdrawWindow);
    }

    /************************/
    /*** Helper Functions ***/
    /************************/

    /**
        @dev Checks that percentage is less than 100%.
    */
    function _checkPercentageRange(uint256 percentage) internal pure {
        require(percentage <= uint256(10_000), "MG:PCT_OOB");
    }

}
