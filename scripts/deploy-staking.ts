import { Signer } from 'ethers';
import { ethers } from 'hardhat';

async function main() {
  const [deployer, ...signers] = await ethers.getSigners();

  const stakeToken = await deploy('MyToken');
  const rewardToken = await deploy('MyToken');

  mint(signers[1].address, stakeToken, 10000);
  mint(signers[2].address, stakeToken, 10000);

  const rewardAmount: any = mint(deployer.address, rewardToken, 10000);

  const TWENTY_FOUR_HOURS = 24 * 60 * 60;

  const stakingAddr = await deploy('StakingRewards', [
    stakeToken,
    rewardToken,
    rewardAmount,
    TWENTY_FOUR_HOURS,
  ]);

  const _rewardToken = await ethers.getContractAt('MyToken', rewardToken);

  _rewardToken.transfer(stakingAddr, rewardAmount);

  const stakeAmount = 300;

  await approve(signers[1], stakingAddr, stakeToken, stakeAmount);
  await stake(signers[1], stakingAddr, 200);

  await claim(signers[1], stakingAddr);

  await stake(signers[1], stakingAddr, 100);

  await unstake(signers[1], stakingAddr, 100);

  await claim(signers[1], stakingAddr);
}

async function deploy(name: string, args: any[] = []) {
  const [owner] = await ethers.getSigners();

  const TOKEN = await ethers.getContractFactory(name, owner);

  const token = await TOKEN.deploy(...args);

  await token.waitForDeployment();
  const addr = await token.getAddress();

  console.log(`${name} deployed to: ${addr}`);

  return addr;
}

async function mint(signerAddr: string, tokenAddr: string, amount: number) {
  const contract = await ethers.getContractAt('MyToken', tokenAddr);

  await contract.mint(signerAddr, ethers.parseEther(amount.toString()));

  const balance = await contract.balanceOf(signerAddr);

  return balance;
}

async function approve(
  signer: any,
  stakingAddr: string,
  stakeTokenAddr: string,
  amount: number,
) {
  const contract = await ethers.getContractAt('MyToken', stakeTokenAddr);

  const approveAmount = ethers.parseEther(amount.toString());
  contract.connect(signer).approve(stakingAddr, approveAmount);
}

async function stake(signer: any, stakingAddr: string, amount: number) {
  const contract = await ethers.getContractAt('StakingRewards', stakingAddr);

  const stakeAmount = ethers.parseEther(amount.toString());
  await contract.connect(signer).stake(stakeAmount);
}

async function unstake(signer: any, stakingAddr: string, amount: number) {
  const contract = await ethers.getContractAt('StakingRewards', stakingAddr);
  const stakeAmount = ethers.parseEther(amount.toString());

  await contract.connect(signer).unstake(stakeAmount);
}

async function claim(signer: any, stakingAddr: string) {
  const contract = await ethers.getContractAt('StakingRewards', stakingAddr);
  await contract.connect(signer).claimReward();
}

main().catch(console.error);
