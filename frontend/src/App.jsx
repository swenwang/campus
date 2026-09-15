import { useCampus } from './useCampus';
import { A_ADDRESS, B_ADDRESS, EX_ADDRESS } from './protocol';
import './tokenomics.css';
import DemoWalkthrough from './DemoWalkthrough.jsx';

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
  const { account, isTeacher, aBalance, bBalance, rate, secure, busy, status, classId, setClassId, signature, setSignature, student, setStudent, deadline, setDeadline, amountB, setAmountB, quote, txHash, connectWallet, signAttendance, claimAttendance, getQuote, approveAndExchange, revokeApproval } = useCampus();

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
          <a href="#walkthrough">Try the demo</a>
        </nav>
        <button className="nav-cta" disabled={busy} onClick={connectWallet}>{busy ? 'Please wait…' : account ? shortAddress(account) : 'Connect wallet'}</button>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="network-pill"><span className="network-dot" /> Portfolio prototype · Ethereum Sepolia</div>
            <h1>Turn campus participation into <span>verifiable value.</span></h1>
            <p className="hero-lede">
              A dual-token campus incentive system that transforms verified attendance into AToken, then lets students convert participation into BToken for a future campus-wide reward ecosystem.
            </p>
            <div className="hero-actions">
              <a className="primary-cta" href="#walkthrough">Try without a wallet <span>↗</span></a>
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
              <div className="window-balance-label">{account ? 'Participation balance' : 'Illustrative preview · not live balances'}</div>
              <div className="window-balance">{account ? Number(aBalance).toFixed(2) : '24.00'} <span>ATK</span></div>
              <div className="window-grid">
                <div><span>Reward token</span><strong>{account ? Number(bBalance).toFixed(2) : '6.00'} BTK</strong></div>
                <div><span>Current tier rate</span><strong>{rate || '—'} : 1</strong></div>
              </div>
              <div className="window-activity">
                <div className="activity-icon">✓</div>
                <div><strong>Attendance reward</strong><span>10 ATK per valid credential</span></div>
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
              <p>Version 2 adds wallet-bound attendance credentials and protected exchange quotes. Transaction actions require a version 2 deployment.</p>
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

        <DemoWalkthrough />

        <section className="section-wrap demo-section" id="demo">
          <div className="demo-intro">
            <div><p className="kicker">Wallet workspace</p><h2>Inspect the protocol on Sepolia.</h2></div>
            <p>Connect to inspect the configured Sepolia deployment. Attendance and exchange are enabled only for version 2 contracts.</p>
          </div>

          <div className="workspace">
            <div className="workspace-sidebar">
              <div><span className="sidebar-label">{account ? 'Connected network' : 'Target network'}</span><div className="sidebar-value"><span className="network-dot" /> Ethereum Sepolia</div></div>
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
                  <p>Connecting shares your public wallet address with this site. Never enter a seed phrase or private key here.</p>
                  <button className="primary-cta" disabled={busy} onClick={connectWallet}>Connect MetaMask</button>
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Get MetaMask</a>
                </div>
              ) : (
                <>
                  {!secure && <p className="security-notice" role="alert">Legacy deployment: attendance and exchange are disabled because these contracts lack wallet-bound credentials and price protection. Deploy version 2 and configure its addresses to enable actions.</p>}
                  <p className="future-use-note">Attendance claims publish the class ID and wallet address permanently on Sepolia. Use an opaque class code; do not include names, student numbers or other personal details.</p>
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
                    <label><span>Class ID</span><input disabled={busy || !secure} value={classId} onChange={(e) => { setClassId(e.target.value); if (isTeacher) setSignature(''); }} placeholder="e.g. FINTECH-2026-09-09" /></label>
                    {isTeacher && <label><span>Student wallet address</span><input disabled={busy || !secure} value={student} onChange={(e) => { setStudent(e.target.value); setSignature(''); }} placeholder="0x…" /></label>}
                    <label><span>Expiry (Unix timestamp supplied with the credential)</span><input disabled={busy || !secure} readOnly={isTeacher} value={deadline} onChange={(e) => setDeadline(e.target.value)} inputMode="numeric" placeholder="Generated by teacher" /></label>
                    <label><span>Teacher signature</span><textarea disabled={busy || !secure} readOnly={isTeacher} value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={isTeacher ? 'Generated signature will appear here' : 'Paste the signature provided by the teacher'} rows="4" /></label>
                    <button className="primary-cta full-width" disabled={busy || !secure} onClick={isTeacher ? signAttendance : claimAttendance}>{isTeacher ? 'Generate 15-minute credential' : 'Verify & claim 10 ATK'}</button>
                  </div>

                  {!isTeacher && (
                    <div className="action-card exchange-card featured-exchange">
                      <div className="exchange-eyebrow">AToken → BToken</div>
                      <div className="action-heading">
                        <div><span className="action-label">Dual-token exchange</span><h3>Convert participation into reward value</h3></div>
                        <span className="rate-pill">{rate || '—'} ATK = 1 BTK</span>
                      </div>
                      <p className="exchange-description">Get a quote first. Orders crossing a 5 BTK supply boundary include each tier's price. Your approval and maximum cost are limited to the reviewed quote.</p>
                      <label><span>BToken amount to receive</span><input disabled={busy || !secure} value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="Enter BTK amount" inputMode="decimal" /></label>
                      <div className="exchange-preview"><span>You receive</span><strong>{amountB || '0'} BTK</strong><span>Maximum AToken cost</span><strong>{quote} ATK</strong></div>
                      <button className="secondary-cta" disabled={busy || !secure} onClick={getQuote}>Get current quote</button>
                      <button className="primary-cta full-width" disabled={busy || !secure || quote === '—'} onClick={approveAndExchange}>Approve quoted AToken & exchange</button>
                      <small className="future-use-note">Future vision · BToken can serve as the redemption currency for campus stores and partner rewards.</small>
                    </div>
                  )}
                  <button className="secondary-cta" disabled={busy} onClick={revokeApproval}>Revoke exchange allowance</button>
                  <p className="future-use-note">If an exchange is cancelled or fails after approval, use Revoke exchange allowance to remove any remaining authorization.</p>
                </>
              )}
              <div className="status-bar" role="status" aria-live="polite"><span className="status-pulse" /> <span>{status}</span></div>
              {txHash && <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">View latest transaction on Sepolia ↗</a>}
            </div>
          </div>
        </section>

        <section className="section-wrap trust-section">
          <div className="trust-copy">
            <p className="kicker">Prototype scope</p><h2>A working core with a clear path to a wider ecosystem.</h2>
            <p>The repository implements attendance verification, AToken issuance and AToken-to-BToken exchange. Version 2 requires a new deployment; legacy contracts are available for balance viewing only. Campus-store and merchant redemption remains a future product direction.</p>
          </div>
          <div className="trust-points">
            <div><span>✓</span><p><strong>Version 2 protocol</strong>Attendance → AToken</p></div>
            <div><span>✓</span><p><strong>Version 2 protocol</strong>AToken → BToken exchange</p></div>
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
