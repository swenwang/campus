import { network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

async function main() {
  const { ethers } = await network.connect();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== 11155111n && chainId !== 31337n) {
    throw new Error("Only Sepolia or a local Hardhat network is supported");
  }
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployment account configured");
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
  await mkdir("deployments", { recursive: true });
  // Public addresses only; never serialize provider configuration or signer objects.
  await writeFile(`deployments/${chainId}.json`, JSON.stringify({
    chainId: chainId.toString(), version: 2,
    aToken: aTokenAddress, bToken: bTokenAddress, exchange: exchangeAddress,
    teacher: await aToken.owner(),
  }, null, 2) + "\n");

  console.log("\n--- 部署成果摘要 ---");
  console.log(`AToken 地址: ${aTokenAddress}`);
  console.log(`BToken 地址: ${bTokenAddress}`);
  console.log(`RewardExchange 地址: ${exchangeAddress}`);
  console.log(`BToken owner: ${bTokenOwner}`);
  console.log("-------------------");
}

main().catch(() => {
  // Provider errors can contain RPC API credentials; do not dump them into logs.
  console.error("Deployment failed. Check local configuration, Sepolia ETH, and any deployment transactions already submitted. Never post private keys or raw RPC error logs.");
  process.exitCode = 1;
});
