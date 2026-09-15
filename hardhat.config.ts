import { defineConfig, configVariable } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatChai from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import { createRequire } from "node:module";
import "dotenv/config";
const require = createRequire(import.meta.url);
export default defineConfig({
  plugins: [hardhatEthers, hardhatChai, hardhatMocha],
  solidity: {
    version: "0.8.37",
    path: require.resolve("solc/soljson.js"),
    preferWasm: true,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    }
  },
  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});
