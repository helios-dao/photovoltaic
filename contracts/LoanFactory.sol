// SPDX-License-Identifier: MIT
pragma solidity >=0.6.11;

import "./Loan.sol";
import "./library/TokenUUID.sol";

interface ICalc { function calcType() external returns (bytes32); }

/// @title LoanFactory instantiates Loan contracts.
contract LoanFactory {

    using SafeMath for uint256;

    uint8 public constant COLLATERAL_LOCKER_FACTORY  = 0;   // Factory type of `CollateralLockerFactory`.
    uint8 public constant FUNDING_LOCKER_FACTORY     = 2;   // Factory type of `FundingLockerFactory`.

    address public immutable globals;  // The MapleGlobals.sol contract.

    uint256 public loansCreated;  // Incrementor for number of loan vaults created.

    mapping(uint256 => address) public loans;
    mapping(address => bool)    public isLoan;

    event LoanCreated(
        string  indexed tUUID,
        address loan,
        address indexed borrower,
        address indexed loanAsset,
        address collateralAsset,
        address collateralLocker,
        address fundingLocker,
        uint256[6] specs,
        address[3] calcs,
        string name,
        string symbol
    );
    
    constructor(address _globals) public {
        globals   = _globals;
    }

    // Authorization to call Treasury functions.
    modifier isGovernor() {
        require(msg.sender == IGlobals(globals).governor(), "LoanFactory::ERR_MSG_SENDER_NOT_GOVERNOR");
        _;
    }

    /**
        @dev Create a new Loan.
        @param  loanAsset       Asset the loan will raise funding in.
        @param  collateralAsset Asset the loan will use as collateral.
        @param  flFactory       The factory to instantiate a Funding Locker from.
        @param  clFactory       The factory to instantiate a Collateral Locker from.
        @param  specs           Contains specifications for this loan.
                specs[0] = apr
                specs[1] = termDays
                specs[2] = paymentIntervalDays
                specs[3] = minRaise
                specs[4] = collateralRatio
                specs[5] = fundingPeriodDays
        @param  calcs           The calculators used for the loan.
                calcs[0] = repaymentCalc
                calcs[1] = lateFeeCalc
                calcs[2] = premiumCalc
        @return Address of the instantiated Loan.
    */
    function createLoan(
        address loanAsset,
        address collateralAsset,
        address flFactory,
        address clFactory,
        uint256[6] memory specs,
        address[3] memory calcs
    ) public returns (address) {

        // Pre-checks.
        address interestCalc = calcs[0];
        address lateFeeCalc  = calcs[1];
        address premiumCalc  = calcs[2];

        require(
            IGlobals(globals).isValidSubFactory(address(this), flFactory, FUNDING_LOCKER_FACTORY),
            "LoanFactory::createLoan:ERR_INVALID_FUNDING_LOCKER_FACTORY"
        );
        require(
            IGlobals(globals).isValidSubFactory(address(this), clFactory, COLLATERAL_LOCKER_FACTORY),
            "LoanFactory::createLoan:ERR_INVALID_FUNDING_COLLATERAL_FACTORY"
        );
        require(
            IGlobals(globals).isValidCalc(interestCalc) && ICalc(interestCalc).calcType() == "INTEREST",
            "LoanFactory::createLoan:ERR_NULL_INTEREST_STRUCTURE_CALC"
        );
        require(
            IGlobals(globals).isValidCalc(lateFeeCalc) && ICalc(lateFeeCalc).calcType() == "LATEFEE",
            "LoanFactory::createLoan:ERR_NULL_LATE_FEE_CALC"
        );
        require(
            IGlobals(globals).isValidCalc(premiumCalc) && ICalc(premiumCalc).calcType() == "PREMIUM",
            "LoanFactory::createLoan:ERR_NULL_PREMIUM_CALC"
        );
        
        // Deploy loan vault contract.
	    string memory tUUID = TokenUUID.generateUUID(loansCreated + 1);

        Loan loan = new Loan(
            msg.sender,
            loanAsset,
            collateralAsset,
            flFactory,
            clFactory,
            globals,
            specs,
            [interestCalc, lateFeeCalc, premiumCalc],
            tUUID
        );

        // Update LoanFactory identification mappings.
        loans[loansCreated]   = address(loan);
        isLoan[address(loan)] = true;

        // Emit event.
        emit LoanCreated(
            tUUID,
            address(loan),
            msg.sender,
            loanAsset,
            collateralAsset,
            loan.collateralLocker(),
            loan.fundingLocker(),
            specs,
            [interestCalc, lateFeeCalc, premiumCalc],
            loan.name(),
            loan.symbol()
        );

        // Increment loanVaultCreated (IDs), return loan address.
        loansCreated++;
        return address(loan);
    }
    
}