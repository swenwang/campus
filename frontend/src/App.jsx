import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './tokenomics.css';

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
    title: 'Dual-token incentives',
    text: 'AToken records participation value while BToken forms a separate reward layer, connected through an on-chain exchange mechanism.'
  },
  {
    number: '03',
    title: 'Expandable reward ecosystem',
    text: 'BToken is designed as the extensible reward layer that could support future benefits with campus stores, cafés, events and partner merchants.'
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
          <span className="brand-mark">C</span><span>Campus Token</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#solution">Solution</a>
          <a href="#token-economy">Token economy</a>
          <a href="#how-it-works">How it works</a>
          <a href="#demo">Live demo</a>
        </nav>
        <button className="nav-cta" onClick={connectWallet}>{account ? shortAddress(account) : 'Connect wallet'}</button>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="network-pill"><span className="network-dot" /> Live prototype · Ethereum Sepolia</div>
            <h1>Turn campus participation into <span>verifiable value.</span></h1>
            <p className="hero-lede">
              A dual-token campus incentive system that transforms verified attendance into AToken, then lets students convert participation into BToken for a future campus-wide reward ecosystem.
            </p>
            <div className="hero-actions">
              <button className="primary-cta" onClick={connectWallet}>Launch live demo <span>↗</span></button>
              <a className="secondary-cta" href="#token-economy">See the token model</a>
            </div>
            <div className="hero-proof">
              <div><strong>AToken</strong><span>participation layer</span></div>
              <div><strong>BToken</strong><span>reward layer</span></div>
              <div><strong>On-chain</strong><span>exchange mechanism</span></div>
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
                <div><strong>Attendance verified</strong><span>Participation recorded on-chain</span></div>
                <span className="activity-amount">+10 ATK</span>
              </div>
            </div>
          </div>
        </section>

        <section className="value-strip">
          <div className="section-wrap strip-grid">
            <p>Built for a connected campus economy</p>
            <span>Attendance</span><span>AToken</span><span>BToken</span><span>Merchant Rewards</span>
          </div>
        </section>

        <section className="section-wrap content-section" id="solution">
          <div className="section-heading split-heading">
            <div><p className="kicker">The solution</p><h2>Participation should create value beyond the classroom.</h2></div>
            <p>Campus Token connects attendance verification, incentive design and future merchant rewards through a single wallet-based experience.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <span className="feature-number">{feature.number}</span><h3>{feature.title}</h3><p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-wrap token-economy" id="token-economy">
          <div className="token-heading">
            <p className="kicker">Dual-token architecture</p>
            <h2>Two tokens. Two layers of value.</h2>
            <p>Separating participation from redemption creates a cleaner incentive model: students first earn value through verified activity, then choose when to convert that value into the reward ecosystem.</p>
          </div>

          <div className="token-flow">
            <article className="token-card token-a">
              <div className="token-symbol">A</div>
              <span className="token-type">Participation Layer</span>
              <h3>AToken</h3>
              <p>Earned from verified attendance. AToken represents participation and acts as the first layer of the incentive system.</p>
              <ul><li>Issued after attendance verification</li><li>Stored in the student wallet</li><li>Converted through RewardExchange</li></ul>
            </article>

            <div className="exchange-bridge">
              <span className="bridge-label">RewardExchange</span>
              <div className="bridge-arrow">→</div>
              <strong>{rate || 'Dynamic'} ATK : 1 BTK</strong>
              <small>On-chain conversion layer</small>
            </div>

            <article className="token-card token-b">
              <div className="token-symbol">B</div>
              <span className="token-type">Reward Layer</span>
              <h3>BToken</h3>
              <p>Converted from accumulated AToken. BToken is designed as the redeemable layer for a broader campus rewards ecosystem.</p>
              <ul><li>Obtained through AToken conversion</li><li>Separate reward-oriented asset</li><li>Expandable to partner redemption scenarios</li></ul>
            </article>
          </div>

          <div className="ecosystem-panel">
            <div className="ecosystem-copy">
              <span className="future-tag">Future development</span>
              <h3>From classroom rewards to a campus partner network.</h3>
              <p>
                The long-term vision is to connect BToken with campus stores and partner merchants. Students could convert participation into benefits such as café discounts, merchandise, event rewards or limited campus offers, while merchants gain a new channel for student engagement.
              </p>
            </div>
            <div className="merchant-grid">
              <div><span>☕</span><strong>Campus cafés</strong><small>Drink & meal rewards</small></div>
              <div><span>🛍</span><strong>Campus stores</strong><small>Merchandise benefits</small></div>
              <div><span>🎟</span><strong>Campus events</strong><small>Tickets & experiences</small></div>
              <div><span>🤝</span><strong>Partner merchants</strong><small>Joint student incentives</small></div>
            </div>
          </div>
        </section>

        <section className="dark-section" id="how-it-works">
          <div className="section-wrap">
            <div className="section-heading dark-heading">
              <p className="kicker">How it works</p><h2>From attendance to a future campus reward.</h2>
              <p>The prototype already implements attendance, AToken issuance and AToken-to-BToken exchange on Sepolia.</p>
            </div>
            <div className="flow-grid extended-flow">
              <div className="flow-step"><span>1</span><div><strong>Teacher signs attendance</strong><p>A unique class credential is signed by the instructor wallet.</p></div></div>
              <div className="flow-line" />
              <div className="flow-step"><span>2</span><div><strong>Student earns AToken</strong><p>The smart contract verifies the claim and rewards participation.</p></div></div>
              <div className="flow-line" />
              <div className="flow-step"><span>3</span><div><strong>AToken converts to BToken</strong><p>RewardExchange executes the on-chain dual-token conversion.</p></div></div>
              <div className="flow-line future-line" />
              <div className="flow-step future-step"><span>4</span><div><strong>Future merchant rewards</strong><p>BToken can become the redemption layer for campus partners.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section-wrap demo-section" id="demo">
          <div className="demo-intro">
            <div><p className="kicker">Live product demo</p><h2>Try the dual-token protocol on Sepolia.</h2></div>
            <p>The deployed prototype supports wallet connection, attendance claims, AToken balances and live AToken-to-BToken exchange.</p>
          </div>

          <div className="workspace">
            <div className="workspace-sidebar">
              <div><span className="sidebar-label">Network</span><div className="sidebar-value"><span className="network-dot" /> Ethereum Sepolia</div></div>
              <div><span className="sidebar-label">Wallet</span><div className="sidebar-value">{account ? shortAddress(account) : 'Not connected'}</div></div>
              <div><span className="sidebar-label">Role</span><div className="sidebar-value">{account ? (isTeacher ? 'Teacher' : 'Student') : '—'}</div></div>
              <div className="contract-links">
                <span className="sidebar-label">Deployed contracts</span>
                <a href={`https://sepolia.etherscan.io/address/${A_ADDRESS}`} target="_blank" rel="noreferrer">AToken ↗</a>
                <a href={`https://sepolia.etherscan.io/address/${B_ADDRESS}`} target="_blank" rel="noreferrer">BToken ↗</a>
                <a href={`https://sepolia.etherscan.io/address/${EX_ADDRESS}`} target="_blank" rel="noreferrer">RewardExchange ↗</a>
              </div>
            </div>

            <div className="workspace-main">
              {!account ? (
                <div className="connect-state">
                  <div className="connect-orb">◈</div><h3>Connect your wallet to enter the workspace</h3>
                  <p>The demo will switch MetaMask to Sepolia and load balances from the deployed AToken, BToken and RewardExchange contracts.</p>
                  <button className="primary-cta" onClick={connectWallet}>Connect MetaMask</button>
                </div>
              ) : (
                <>
                  <div className="balance-grid">
                    <article className="balance-card"><span>A Token balance</span><strong>{Number(aBalance).toFixed(4)}</strong><small>ATK · participation layer</small></article>
                    <article className="balance-card"><span>B Token balance</span><strong>{Number(bBalance).toFixed(4)}</strong><small>BTK · reward layer</small></article>
                    <article className="balance-card"><span>Current exchange</span><strong>{rate || '—'} : 1</strong><small>ATK required per BTK</small></article>
                  </div>

                  <div className="action-card">
                    <div className="action-heading">
                      <div><span className="action-label">{isTeacher ? 'Teacher workspace' : 'Student workspace'}</span><h3>{isTeacher ? 'Create attendance credential' : 'Verify attendance & earn AToken'}</h3></div>
                      <span className="role-pill">{isTeacher ? 'Issuer' : 'Participant'}</span>
                    </div>
                    <label><span>Class ID</span><input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="e.g. FINTECH-2026-09-09" /></label>
                    <label><span>Teacher signature</span><textarea value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={isTeacher ? 'Generated signature will appear here' : 'Paste the signature provided by the teacher'} rows="4" /></label>
                    <button className="primary-cta full-width" onClick={isTeacher ? signAttendance : claimAttendance}>{isTeacher ? 'Generate signed credential' : 'Verify & claim 10 ATK'}</button>
                  </div>

                  {!isTeacher && (
                    <div className="action-card exchange-card featured-exchange">
                      <div className="exchange-eyebrow">AToken → BToken</div>
                      <div className="action-heading">
                        <div><span className="action-label">Dual-token exchange</span><h3>Convert participation into reward value</h3></div>
                        <span className="rate-pill">{rate || '—'} ATK = 1 BTK</span>
                      </div>
                      <p className="exchange-description">Choose how much BToken you want to receive. The smart contract calculates the required AToken, requests approval, then completes the conversion on-chain.</p>
                      <label><span>BToken amount to receive</span><input value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="Enter BTK amount" inputMode="decimal" /></label>
                      <div className="exchange-preview"><span>You receive</span><strong>{amountB || '0'} BTK</strong><span>Required AToken</span><strong>{amountB && rate ? Number(amountB) * Number(rate) : 0} ATK</strong></div>
                      <button className="primary-cta full-width" onClick={approveAndExchange}>Approve AToken & exchange to BToken</button>
                      <small className="future-use-note">Future vision · BToken can serve as the redemption currency for campus stores and partner rewards.</small>
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
            <p className="kicker">Prototype scope</p><h2>A working core with a clear path to a wider ecosystem.</h2>
            <p>The current Sepolia prototype implements attendance verification, AToken issuance and AToken-to-BToken exchange. Campus-store and merchant redemption is presented as a future product direction rather than an already deployed partnership.</p>
          </div>
          <div className="trust-points">
            <div><span>✓</span><p><strong>Working today</strong>Attendance → AToken</p></div>
            <div><span>✓</span><p><strong>Working today</strong>AToken → BToken exchange</p></div>
            <div><span>→</span><p><strong>Next-stage vision</strong>Campus merchant rewards</p></div>
          </div>
        </section>
      </main>

      <footer>
        <div className="section-wrap footer-inner">
          <div className="brand"><span className="brand-mark">C</span><span>Campus Token</span></div>
          <p>Dual-token campus attendance & reward prototype · Ethereum Sepolia</p>
          <a href="https://github.com/swenwang/campus" target="_blank" rel="noreferrer">View source ↗</a>
        </div>
      </footer>
    </div>
  );
}
