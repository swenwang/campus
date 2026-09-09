import { ethers } from "hardhat";

async function main() {
  console.log("開始部署合約...");

  // 1. 部署 AToken
  const AToken = await ethers.getContractFactory("AToken");
  const aToken = await AToken.deploy();
  await aToken.waitForDeployment();
  const aTokenAddress = await aToken.getAddress();
  console.log(`AToken 部署成功，地址: ${aTokenAddress}`);

  // 2. 部署 BToken
  const BToken = await ethers.getContractFactory("BToken");
  const bToken = await BToken.deploy();
  await bToken.waitForDeployment();
  const bTokenAddress = await bToken.getAddress();
  console.log(`BToken 部署成功，地址: ${bTokenAddress}`);

  // 3. 部署 RewardExchange
  // 注意：這裡假設你的 RewardExchange constructor 接收 (AToken地址, BToken地址)
  const RewardExchange = await ethers.getContractFactory("RewardExchange");
  const exchange = await RewardExchange.deploy(aTokenAddress, bTokenAddress);
  await exchange.waitForDeployment();
  const exchangeAddress = await exchange.getAddress();
  console.log(`RewardExchange 部署成功，地址: ${exchangeAddress}`);

  console.log("\n--- 部署成果摘要 ---");
  console.log(`AToken 地址: ${aTokenAddress}`);
  console.log(`BToken 地址: ${bTokenAddress}`);
  console.log(`Exchange 地址: ${exchangeAddress}`);
  console.log("-------------------");
  console.log("請將以上地址與 artifacts/ 內的 ABI 提供給前端 A 同學。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
