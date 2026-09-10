import { ethers } from "hardhat";

async function main() {
  console.log("開始部署合約...");

  // 1. 部署 AToken
  // 部署者保留 AToken ownership，作為教師端簽章者與管理者。
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
  const RewardExchange = await ethers.getContractFactory("RewardExchange");
  const exchange = await RewardExchange.deploy(aTokenAddress, bTokenAddress);
  await exchange.waitForDeployment();
  const exchangeAddress = await exchange.getAddress();
  console.log(`RewardExchange 部署成功，地址: ${exchangeAddress}`);

  // 4. 將 BToken ownership 交給 RewardExchange。
  // 使用者兌換時，由 RewardExchange burn AToken 並即時 mint BToken。
  // BToken.mint() 是 onlyOwner，因此 RewardExchange 必須持有 BToken ownership。
  console.log("正在設定 BToken mint 權限...");
  const transferTx = await bToken.transferOwnership(exchangeAddress);
  await transferTx.wait();

  const bTokenOwner = await bToken.owner();
  if (bTokenOwner.toLowerCase() !== exchangeAddress.toLowerCase()) {
    throw new Error("BToken ownership transfer failed");
  }

  console.log(`BToken ownership 已轉交 RewardExchange: ${bTokenOwner}`);

  console.log("\n--- 部署成果摘要 ---");
  console.log(`AToken 地址: ${aTokenAddress}`);
  console.log(`BToken 地址: ${bTokenAddress}`);
  console.log(`RewardExchange 地址: ${exchangeAddress}`);
  console.log(`BToken owner: ${bTokenOwner}`);
  console.log("-------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
