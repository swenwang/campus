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

const features = [
  {
    number: '01',
    title: 'Verifiable attendance',
    text: 'Teachers issue a signed class credential. Students redeem it on-chain, creating a transparent and tamper-resistant attendance flow.'
  },
  {
    number: '02',
    title: 'Programmable rewards',
    text: 'Attendance can trigger token incentives automatically, turning participation into a measurable reward mechanism.'
  },
  {
    number: '03',
    title: 'Wallet-native identity',
    text: 'MetaMask connects each participant directly to the application without a traditional username-and-password account layer.'
  }
];

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function App() {
  const [account, setAccount] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [aBalance, setABalance] = useState('0');
  const [bBalance, setBBalance] = useState('0');
  const [rate, setRate] = useState('0');
  const [classId, setClassId] = useState('');
  const [signature, setSignature] = useState('');
  const [amountB, setAmountB] = useState('');
  const [status, setStatus] = useState('Connect your wallet to launch the live workspace.');

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus('MetaMask is required to use the live DApp.');
        return;
      }

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
      setStatus('Wallet connected to Sepolia. Live contract data is ready.');
    } catch (error) {
      console.error(error);
      setStatus('Wallet connection failed. Confirm that MetaMask is available and Sepolia is enabled.');
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
      if (!classId.trim()) {
        setStatus('Enter a class ID before generating a signature.');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const messageHash = ethers.solidityPackedKeccak256(['string'], [classId.trim()]);
      const sig = await signer.signMessage(ethers.getBytes(messageHash));
      setSignature(sig);
      setStatus('Attendance credential generated. Share the class ID and signature with the student.');
    } catch (error) {
      console.error(error);
      setStatus('Signature generation failed.');
    }
  }

  async function claimAttendance() {
    try {
      if (!classId.trim() || !signature.trim()) {
        setStatus('Enter both the class ID and teacher signature.');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const aToken = new ethers.Contract(A_ADDRESS, A_ABI, signer);
      setStatus('Submitting attendance claim to Sepolia…');
      const tx = await aToken.claimToken(classId.trim(), signature.trim());
      await tx.wait();
      setStatus('Attendance verified. 10 ATK have been issued to your wallet.');
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus('Attendance claim failed. Check the class ID, signature, wallet and gas balance.');
    }
  }

  async function approveAndExchange() {
    try {
      if (!amountB || Number(amountB) <= 0) {
        setStatus('Enter a valid BToken amount.');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const aToken = new ethers.Contract(A_ADDRESS, A_ABI, signer);
      const exchange = new ethers.Contract(EX_ADDRESS, EX_ABI, signer);
      const parsedB = ethers.parseEther(amountB);
      const requiredA = parsedB * BigInt(rate);

      setStatus('Step 1 of 2 · Approving AToken spend…');
      const approveTx = await aToken.approve(EX_ADDRESS, requiredA);
      await approveTx.wait();

      setStatus('Step 2 of 2 · Executing token exchange…');
      const exchangeTx = await exchange.exchangeForB(parsedB);
      await exchangeTx.wait();

      setStatus('Exchange complete. Your token balances have been refreshed.');
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus('Exchange failed. Check your token balance and Sepolia gas balance.');
    }
  }

  useEffect(() => {
    loadData().catch(console.error);
  }, [account]);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Campus Token home">
          <span className="brand-mark">C</span>
          <span>Campus Token</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#solution">Solution</a>
          <a href="#how-it-works">How it works</a>
          <a href="#demo">Live demo</a>
        </nav>
        <button className="nav-cta" onClick={connectWallet}>
          {account ? shortAddress(account) : 'Connect wallet'}
        </button>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="network-pill"><span className="network-dot" /> Live prototype · Ethereum Sepolia</div>
            <h1>Turn campus participation into <span>verifiable value.</span></h1>
            <p className="hero-lede">
              A blockchain-powered attendance and reward system that lets institutions verify participation,
              issue programmable incentives and give students a transparent wallet-based experience.
            </p>
            <div className="hero-actions">
              <button className="primary-cta" onClick={connectWallet}>Launch live demo <span>↗</span></button>
              <a className="secondary-cta" href="#solution">Explore the solution</a>
            </div>
            <div className="hero-proof">
              <div><strong>On-chain</strong><span>attendance records</span></div>
              <div><strong>Wallet-native</strong><span>student experience</span></div>
              <div><strong>Programmable</strong><span>reward logic</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Product preview">
            <div className="visual-glow" />
            <div className="product-window">
              <div className="window-top">
                <div className="window-brand"><span className="mini-mark">C</span> Campus Token</div>
                <span className="sepolia-tag">Sepolia</span>
              </div>
              <div className="window-balance-label">Participation balance</div>
              <div className="window-balance">{account ? Number(aBalance).toFixed(2) : '24.00'} <span>ATK</span></div>
              <div className="window-grid">
                <div><span>Reward token</span><strong>{account ? Number(bBalance).toFixed(2) : '6.00'} BTK</strong></div>
                <div><span>Exchange rate</span><strong>{rate || '4'} : 1</strong></div>
              </div>
              <div className="window-activity">
                <div className="activity-icon">✓</div>
                <div><strong>Attendance verified</strong><span>Token reward issued on-chain</span></div>
                <span className="activity-amount">+10 ATK</span>
              </div>
            </div>
          </div>
        </section>

        <section className="value-strip">
          <div className="section-wrap strip-grid">
            <p>Built for modern campus ecosystems</p>
            <span>Attendance</span><span>Rewards</span><span>Web3 Identity</span><span>Transparent Incentives</span>
          </div>
        </section>

        <section className="section-wrap content-section" id="solution">
          <div className="section-heading split-heading">
            <div>
              <p className="kicker">The solution</p>
              <h2>One flow. Three campus problems solved.</h2>
            </div>
            <p>
              Traditional attendance is easy to fragment, reward programs are difficult to audit, and participation data rarely belongs to the student. Campus Token connects all three through one wallet-based workflow.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <span className="feature-number">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dark-section" id="how-it-works">
          <div className="section-wrap">
            <div className="section-heading dark-heading">
              <p className="kicker">How it works</p>
              <h2>From classroom action to on-chain reward.</h2>
              <p>Designed as a simple two-sided experience for educators and students.</p>
            </div>
            <div className="flow-grid">
              <div className="flow-step"><span>1</span><div><strong>Teacher signs a class credential</strong><p>A unique class ID is signed using the instructor wallet.</p></div></div>
              <div className="flow-line" />
              <div className="flow-step"><span>2</span><div><strong>Student verifies attendance</strong><p>The student submits the class ID and signature through the DApp.</p></div></div>
              <div className="flow-line" />
              <div className="flow-step"><span>3</span><div><strong>Smart contract issues rewards</strong><p>The contract validates the claim and sends attendance tokens automatically.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section-wrap demo-section" id="demo">
          <div className="demo-intro">
            <div>
              <p className="kicker">Live product demo</p>
              <h2>Try the protocol on Sepolia.</h2>
            </div>
            <p>This prototype connects to the deployed smart contracts. You need MetaMask and Sepolia ETH for transactions that require gas.</p>
          </div>

          <div className="workspace">
            <div className="workspace-sidebar">
              <div>
                <span className="sidebar-label">Network</span>
                <div className="sidebar-value"><span className="network-dot" /> Ethereum Sepolia</div>
              </div>
              <div>
                <span className="sidebar-label">Wallet</span>
                <div className="sidebar-value">{account ? shortAddress(account) : 'Not connected'}</div>
              </div>
              <div>
                <span className="sidebar-label">Role</span>
                <div className="sidebar-value">{account ? (isTeacher ? 'Teacher' : 'Student') : '—'}</div>
              </div>
              <div className="contract-links">
                <span className="sidebar-label">Deployed contracts</span>
                <a href={`https://sepolia.etherscan.io/address/${A_ADDRESS}`} target="_blank" rel="noreferrer">AToken ↗</a>
                <a href={`https://sepolia.etherscan.io/address/${B_ADDRESS}`} target="_blank" rel="noreferrer">BToken ↗</a>
                <a href={`https://sepolia.etherscan.io/address/${EX_ADDRESS}`} target="_blank" rel="noreferrer">Exchange ↗</a>
              </div>
            </div>

            <div className="workspace-main">
              {!account ? (
                <div className="connect-state">
                  <div className="connect-orb">◈</div>
                  <h3>Connect your wallet to enter the workspace</h3>
                  <p>The demo will switch MetaMask to Sepolia and load your live token balances from the deployed contracts.</p>
                  <button className="primary-cta" onClick={connectWallet}>Connect MetaMask</button>
                </div>
              ) : (
                <>
                  <div className="balance-grid">
                    <article className="balance-card"><span>A Token balance</span><strong>{Number(aBalance).toFixed(4)}</strong><small>ATK · attendance reward</small></article>
                    <article className="balance-card"><span>B Token balance</span><strong>{Number(bBalance).toFixed(4)}</strong><small>BTK · redeemable reward</small></article>
                    <article className="balance-card"><span>Current exchange</span><strong>{rate || '—'} : 1</strong><small>ATK required per BTK</small></article>
                  </div>

                  <div className="action-card">
                    <div className="action-heading">
                      <div>
                        <span className="action-label">{isTeacher ? 'Teacher workspace' : 'Student workspace'}</span>
                        <h3>{isTeacher ? 'Create attendance credential' : 'Verify attendance & claim reward'}</h3>
                      </div>
                      <span className="role-pill">{isTeacher ? 'Issuer' : 'Participant'}</span>
                    </div>
                    <label>
                      <span>Class ID</span>
                      <input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g. FINTECH-2026-09-09" />
                    </label>
                    <label>
                      <span>Teacher signature</span>
                      <textarea value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={isTeacher ? 'Generated signature will appear here' : 'Paste the signature provided by the teacher'} rows="4" />
                    </label>
                    <button className="primary-cta full-width" onClick={isTeacher ? signAttendance : claimAttendance}>
                      {isTeacher ? 'Generate signed credential' : 'Verify & claim 10 ATK'}
                    </button>
                  </div>

                  {!isTeacher && (
                    <div className="action-card exchange-card">
                      <div className="action-heading">
                        <div><span className="action-label">Reward exchange</span><h3>Convert participation into B Token</h3></div>
                        <span className="rate-pill">{rate || '—'} ATK = 1 BTK</span>
                      </div>
                      <label>
                        <span>BToken amount</span>
                        <input value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="Enter amount to receive" inputMode="decimal" />
                      </label>
                      <button className="primary-cta full-width" onClick={approveAndExchange}>Approve & exchange</button>
                    </div>
                  )}
                </>
              )}

              <div className="status-bar"><span className="status-pulse" /> <span>{status}</span></div>
            </div>
          </div>
        </section>

        <section className="section-wrap trust-section">
          <div className="trust-copy">
            <p className="kicker">Prototype scope</p>
            <h2>Built to demonstrate the product, not to hide the technology.</h2>
            <p>
              The live demo uses public Sepolia contracts and a browser wallet. Contract addresses are intentionally visible and auditable. Private keys and wallet credentials are never stored in the public repository.
            </p>
          </div>
          <div className="trust-points">
            <div><span>✓</span><p><strong>Public testnet</strong>Ethereum Sepolia deployment</p></div>
            <div><span>✓</span><p><strong>Auditable contracts</strong>Explorer links included</p></div>
            <div><span>✓</span><p><strong>Client-side wallet</strong>MetaMask signs user actions</p></div>
          </div>
        </section>
      </main>

      <footer>
        <div className="section-wrap footer-inner">
          <div className="brand"><span className="brand-mark">C</span><span>Campus Token</span></div>
          <p>Blockchain attendance & reward prototype · Ethereum Sepolia</p>
          <a href="https://github.com/swenwang/campus" target="_blank" rel="noreferrer">View source ↗</a>
        </div>
      </footer>
    </div>
  );
}
