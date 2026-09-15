export const SEPOLIA = '0xaa36a7';

export function subscribeWallet(provider, onChange) {
  const events = ['accountsChanged', 'chainChanged', 'disconnect'];
  for (const event of events) provider.on?.(event, onChange);
  return () => { for (const event of events) provider.removeListener?.(event, onChange); };
}

export async function assertWalletAccount(provider, expectedAccount) {
  const chain = await provider.request({ method: 'eth_chainId' });
  const accounts = await provider.request({ method: 'eth_accounts' });
  if (chain !== SEPOLIA || !expectedAccount || accounts[0]?.toLowerCase() !== expectedAccount.toLowerCase()) {
    throw new Error('Wallet changed. Reconnect to Sepolia before continuing.');
  }
}

export function getMetaMask(scope = window) {
  const injected = scope.ethereum;
  return injected?.providers?.find((provider) => provider.isMetaMask)
    ?? (injected?.isMetaMask ? injected : null);
}

export async function connectMetaMask(provider) {
  if (!provider) throw new Error('Install MetaMask or open this site in the MetaMask mobile browser.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts.length) throw new Error('No wallet account is available. Unlock MetaMask and reconnect.');
  if (await provider.request({ method: 'eth_chainId' }) !== SEPOLIA) {
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA }] });
    } catch (error) {
      if ((error.code ?? error.data?.originalError?.code) !== 4902) throw error;
      await provider.request({ method: 'wallet_addEthereumChain', params: [{
        chainId: SEPOLIA, chainName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      }] });
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA }] });
    }
  }
  if (await provider.request({ method: 'eth_chainId' }) !== SEPOLIA) throw new Error('Switch MetaMask to Sepolia and reconnect.');
  return accounts[0];
}

export function walletError(error) {
  const code = error.code ?? error.info?.error?.code;
  if (code === 4001 || code === 'ACTION_REJECTED') return 'Request cancelled in MetaMask. You can try again.';
  if (code === -32002) return 'A request is already open. Check MetaMask.';
  return error.reason || error.shortMessage || error.message || 'Wallet request failed. Please try again.';
}
