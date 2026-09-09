import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const A_ADDRESS = '0xf2E21e7355E4e550E7053250ABE5a8d6849722ef';
const B_ADDRESS = '0x20435cB6da6dC84C56889E2568FB049034ed2C6d';
const EX_ADDRESS = '0x082aE3a47069edBCbB159Ef361509ff67468b10B';

const A_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function claimToken(string classId, bytes signature)',
  'function owner() view returns (address)'
];
const B_ABI = ['function balanceOf(address) view returns (uint256)'];
const EX_ABI = [
  'function getCurrentRate() view returns (uint256)',
  'function exchangeForB(uint256 amountB)'
];

export default function App() {
  const [account, setAccount] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [aBalance, setABalance] = useState('0');
  const [bBalance, setBBalance] = useState('0');
  const [rate, setRate] = useState('0');
  const [classId, setClassId] = useState('');
  const [signature, setSignature] = useState('');
  const [amountB, setAmountB] = useState('');
  const [status, setStatus] = useState('Connect MetaMask to begin.');

  async function connectWallet() {
    try {
      if (!window.ethereum) return alert('Please install MetaMask');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setAccount(address);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const aToken = new ethers.Contract(A_ADDRESS, A_ABI, provider);
      const owner = await aToken.owner();
      setIsTeacher(address.toLowerCase() === owner.toLowerCase());
      setStatus('Wallet connected.');
    } catch (error) {
      console.error(error);
      setStatus('Wallet connection failed.');
    }
  }

  async function loadData() {
    if (!account || !window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const aToken = new ethers.Contract(A_ADDRESS, A_ABI, provider);
    const bToken = new ethers.Contract(B_ADDRESS, B_ABI, provider);
    const exchange = new ethers.Contract(EX_ADDRESS, EX_ABI, provider);

    const [a, b, currentRate] = await Promise.all([
      aToken.balanceOf(account),
      bToken.balanceOf(account),
      exchange.getCurrentRate(),
    ]);

    setABalance(ethers.formatEther(a));
    setBBalance(ethers.formatEther(b));
    setRate(currentRate.toString());
  }

  async function signAttendance() {
    try {
      if (!classId.trim()) return alert('Enter a class ID');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const messageHash = ethers.solidityPackedKeccak256(['string'], [classId.trim()]);
      const sig = await signer.signMessage(ethers.getBytes(messageHash));
      setSignature(sig);
      setStatus('Attendance signature generated.');
    } catch (error) {
      console.error(error);
      setStatus('Signing failed.');
    }
  }

  async function claimAttendance() {
    try {
      if (!classId.trim() || !signature.trim()) return alert('Enter class ID and signature');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const aToken = new ethers.Contract(A_ADDRESS, A_ABI, signer);
      const tx = await aToken.claimToken(classId.trim(), signature.trim());
      await tx.wait();
      setStatus('Attendance claimed: 10 ATK received.');
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus('Attendance claim failed.');
    }
  }

  async function approveAndExchange() {
    try {
      if (!amountB || Number(amountB) <= 0) return alert('Enter a valid BToken amount');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const aToken = new ethers.Contract(A_ADDRESS, A_ABI, signer);
      const exchange = new ethers.Contract(EX_ADDRESS, EX_ABI, signer);
      const parsedB = ethers.parseEther(amountB);
      const requiredA = parsedB * BigInt(rate);

      setStatus('Approving AToken...');
      const approveTx = await aToken.approve(EX_ADDRESS, requiredA);
      await approveTx.wait();

      setStatus('Exchanging tokens...');
      const exchangeTx = await exchange.exchangeForB(parsedB);
      await exchangeTx.wait();

      setStatus('Exchange complete.');
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus('Exchange failed.');
    }
  }

  useEffect(() => {
    loadData().catch(console.error);
  }, [account]);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Blockchain Course Project</p>
        <h1>Campus Token DApp</h1>
        <p className="subtitle">Classroom attendance and token rewards on Ethereum Sepolia.</p>
        <button onClick={connectWallet}>{account ? 'Reconnect Wallet' : 'Connect MetaMask'}</button>
        <p className="status">{status}</p>
      </section>

      {account && (
        <>
          <section className="grid two">
            <article className="card"><span>A Token</span><strong>{aBalance} ATK</strong></article>
            <article className="card"><span>B Token</span><strong>{bBalance} BTK</strong></article>
          </section>

          <section className="card">
            <h2>{isTeacher ? 'Teacher Attendance Signature' : 'Student Attendance Claim'}</h2>
            <input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Class ID" />
            <textarea value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Teacher signature" rows="4" />
            {isTeacher ? (
              <button onClick={signAttendance}>Generate Signature</button>
            ) : (
              <button onClick={claimAttendance}>Claim 10 ATK</button>
            )}
          </section>

          {!isTeacher && (
            <section className="card">
              <h2>Token Exchange</h2>
              <p>Current rate: {rate} ATK for 1 BTK</p>
              <input value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="BToken amount" />
              <button onClick={approveAndExchange}>Approve & Exchange</button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
