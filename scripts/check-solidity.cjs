// Compile in memory only: no network, global cache writes, or child processes.
const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');
const root = path.resolve(__dirname, '..');
const sources = Object.fromEntries(['AToken.sol', 'BToken.sol', 'RewardExchange.sol'].map((name) => [
  `contracts/${name}`, { content: fs.readFileSync(path.join(root, 'contracts', name), 'utf8') },
]));
const output = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources,
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
}), { import(importPath) {
  const base = path.join(root, 'node_modules');
  const resolved = path.resolve(base, importPath);
  if (!resolved.startsWith(base + path.sep)) return { error: 'Import outside dependencies' };
  try { return { contents: fs.readFileSync(resolved, 'utf8') }; }
  catch { return { error: `Missing import: ${importPath}` }; }
} }));
for (const diagnostic of output.errors || []) console.log(diagnostic.formattedMessage);
if ((output.errors || []).some((diagnostic) => diagnostic.severity === 'error')) process.exitCode = 1;
else console.log(`Compiled all three Campus contracts in memory with solc ${solc.version()}. This is a compile check, not an EVM test run.`);
