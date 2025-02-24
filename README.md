# Voting Smart Contract

This project implements a **Voting Smart Contract** in Solidity that allows:
- **Registering voters**
- **Submitting proposals**
- **Voting on proposals**
- **Counting votes and determining the winner**

## Features

### Voter Management
- **Only the contract owner** can register voters (`addVoter`).
- A voter **can only be registered once**.
- A registered voter can retrieve **their status** using `getVoter`.

### Proposal Management
- **Only registered voters** can submit proposals (`addProposal`).
- A proposal **cannot be empty**.
- Voters can retrieve a **specific proposal** using `getOneProposal`.

### Voting Process
- **Only registered voters** can vote (`setVote`).
- Each voter **can only vote once**.
- A vote **must be for an existing proposal**.
- The contract emits events (`Voted`, `ProposalRegistered`) to track the process.

### Workflow Status
The contract follows a strict **voting workflow** managed by the owner:
1. **RegisteringVoters** → Voters can be registered.
2. **ProposalsRegistrationStarted** → Registered voters can submit proposals.
3. **ProposalsRegistrationEnded** → Proposal submission is closed.
4. **VotingSessionStarted** → Voting begins.
5. **VotingSessionEnded** → Voting closes.
6. **VotesTallied** → Votes are counted, and a winner is determined.

## Installation

Make sure you have **Node.js** installed. Then, clone this repository and install dependencies:

```sh
git clone https://github.com/matrixise/alyra-voting-system-tests.git
cd alyra-voting-system-tests
npm install
```
## Running Tests

To run the unit tests for the smart contract:

```shell
npx hardhat test
```

## Code coverage

Because I use viem, we have to define SOLIDITY_COVERAGE on the CLI 
```shell
SOLIDITY_COVERAGE=true npx hardhat coverage
```

![Code Coverage](alyra-voting-system-tests.gif)

## Run the Github Actions with act

Install `act` from https://github.com/nektos/act
The tool will use the `.github/workflows/tests.yml`

```shell
act --container-architecture linux/amd64
```

![Github Actions with Act](alyra-voting-system-tests-act.gif)