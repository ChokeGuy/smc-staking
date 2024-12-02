// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.27;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract StakingRewards{
    IERC20 public stakeToken;
    IERC20 public rewardToken;

    address public owner;
    
    uint256 public duration;
    uint256 public endTime;
    uint256 public rewardRate;
    uint256 public totalRewardAmount;

    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public userBlock;

    modifier onlyOwner(){
        require(msg.sender == owner,"Not Owner");
        _;
    }

    constructor(address _stakeToken, address _rewardToken,uint256 _amount,uint256 _duration){
        owner = msg.sender;
        rewardRate = 1;
        stakeToken = IERC20(_stakeToken);
        rewardToken = IERC20(_rewardToken);
        _setRewardAmount(_amount);
        _setDuration(_duration);
    }

    function _setRewardAmount(uint256 _amount) internal onlyOwner{
        require(_amount > 0 , "Amount must greater than zero");

        totalRewardAmount = _amount;
    }

    function _setDuration(uint256 _duration) internal onlyOwner {
        duration = _duration;
        endTime = block.timestamp + _duration;
    }

    function _updateReward(address account) internal {
        require(block.timestamp < endTime, "Staking period ended");

        if (balances[account] > 0) {
            uint256 userAmount = balances[account];
            uint256 stakedBlocks = block.number - userBlock[account];
            uint256 newRewards = stakedBlocks * userAmount * rewardRate / 100;
    // 
            require(totalRewardAmount >= newRewards, "Out of reward");

            rewards[account] += newRewards;
            totalRewardAmount -= newRewards;
        }
        userBlock[account] = block.number;
    }

    function stake(uint256 _amount) external {
        address staker = msg.sender;

        _updateReward(staker);
        require(_amount > 0 ,"Amount = 0");
        
        stakeToken.transferFrom(staker, address(this), _amount);
        balances[staker] += _amount;
    }

    function unstake(uint256 _amount) external {
        address staker = msg.sender;

        require(balances[staker] >= _amount,"Not enough amount");

        stakeToken.transfer(staker, _amount);
        balances[staker] -= _amount;

        claimReward();
    }

    function claimReward() public {
        _updateReward(msg.sender);

        address staker = msg.sender;
        uint256 reward = rewards[staker];
        require(balances[staker] > 0, "No rewards to claim");
    
        rewards[staker] = 0;
        rewardToken.transfer(staker, reward);
    }

    function balanceOf(address _account) public view onlyOwner returns (uint256){
        require(_account != address(0), "Invalid address");
        return balances[_account];
    }

    function blockOf(address _account) public view onlyOwner returns (uint256){
        require(_account != address(0), "Invalid address");
        return userBlock[_account];
    }
}