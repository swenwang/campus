const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY; 
  if (!privateKey) {
    console.error("請確認你的 .env 檔案裡有設定 PRIVATE_KEY 喔！");
    return;
  }
  const wallet = new ethers.Wallet(privateKey);

  const classId = "BC_0610"; // 你的課堂代號

  // 2. 嚴格按照與你 Solidity 合約一模一樣的 keccak256 打包方式
  const messageHash = ethers.solidityPackedKeccak256(["string"], [classId]);
  
  // 3. 讓老師的私鑰在本地直接蓋上數位章
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  console.log("\n==================================================");
  console.log("🟢 恭喜！這是 Hardhat 算出來絕對標準的點名資料：");
  console.log("==================================================");
  console.log(`classId 輸入框填入 ->  ${classId}`);
  console.log(`signature 輸入框填入 -> ${signature}`);
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
