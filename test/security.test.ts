import { expect } from 'chai';
import { network } from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = await network.connect();

const types = { Attendance: [
  { name: 'classId', type: 'string' }, { name: 'student', type: 'address' }, { name: 'deadline', type: 'uint256' },
] };
const tokens = ethers.parseEther;

describe('Campus security regressions', function () {
  let a: any, b: any, ex: any, owner: any, student: any, attacker: any;
  let domain: any, deadline: number;
  beforeEach(async () => {
    [owner, student, attacker] = await ethers.getSigners();
    a = await (await ethers.getContractFactory('AToken')).deploy();
    b = await (await ethers.getContractFactory('BToken')).deploy();
    ex = await (await ethers.getContractFactory('RewardExchange')).deploy(await a.getAddress(), await b.getAddress());
    await b.transferOwnership(await ex.getAddress());
    domain = { name: 'CampusAttendance', version: '2', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await a.getAddress() };
    deadline = (await ethers.provider.getBlock('latest'))!.timestamp + 900;
  });
  async function sign(overrides = {}, signer = owner, signingDomain = domain) {
    return signer.signTypedData(signingDomain, types, { classId: 'math', student: student.address, deadline, ...overrides });
  }
  async function fund(amount = '1000000000') {
    await a.mint(student.address, tokens(amount));
    await a.connect(student).approve(await ex.getAddress(), tokens(amount));
  }
  it('valid attendance issues exactly 10 ATK and emits an event', async () => {
    await expect(a.connect(student).claimToken('math', deadline, await sign()))
      .to.emit(a, 'AttendanceClaimed').withArgs('math', student.address);
    expect(await a.balanceOf(student.address)).to.equal(tokens('10'));
  });
  it('rejects duplicate attendance', async () => {
    const sig = await sign();
    await a.connect(student).claimToken('math', deadline, sig);
    await expect(a.connect(student).claimToken('math', deadline, sig)).to.be.revertedWith('You have already claimed this class!');
  });
  it('a copied credential cannot be redeemed by another wallet', async () => {
    await expect(a.connect(attacker).claimToken('math', deadline, await sign())).to.be.revertedWith('Invalid signature! Cheat detected!');
  });
  it('rejects a credential issued by someone other than the teacher', async () => {
    await expect(a.connect(student).claimToken('math', deadline, await sign({}, attacker))).to.be.revertedWith('Invalid signature! Cheat detected!');
  });
  it('rejects modified class and expiry', async () => {
    const sig = await sign();
    await expect(a.connect(student).claimToken('other', deadline, sig)).to.be.revertedWith('Invalid signature! Cheat detected!');
    await expect(a.connect(student).claimToken('math', deadline + 1, sig)).to.be.revertedWith('Invalid signature! Cheat detected!');
  });
  it('rejects signatures intended for another chain', async () => {
    await expect(a.connect(student).claimToken('math', deadline, await sign({}, owner, { ...domain, chainId: 1 }))).to.be.revertedWith('Invalid signature! Cheat detected!');
  });
  it('rejects signatures intended for another deployment', async () => {
    const other = await (await ethers.getContractFactory('AToken')).deploy();
    await expect(a.connect(student).claimToken('math', deadline, await sign({}, owner, { ...domain, verifyingContract: await other.getAddress() }))).to.be.revertedWith('Invalid signature! Cheat detected!');
  });
  it('rejects expired attendance', async () => {
    deadline -= 901;
    await expect(a.connect(student).claimToken('math', deadline, await sign())).to.be.revertedWith('Attendance expired');
  });
  it('rejects empty and oversized class IDs and malformed signatures', async () => {
    for (const id of ['', 'a'.repeat(129)]) {
      await expect(a.connect(student).claimToken(id, deadline, '0x')).to.be.revertedWith('Invalid class ID');
    }
    await expect(a.connect(student).claimToken('math', deadline, '0x')).to.be.revertedWithCustomError(a, 'ECDSAInvalidSignatureLength');
  });
  it('old teacher signatures stop working after ownership transfer', async () => {
    const sig = await sign();
    await a.transferOwnership(attacker.address);
    await expect(a.connect(student).claimToken('math', deadline, sig)).to.be.revertedWith('Invalid signature! Cheat detected!');
  });
  it('only owners can mint either token', async () => {
    await expect(a.connect(attacker).mint(attacker.address, 1)).to.be.revertedWithCustomError(a, 'OwnableUnauthorizedAccount');
    await expect(b.connect(attacker).mint(attacker.address, 1)).to.be.revertedWithCustomError(b, 'OwnableUnauthorizedAccount');
  });
  it('charges both tiers for a six-token order', async () => {
    await fund();
    expect(await ex.quoteExchange(tokens('6'))).to.equal(tokens('700'));
    await expect(ex.connect(student).exchangeForB(tokens('6'), tokens('700'))).to.emit(ex, 'Exchanged').withArgs(student.address, tokens('700'), tokens('6'));
    expect(await ex.getCurrentRate()).to.equal(200);
  });
  it('fractional crossing costs the same whether bought in one or two orders', async () => {
    await fund();
    await ex.connect(student).exchangeForB(tokens('4.5'), tokens('450'));
    expect(await ex.quoteExchange(tokens('1'))).to.equal(tokens('150'));
    const first = await ex.quoteExchange(tokens('0.5'));
    await ex.connect(student).exchangeForB(tokens('0.5'), first);
    const second = await ex.quoteExchange(tokens('0.5'));
    expect(first + second).to.equal(tokens('150'));
  });
  it('rejects stale maximum cost without burning tokens', async () => {
    await fund();
    const oldQuote = await ex.quoteExchange(tokens('1'));
    await ex.connect(student).exchangeForB(tokens('5'), tokens('500'));
    const balance = await a.balanceOf(student.address);
    await expect(ex.connect(student).exchangeForB(tokens('1'), oldQuote)).to.be.revertedWith('Quote changed');
    expect(await a.balanceOf(student.address)).to.equal(balance);
  });
  it('rejects zero amounts and insufficient allowance', async () => {
    await expect(ex.quoteExchange(0)).to.be.revertedWith('Amount must be positive');
    await a.mint(student.address, tokens('100'));
    await expect(ex.connect(student).exchangeForB(tokens('1'), tokens('100'))).to.be.revertedWithCustomError(a, 'ERC20InsufficientAllowance');
  });
  it('cannot exceed the 100 BTK cap, including through a large first order', async () => {
    await fund();
    await expect(ex.quoteExchange(tokens('101'))).to.be.revertedWith('Exceeds max supply');
    const quote = await ex.quoteExchange(tokens('100'));
    expect(quote).to.equal(tokens('524287500'));
    await ex.connect(student).exchangeForB(tokens('100'), quote);
    expect(await b.totalSupply()).to.equal(tokens('100'));
    await expect(ex.quoteExchange(1)).to.be.revertedWith('Exceeds max supply');
  });
  it('a failed mint rolls back the AToken burn', async () => {
    const other = await (await ethers.getContractFactory('BToken')).deploy();
    const unwired: any = await (await ethers.getContractFactory('RewardExchange')).deploy(await a.getAddress(), await other.getAddress());
    await a.mint(student.address, tokens('100'));
    await a.connect(student).approve(await unwired.getAddress(), tokens('100'));
    await expect(unwired.connect(student).exchangeForB(tokens('1'), tokens('100'))).to.be.revertedWithCustomError(other, 'OwnableUnauthorizedAccount');
    expect(await a.balanceOf(student.address)).to.equal(tokens('100'));
  });
  it('rejects missing token contracts', async () => {
    await expect((await ethers.getContractFactory('RewardExchange')).deploy(ethers.ZeroAddress, await b.getAddress())).to.be.revertedWith('Invalid tokens');
  });
});
