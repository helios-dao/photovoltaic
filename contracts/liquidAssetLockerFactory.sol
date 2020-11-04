pragma solidity 0.7.0;
import "./liquidAssetLocker.sol";

contract liquidAssetLockerFactory {
	mapping(uint256 => address) private lockers;
	uint256 public lockersCreated;

	function newLocker(address _liquidAsset) external returns (address) {
		address _LPaddy = address(msg.sender);
		address _liquidLocker = address(
			new liquidAssetLocker(_liquidAsset, _LPaddy)
		);
		lockers[lockersCreated] = _liquidLocker;
		lockersCreated++;
		return _liquidLocker;
	}

	function getLocker(uint256 _ind) public view returns (address) {
		return lockers[_ind];
	}
}
