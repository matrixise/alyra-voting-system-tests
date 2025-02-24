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

```shell
env SOLIDITY_COVERAGE=true npx hardhat coverage

Version
=======
> solidity-coverage: v0.8.14

Instrumenting for coverage...
=============================

> Voting.sol

Compilation:
============

Nothing to compile

Network Info
============
> HardhatEVM: v2.22.18
> network:    hardhat



  Voting system
    Deployment
      ✔ Should set the right owner
      ✔ Should start with the workflow status: RegisteringVoters
    Workflow transitions
      ✔ Should respect the workflow state transitions
    Voter Management
      ✔ Should allow only the owner to add voters
      ✔ Should emit VoterRegistered event when adding a voter
      ✔ Should prevent adding a voter twice
      ✔ Should not add a voter during the proposal registering session
      Get Voter
        ✔ Should get a voter by a voter (voter does not exist)
        ✔ Should get a voter by a voter (voter does exist)
        ✔ Should not be called by the owner
    Proposal Management
      Start Proposals Registering Session
        ✔ Only the owner can start the session
        ✔ Should emit WorkflowStatusChange event when start Proposals Registering
        ✔ Can't open the proposals session if the workflow has not the correct status
      End Proposals Registering Session
        ✔ Only the owner can end the session
        ✔ Receive an event when we end the session
        ✔ Should close the proposal session only if we are in ProposalsRegistrationStarted
      Add Proposal - Check the workflow status
        ✔ Should be reverted if the status is not ProposalsRegistrationStarted
      Add Proposal
        ✔ Only a proposal with a valid description
        ✔ Only voter can add a proposal
        ✔ addProposal emits an event
        ✔ Admin can't add a proposal
        ✔ Only voters can read a proposal
        ✔ Non-voter receive a rejected message, when tries to read a proposal
    Votes
      Start the session
        ✔ A non-admin can't start the voting session (fail)
        ✔ Can't start the voting session if are not in the right workflow status (fail)
        Start the session
          ✔ Admin can start the voting session
          ✔ Add a GENESIS proposal
          ✔ Emit a Workflow event
      Stop the session
        ✔ A non-admin can't stop the voting session (fail)
        ✔ Admin can stop the voting session
        ✔ Receive a WorkflowStatusChange event
        ✔ Can't stop the voting session if not in the right phase of workflow
      Voting Session
        ✔ The voting session is not yet started
        ✔ An admin can't vote
        ✔ Only voter can vote
        ✔ Emit a Voted event
        ✔ A voter can only vote one time
        ✔ A vote is only on an existing proposal
        Tally Votes
          ✔ A non-admin can't call the function
          ✔ An admin can call the function
          ✔ emits a WorkflowStatusChange event
          ✔ should be equal to 2
          ✔ Require WorkflowStatus.VotingSessionEnded
          ✔ Require WrokflowStatus.VotingSessionEnded


  44 passing (458ms)

-------------|----------|----------|----------|----------|----------------|
File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts/  |      100 |      100 |      100 |      100 |                |
  Voting.sol |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
All files    |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json
```

## Run the Github Actions with act

Install `act` from https://github.com/nektos/act
The tool will use the `.github/workflows/tests.yml`

```shell
act --container-architecture linux/amd64
```

![Github Actions with Act](alyra-voting-system-tests-act.gif)