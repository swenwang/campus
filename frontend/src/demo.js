export const initialDemo = { issued: false, claimed: false, exchanged: false, a: 0, b: '0' };
export function demoStep(state, action) {
  if (action === 'reset') return { ...initialDemo };
  if (action === 'issue' && !state.issued) return { ...state, issued: true };
  if (action === 'claim' && state.issued && !state.claimed) return { ...state, claimed: true, a: 10 };
  if (action === 'exchange' && state.a >= 10 && !state.exchanged) return { ...state, exchanged: true, a: state.a - 10, b: '0.1' };
  return state;
}
