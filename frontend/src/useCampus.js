import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { assertWalletAccount, connectMetaMask, getMetaMask, subscribeWallet, walletError } from './wallet.js';
import { A_ADDRESS, B_ADDRESS, EX_ADDRESS, contracts, attendanceDomain, attendanceTypes, parseAmount, validateClassId } from './protocol.js';

const empty = { account: '', isTeacher: false, aBalance: '0', bBalance: '0', rate: '', secure: false };
export function useCampus() {
  const [data, setData] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Connect MetaMask to check Sepolia and the deployed contracts.');
  const [classId, setClassId] = useState('');
  const [signature, setSignature] = useState('');
  const [student, setStudent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [amountB, setAmountB] = useState('');
  const [quote, setQuote] = useState(null);
  const [txHash, setTxHash] = useState('');
  const session = useRef({ generation: 0, provider: null, account: '' });
  const locked = useRef(false);
  const discovered = useRef(null);

  useEffect(() => {
    const providers = new Map();
    const reset = () => {
      session.current = { generation: session.current.generation + 1, provider: null, account: '' };
      setData(empty); setQuote(null); setSignature(''); setTxHash('');
      setStatus('Wallet account or network changed. Reconnect to refresh and verify your wallet.');
    };
    const attach = (provider) => {
      if (!provider || providers.has(provider)) return;
      providers.set(provider, subscribeWallet(provider, reset));
    };
    const announce = (event) => {
      if (event.detail?.info?.rdns === 'io.metamask') {
        discovered.current = event.detail.provider;
        attach(event.detail.provider);
      }
    };
    attach(getMetaMask());
    window.addEventListener('eip6963:announceProvider', announce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return () => {
      window.removeEventListener('eip6963:announceProvider', announce);
      for (const unsubscribe of providers.values()) unsubscribe();
      session.current = { generation: session.current.generation + 1, provider: null, account: '' };
    };
  }, []);

  async function verifySession(current) {
    if (session.current !== current || !current.account) throw new Error('Wallet changed. Reconnect before continuing.');
    await assertWalletAccount(current.provider, current.account);
    if (session.current !== current) {
      throw new Error('Wallet changed. Reconnect to Sepolia before continuing.');
    }
    return new ethers.BrowserProvider(current.provider);
  }

  async function refresh(current) {
    const provider = await verifySession(current);
    const { a, b, ex } = contracts(provider);
    const code = await Promise.all([A_ADDRESS, B_ADDRESS, EX_ADDRESS].map((address) => provider.getCode(address)));
    if (code.some((value) => value === '0x')) throw new Error('A configured contract is missing on Sepolia. Check deployment addresses.');
    const [owner, aBal, bBal, rate, bOwner, exA, exB] = await Promise.all([
      a.owner(), a.balanceOf(current.account), b.balanceOf(current.account), ex.getCurrentRate(),
      b.owner(), ex.aToken(), ex.bToken(),
    ]);
    if (bOwner.toLowerCase() !== EX_ADDRESS.toLowerCase() || exA.toLowerCase() !== A_ADDRESS.toLowerCase() || exB.toLowerCase() !== B_ADDRESS.toLowerCase()) {
      throw new Error('Contract wiring or BToken mint ownership is incorrect. Contact the deployer.');
    }
    const versions = await Promise.allSettled([a.ATTENDANCE_VERSION(), ex.EXCHANGE_VERSION()]);
    const secure = versions.every((result) => result.status === 'fulfilled' && result.value === 2n);
    await verifySession(current);
    setData({ account: current.account, isTeacher: owner.toLowerCase() === current.account.toLowerCase(), aBalance: ethers.formatEther(aBal), bBalance: ethers.formatEther(bBal), rate: rate.toString(), secure });
    return secure;
  }

  async function run(action) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setTxHash('');
    try { await action(); }
    catch (error) { setStatus(walletError(error)); }
    finally { locked.current = false; setBusy(false); }
  }

  function connectWallet() {
    return run(async () => {
      const injected = discovered.current || getMetaMask();
      setData(empty); setQuote(null);
      setStatus('Confirm the connection and Sepolia network in MetaMask…');
      await connectMetaMask(injected);
      const accounts = await injected.request({ method: 'eth_accounts' });
      const current = { generation: session.current.generation + 1, provider: injected, account: accounts[0] };
      session.current = current;
      const secure = await refresh(current);
      setStatus(secure ? 'MetaMask connected to Sepolia. Version 2 contract configuration checked; workspace ready.' : 'Connected in read-only mode: legacy contracts lack security fixes. Deploy version 2 and update the addresses to enable actions.');
    });
  }

  async function signerContext(current) {
    if (!data.secure) throw new Error('Secure version 2 contracts are required for this action.');
    const provider = await verifySession(current);
    const signer = await provider.getSigner(current.account);
    await verifySession(current);
    return { signer, ...contracts(signer) };
  }

  function signAttendance() {
    return run(async () => {
      const current = session.current;
      const { signer, a } = await signerContext(current);
      const id = validateClassId(classId);
      if (!ethers.isAddress(student) || student === ethers.ZeroAddress) throw new Error('Enter the student wallet address.');
      if ((await a.owner()).toLowerCase() !== current.account.toLowerCase()) throw new Error('Only the current teacher can issue credentials.');
      const expires = Math.floor(Date.now() / 1000) + 900;
      setSignature('');
      await verifySession(current);
      const sig = await signer.signTypedData(attendanceDomain(11155111), attendanceTypes, { classId: id, student, deadline: expires });
      await verifySession(current);
      setDeadline(String(expires)); setSignature(sig);
      setStatus('Credential generated for this student only, valid for 15 minutes. Share class ID, expiry and signature with that student.');
    });
  }

  function claimAttendance() {
    return run(async () => {
      const current = session.current;
      const { a } = await signerContext(current);
      const id = validateClassId(classId);
      if (!/^\d{1,12}$/.test(deadline) || BigInt(deadline) < BigInt(Math.floor(Date.now() / 1000))) throw new Error('Enter an unexpired credential timestamp.');
      if (!ethers.isHexString(signature.trim(), 65)) throw new Error('Enter a valid 65-byte teacher signature.');
      const owner = await a.owner();
      const recovered = ethers.verifyTypedData(attendanceDomain(11155111), attendanceTypes, { classId: id, student: current.account, deadline }, signature.trim());
      if (recovered.toLowerCase() !== owner.toLowerCase()) throw new Error('Credential does not match this wallet, class, expiry or contract.');
      await verifySession(current);
      setStatus('Confirm the attendance claim in MetaMask…');
      const tx = await a.claimToken(id, deadline, signature.trim());
      if (session.current === current) setTxHash(tx.hash);
      await tx.wait();
      await refresh(current);
      setStatus('Attendance confirmed on Sepolia. 10 ATK issued.');
    });
  }

  function getQuote() {
    return run(async () => {
      setQuote(null);
      const current = session.current;
      const { ex } = await signerContext(current);
      const amount = parseAmount(amountB);
      const required = await ex.quoteExchange(amount);
      await verifySession(current);
      setQuote({ amount, required, current });
      setStatus('Quote ready. Review the exact AToken cost before approving.');
    });
  }

  function approveAndExchange() {
    return run(async () => {
      const current = session.current;
      if (!quote || quote.current !== current || quote.amount !== parseAmount(amountB)) throw new Error('Get a fresh quote first.');
      const { a, ex } = await signerContext(current);
      if (await ex.quoteExchange(quote.amount) !== quote.required) { setQuote(null); throw new Error('Price changed. Get a new quote.'); }
      if (await a.balanceOf(current.account) < quote.required) throw new Error('Insufficient AToken balance.');
      const allowance = await a.allowance(current.account, EX_ADDRESS);
      // Clear old approval first so only the reviewed amount remains authorized.
      if (allowance !== 0n && allowance !== quote.required) {
        await verifySession(current);
        setStatus('Clear previous AToken approval in MetaMask…');
        const clear = await a.approve(EX_ADDRESS, 0);
        if (session.current === current) setTxHash(clear.hash);
        await clear.wait();
      }
      if (allowance !== quote.required) {
        await verifySession(current);
        setStatus(`Approve exactly ${ethers.formatEther(quote.required)} ATK in MetaMask…`);
        const approval = await a.approve(EX_ADDRESS, quote.required);
        if (session.current === current) setTxHash(approval.hash);
        await approval.wait();
      }
      await verifySession(current);
      setStatus('Confirm exchange in MetaMask. The contract enforces your maximum cost.');
      const tx = await ex.exchangeForB(quote.amount, quote.required);
      if (session.current === current) setTxHash(tx.hash);
      await tx.wait(); setQuote(null);
      await refresh(current); setStatus('Exchange confirmed. Balances refreshed.');
    });
  }

  function revokeApproval() {
    return run(async () => {
      const current = session.current;
      const provider = await verifySession(current);
      const { a } = contracts(await provider.getSigner(current.account));
      await verifySession(current);
      setStatus('Revoke the exchange AToken allowance in MetaMask…');
      const tx = await a.approve(EX_ADDRESS, 0);
      if (session.current === current) setTxHash(tx.hash);
      await tx.wait();
      await verifySession(current); setStatus('Exchange allowance revoked.');
    });
  }

  return { ...data, busy, status, classId, setClassId, signature, setSignature, student, setStudent, deadline, setDeadline,
    amountB, setAmountB: (value) => { setAmountB(value); setQuote(null); }, quote: quote ? ethers.formatEther(quote.required) : '—',
    txHash, connectWallet, signAttendance, claimAttendance, getQuote, approveAndExchange, revokeApproval };
}
