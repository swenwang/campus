import { expect } from "chai";
import { network } from "hardhat";
import { describe, it, beforeEach } from "mocha";
const { ethers } = await network.connect();

describe("RewardExchange 系統測試", function () {
  let aToken: any;
  let bToken: any;
  let exchange: any;
  let user: any;

  beforeEach(async function () {
    // 取得測試帳號
    [, user] = await ethers.getSigners();

    // 1. 部署 AToken
    const ATokenFactory = await ethers.getContractFactory("AToken");
    aToken = await ATokenFactory.deploy();

    // 2. 部署 BToken
    const BTokenFactory = await ethers.getContractFactory("BToken");
    bToken = await BTokenFactory.deploy();

    // 3. 部署 RewardExchange
    const ExchangeFactory = await ethers.getContractFactory("RewardExchange");
    exchange = await ExchangeFactory.deploy(await aToken.getAddress(), await bToken.getAddress());

    // 權限設定 (假設你的 BToken 需要授權 Exchange 合約才能 mint)
    // await bToken.transferOwnership(await exchange.getAddress());
    // 讓 Exchange 合約成為 BToken 的主人，這樣它才有權限呼叫 mint
    await bToken.transferOwnership(await exchange.getAddress());

  });

  it("應該能正確發放 A 代幣給使用者", async function () {
    const mintAmount = ethers.parseEther("500");
    await aToken.mint(user.address, mintAmount);
    expect(await aToken.balanceOf(user.address)).to.equal(mintAmount);
  });

  it("使用者擁有 100 A 時，應該能成功兌換 1 B", async function () {
    const aAmount = ethers.parseEther("100");
    const bExpected = ethers.parseEther("1");

    // 先給使用者 100 A
    await aToken.mint(user.address, aAmount);
    
    // 使用者授權 Exchange 合約操作他的 A 代幣 (如果是用 burn 邏輯則視你的合約實作而定)
    await aToken.connect(user).approve(await exchange.getAddress(), aAmount);

    // 執行兌換
    await exchange.connect(user).exchangeForB(ethers.parseEther("1"), ethers.parseEther("100"));

    // 檢查結果
    expect(await aToken.balanceOf(user.address)).to.equal(0);
    expect(await bToken.balanceOf(user.address)).to.equal(bExpected);
  });

  it("當 A 代幣餘額不足時，兌換應該失敗", async function () {
    const insufficientAmount = ethers.parseEther("50");
    await aToken.mint(user.address, insufficientAmount);
    await aToken.connect(user).approve(await exchange.getAddress(), ethers.parseEther("100"));
    
    await expect(
      exchange.connect(user).exchangeForB(ethers.parseEther("1"), ethers.parseEther("100"))
    ).to.be.revertedWithCustomError(aToken, "ERC20InsufficientBalance");
  });
});
