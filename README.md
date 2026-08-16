# 🛡️ TrustPay — Decentralized Multi-Party Milestone Escrow Protocol
[![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet%20(10143)-8A2BE2?style=for-the-badge)](https://testnet.monadscan.com)
[![Smart Contract](https://img.shields.io/badge/Contract-Verified%20On--Chain-10B981?style=for-the-badge)](https://testnet.monadscan.com/address/0xb109ad9679cca4757ba689b1878b3dc78e5ba8fa)
[![Non-Custodial](https://img.shields.io/badge/Security-Non--Custodial%20%26%20ReentrancyGuard-06B6D4?style=for-the-badge)](https://github.com/Shivkumarrathod/TrustPay)

**TrustPay** is a high-performance, non-custodial decentralized escrow application built on the **Monad Testnet**. It enables clients and service providers (developers, freelancers, agencies) to transact safely with staged milestone releases, cryptographic proof verification, and impartial arbitration.

---

## 🌐 Live Monad Testnet Deployment

| Parameter | Details |
|---|---|
| **Contract Name** | `YourContract` (TrustPay Protocol) |
| **Contract Address** | [`0xb109ad9679cca4757ba689b1878b3dc78e5ba8fa`](https://testnet.monadscan.com/address/0xb109ad9679cca4757ba689b1878b3dc78e5ba8fa) |
| **Fixed Official Arbiter** | [`0xcfE82707bfA7ecdA2a4850e8d13C616193FDf75d`](https://testnet.monadscan.com/address/0xcfE82707bfA7ecdA2a4850e8d13C616193FDf75d) |
| **Network Name** | **Monad Testnet** |
| **Chain ID** | `10143` |
| **Currency Symbol** | `MON` |
| **Public RPC Endpoint** | `https://10143.rpc.thirdweb.com` |
| **Block Explorer** | [https://testnet.monadscan.com](https://testnet.monadscan.com) |

---

## 👥 Three-Party Workflow Guide

TrustPay is designed around 3 distinct participant roles to ensure complete trustlessness:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             TRUSTPAY PROTOCOL                            │
│                                                                          │
│    1. Creates & Funds Escrow                                             │
│  ┌───────────────────────────┐                 ┌───────────────────────┐ │
│  │       BUYER (Client)      │                 │  SELLER (Freelancer)  │ │
│  │   0xd9D3...3b93 (e.g.)    │                 │  0x25e0...6036 (e.g.) │ │
│  └─────────────┬─────────────┘                 └───────────▲───────────┘ │
│                │                                           │             │
│   Locks MON    │                                           │ 3. Payout   │
│   into Escrow  ▼                                           │    Released │
│  ┌─────────────────────────────────────────────────────────┴───────────┐ │
│  │                  NON-CUSTODIAL ESCROW CONTRACT                     │ │
│  │           (0xb109ad9679cca4757ba689b1878b3dc78e5ba8fa)              │ │
│  │                                                                     │ │
│  │  • Milestone 1: 0.1 MON  [Proof Submitted] ──► [Approved & Paid]   │ │
│  │  • Milestone 2: 0.2 MON  [In Progress...]                           │ │
│  └──────────────────────────────────┬──────────────────────────────────┘ │
│                                     │                                    │
│                     In case of      │ 4. Impartial                       │
│                      Dispute        │    Arbitration Split               │
│                                     ▼                                    │
│                      ┌─────────────────────────────┐                     │
│                      │      OFFICIAL ARBITER       │                     │
│                      │ 0xcfE82707bfA7ecdA2a4850... │                     │
│                      └─────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1️⃣ Role 1: Buyer (Client / Project Owner)
- **Creates the Agreement**: Fills in the Seller's wallet address, specifies the deadline, and defines custom milestone phases (e.g. Phase 1: 0.1 MON, Phase 2: 0.2 MON).
- **Deposits Funds**: Locks the full contract amount (`MON`) into the smart contract. Funds are safely held on-chain with zero third-party custody.
- **Reviews & Approves Work**: Inspects submitted cryptographic deliverables (`bytes32 proofHash` / IPFS / GitHub hash).
- **Releases Payment**: Approves the milestone to immediately trigger an on-chain transfer of funds to the Seller.
- **Dispute Protection**: Can reject inadequate work or raise a dispute to call in the Arbiter if an agreement cannot be reached.

### 2️⃣ Role 2: Seller (Developer / Freelancer / Service Provider)
- **Guaranteed Payment Security**: Sees that client funds are 100% locked in the smart contract before writing a single line of code.
- **Submits Deliverable Proof**: Upon completing a milestone, submits the deliverable proof hash (`bytes32`) on-chain.
- **Automated Payouts**: Receives payment directly into their wallet the moment the buyer approves the milestone.
- **Dispute Protection**: Can raise a dispute if the buyer becomes unresponsive or refuses to approve legitimate completed work.

### 3️⃣ Role 3: Arbiter (Neutral Dispute Mediator / Protocol Guardian)
- **Constant Address**: `0xcfE82707bfA7ecdA2a4850e8d13C616193FDf75d` (hardcoded & verified across the platform).
- **Impartial Mediation**: Only interacts if a dispute is raised by either the Buyer or Seller.
- **Fair Settlement Execution**: Evaluates deliverables and evidence submitted by both sides, and executes `resolveDispute(escrowId, milestoneId, buyerAmount, sellerAmount)` to fairly divide and release the disputed milestone funds.

---

## ⚡ Quickstart Guide (Run Locally)

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (`>= v18.17.0` or `>= v20.x`)
- **Yarn** (`v1.x` or `v2+`)
- **Git**

---

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/Shivkumarrathod/TrustPay.git
cd TrustPay
yarn install
```

---

### 2. Start the Frontend Application
```bash
yarn start
```
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

The frontend is pre-configured to connect to the deployed **TrustPay Contract** on **Monad Testnet**.

---

### 3. Connect Wallet & Test the 3 Roles

1. **Get Monad Testnet MON**: Obtain testnet tokens from the official Monad faucet.
2. **Account 1 (Buyer)**: Connect with your primary wallet and click **"Create New Escrow"**. Enter any second wallet as Seller and configure your milestone schedule. Click **"Deploy Agreement"**, then click **"Deposit & Fund Escrow"**.
3. **Account 2 (Seller)**: Switch to your second wallet. Open the escrow under **"My Contracts"** and click **"Submit Deliverable Proof"** on Milestone 1.
4. **Account 1 (Buyer)**: Switch back to the Buyer wallet and click **"Approve & Release Payment"**. Watch the payout land in the Seller's wallet instantly!
5. **Account 3 (Arbiter)**: In case a dispute is triggered, connect with the Arbiter account `0xcfE82707bfA7ecdA2a4850e8d13C616193FDf75d` and navigate to the **"Dispute Center"** tab to resolve and split funds.

---

## 💻 Smart Contract Development (Optional)

If you wish to compile or deploy your own instances of the contract:

```bash
# Compile Solidity contracts
yarn compile

# Run local Hardhat blockchain
yarn chain

# Deploy to local network
yarn deploy

# Deploy to Monad Testnet
yarn deploy --network monadTestnet
```

---

## 🛡️ Security Architecture

- **🔒 Non-Custodial**: Neither TrustPay nor any third party ever has custodial access to user funds. Deposits are programmatically locked in `YourContract.sol`.
- **🛡️ ReentrancyGuard**: All state-modifying withdrawal, release, and refund functions are protected by OpenZeppelin's `ReentrancyGuard`.
- **📦 Multi-Milestone Granularity**: Milestone funds are released independently. Completed milestones cannot be retroactively locked or refunded.
- **⚡ Pull over Push & SafeERC20**: Payouts and refunds use robust transfer primitives to prevent transfer failures from freezing contract state.

---

## 📂 Project Structure

```
TrustPay/
├── packages/
│   ├── hardhat/                # Smart Contract Development Environment
│   │   ├── contracts/          # YourContract.sol (TrustPay Protocol)
│   │   ├── deploy/             # Deployment scripts
│   │   └── hardhat.config.ts   # Network configurations (Monad Testnet)
│   └── nextjs/                 # Modern React / Next.js Web3 Frontend
│       ├── app/                # App router (page.tsx, layout.tsx)
│       ├── components/         # Scaffold-ETH & TrustPay UI components
│       │   └── trustpay/       # Hero, EscrowList, DetailModal, CreateModal, DisputeCenter, ActivityStream
│       ├── contracts/          # deployedContracts.ts (ABIs & addresses)
│       └── scaffold.config.ts  # Target network configuration (monadTestnet)
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
