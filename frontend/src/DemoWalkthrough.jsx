import { useReducer } from 'react';
import { demoStep, initialDemo } from './demo.js';

export default function DemoWalkthrough() {
  const [demo, dispatch] = useReducer(demoStep, initialDemo);
  return <section className="section-wrap content-section" id="walkthrough" aria-labelledby="walkthrough-title">
    <div className="section-heading">
      <p className="kicker">Interactive walkthrough · simulated</p>
      <h2 id="walkthrough-title">Experience the flow in three clicks.</h2>
      <p>This local demonstration uses sample data. It does not connect a wallet, create a real signature or send a blockchain transaction.</p>
    </div>
    <div className="feature-grid">
      <article className="feature-card">
        <span className="feature-number">01 · Teacher</span><h3>Issue attendance</h3>
        <p>The teacher confirms attendance and issues a credential for one student's wallet.</p>
        <button className="primary-cta" disabled={demo.issued} onClick={() => dispatch('issue')}>{demo.issued ? 'Sample credential issued' : 'Issue sample credential'}</button>
      </article>
      <article className="feature-card">
        <span className="feature-number">02 · Student</span><h3>Claim participation</h3>
        <p>The student redeems the credential once to receive 10 ATK. Try step 1 to unlock this action.</p>
        <button className="primary-cta" disabled={!demo.issued || demo.claimed} onClick={() => dispatch('claim')}>{demo.claimed ? '10 sample ATK claimed' : 'Claim sample reward'}</button>
      </article>
      <article className="feature-card">
        <span className="feature-number">03 · Exchange</span><h3>Convert to rewards</h3>
        <p>At the initial 100:1 supply tier, 10 ATK converts into 0.1 BTK. Real transactions require a reviewed quote and wallet approval.</p>
        <button className="primary-cta" disabled={!demo.claimed || demo.exchanged} onClick={() => dispatch('exchange')}>{demo.exchanged ? 'Sample exchange complete' : 'Exchange 10 sample ATK'}</button>
      </article>
    </div>
    <div className="walkthrough-result" role="status" aria-live="polite">
      <p><strong>Sample balances:</strong> {demo.a} ATK · {demo.b} BTK</p>
      <button className="secondary-cta" onClick={() => dispatch('reset')}>Reset walkthrough</button>
    </div>
    <p className="future-use-note">To inspect the Sepolia deployment, use the wallet workspace below. Version 2 transactions require a separate deployment; the walkthrough is always available.</p>
  </section>;
}
