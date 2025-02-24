import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';

import hre from 'hardhat';
import { expect, assert } from 'chai';
import { getAddress, GetContractReturnType, WalletClient } from 'viem';

import VotingArtifact from '../artifacts/contracts/Voting.sol/Voting.json';

const VotingABI = VotingArtifact.abi;

enum WorkflowStatus {
  RegisteringVoters = 0,
  ProposalsRegistrationStarted = 1,
  ProposalsRegistrationEnd = 2,
  VotingSessionStarted = 3,
  VotingSessionEnded = 4,
  VotesTallied = 5,
}

describe('Voting system', function () {
  async function deploySmartContractFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();
    const sc = await hre.viem.deployContract('Voting');
    return { sc, owner, addr1, addr2 };
  }

  let sc: GetContractReturnType<typeof VotingABI>,
    owner: WalletClient,
    addr1: WalletClient,
    addr2: WalletClient;

  beforeEach(async function () {
    ({ sc, owner, addr1, addr2 } = await loadFixture(
      deploySmartContractFixture,
    ));
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      assert.equal(await sc.read.owner(), getAddress(owner.account!.address));
    });

    it('Workflow: Check if status is RegisteringVoters', async function () {
      const workflowStatus = await sc.read.workflowStatus();
      assert.equal(workflowStatus, WorkflowStatus.RegisteringVoters);
    });
  });

  describe('Workflow', function () {
    it('Should respect the workflow state transitions', async function () {
      // WorkflowStatus.RegisteringVoters
      expect(await sc.read.workflowStatus()).to.equal(
        WorkflowStatus.RegisteringVoters,
      );

      // RegisteringVoters -> ProposalsRegistrationStarted
      await sc.write.startProposalsRegistering();
      expect(await sc.read.workflowStatus()).to.equal(
        WorkflowStatus.ProposalsRegistrationStarted,
      );

      // ProposalsRegistrationStarted -> ProposalsRegistrationEnd
      await sc.write.endProposalsRegistering();
      expect(await sc.read.workflowStatus()).to.equal(
        WorkflowStatus.ProposalsRegistrationEnd,
      );

      // ProposalsRegistrationEnd -> VotingSessionStarted
      await sc.write.startVotingSession();
      expect(await sc.read.workflowStatus()).to.equal(
        WorkflowStatus.VotingSessionStarted,
      );

      // VotingSessionStarted -> VotingSessionEnded
      await sc.write.endVotingSession();
      expect(await sc.read.workflowStatus()).to.equal(
        WorkflowStatus.VotingSessionEnded,
      );

      // VotingSessionEnded -> VotesTallied
      await sc.write.tallyVotes();
      expect(await sc.read.workflowStatus()).to.equal(
        WorkflowStatus.VotesTallied,
      );
    });
  });

  describe('Voters', function () {
    it('Workflow: Check if status is RegisteringVoters', async function () {
      const workflowStatus = await sc.read.workflowStatus();
      assert.equal(workflowStatus, WorkflowStatus.RegisteringVoters);
    });
    it('Non-owner cannot add voters (expected to fail)', async function () {
      await expect(
        sc.write.addVoter([addr1.account!.address], { account: addr2.account }),
      ).to.be.rejectedWith('OwnableUnauthorizedAccount');
    });

    it('Owner should be able to add a voter (expected to pass)', async function () {
      await sc.write.addVoter([addr1.account!.address]);
    });

    it('Owner should not be able to add an existing voter', async function () {
      sc.write.addVoter([addr1.account!.address]);
      await expect(
        sc.write.addVoter([addr1.account!.address]),
      ).to.be.rejectedWith('Already registered');
    });

    it('Should receive an event when we add a voter', async function () {
      await sc.write.addVoter([addr1.account!.address]);

      const events = await sc.getEvents.VoterRegistered();
      expect(events).to.have.lengthOf(1);
      assert.equal(
        events[0].args.voterAddress,
        getAddress(addr1.account!.address),
      );
    });

    it('Should not add a voter during the proposal registering session', async function () {
      // Start the Proposals Registration
      await sc.write.startProposalsRegistering();
      // We check the events (should be done in another test)
      const events = await sc.getEvents.WorkflowStatusChange();

      expect(events).to.have.lengthOf(1);
      assert.equal(
        events[0].args.previousStatus,
        WorkflowStatus.RegisteringVoters,
      );
      assert.equal(
        events[0].args.newStatus,
        WorkflowStatus.ProposalsRegistrationStarted,
      );

      // Should get an error from the SC
      await expect(
        sc.write.addVoter([addr1.account!.address]),
      ).to.be.rejectedWith('Voters registration is not open yet');
    });

    // By a voter
    describe('Get Voter', function () {
      beforeEach(async function () {
        await sc.write.addVoter([addr1.account!.address]);
      });
      it('Should get a voter by a voter (voter does not exist)', async function () {
        const voter = await sc.read.getVoter([addr2.account!.address], {
          account: addr1.account!.address,
        });
        assert.equal(voter.isRegistered, false);
        assert.equal(voter.hasVoted, false);
        assert.equal(voter.votedProposalId, false);
      });

      it('Should get a voter by a voter (voter does exist)', async function () {
        //   await sc.write.addVoter([addr1.account.address]);
        await sc.write.addVoter([addr2.account!.address]);
        const voter = await sc.read.getVoter([addr2.account!.address], {
          account: addr1.account!.address,
        });
        assert.equal(voter.isRegistered, true);
        assert.equal(voter.hasVoted, false);
        assert.equal(voter.votedProposalId, false);
      });

      // By the owner
      it('Should not be called by the owner', async function () {
        //   await sc.write.addVoter([addr1.account.address]);
        await expect(
          sc.read.getVoter([addr1.account!.address]),
        ).to.be.rejectedWith("You're not a voter");
      });
    });
  });

  describe('Proposals', function () {
    describe('Start Proposals Registering Session', function () {
      it('Only the owner can start the session', async function () {
        // The user is not the owner -> Rejected
        await expect(
          sc.write.startProposalsRegistering({
            account: addr1.account!.address,
          }),
        ).to.be.rejectedWith('OwnableUnauthorizedAccount');

        // The user is the owner -> Accepted
        await sc.write.startProposalsRegistering();
      });
      it('Receive an event when we start the session', async function () {
        // The user is the owner -> Accepted
        await sc.write.startProposalsRegistering();
        const events = await sc.getEvents.WorkflowStatusChange();
        expect(events).to.be.lengthOf(1);

        assert.equal(
          events[0].args.previousStatus,
          WorkflowStatus.RegisteringVoters,
        );
        assert.equal(
          events[0].args.newStatus,
          WorkflowStatus.ProposalsRegistrationStarted,
        );
      });
      it("Can't open the proposals session if the workflow has not the correct status", async function () {
        await sc.write.startProposalsRegistering();
        await expect(sc.write.startProposalsRegistering()).to.be.rejectedWith(
          'Registering proposals cant be started now',
        );
      });
    });

    describe('End Proposals Registering Session', function () {
      it('Only the owner can end the session', async function () {
        // The user is the owner -> Accepted
        // We change the workflow status to represent the start proposals registration session.
        await sc.write.startProposalsRegistering();
        // The user is not the owner -> Rejected
        await expect(
          sc.write.endProposalsRegistering({ account: addr1.account!.address }),
        ).to.be.rejectedWith('OwnableUnauthorizedAccount');

        // The user is the owner -> Accepted
        await sc.write.endProposalsRegistering();
      });

      it('Receive an event when we end the session', async function () {
        // The user is the owner -> Accepted
        // We change the workflow status to represent the start proposals registration session.
        await sc.write.startProposalsRegistering();

        // The user is the owner -> Accepted
        await sc.write.endProposalsRegistering();
        const events = await sc.getEvents.WorkflowStatusChange();
        expect(events).to.be.lengthOf(1);

        assert.equal(
          events[0].args.previousStatus,
          WorkflowStatus.ProposalsRegistrationStarted,
        );
        assert.equal(
          events[0].args.newStatus,
          WorkflowStatus.ProposalsRegistrationEnd,
        );
      });
      it('Should close the proposal session only if we are in ProposalsRegistrationStarted', async function () {
        await expect(sc.write.endProposalsRegistering()).to.be.rejectedWith(
          'Registering proposals havent started yet',
        );
      });
    });

    describe('Add Proposal - Check the workflow status', function () {
      it('Should be reverted if the status is not ProposalsRegistrationStarted', async function () {
        await sc.write.addVoter([addr1.account!.address]);
        await expect(
          sc.write.addProposal(['Proposal 1'], {
            account: addr1.account!.address,
          }),
        ).to.be.rejectedWith('Proposals are not allowed yet');
      });
    });

    describe('Add Proposal', function () {
      beforeEach(async function () {
        await sc.write.addVoter([addr1.account!.address]);
        // We move from RegisteringVoters to ProposalsRegistrationStarted
        await sc.write.startProposalsRegistering();
      });

      it('Only a proposal with a valid description', async function () {
        await expect(
          sc.write.addProposal([''], {
            account: addr1.account!.address,
          }),
        ).to.be.rejectedWith('Vous ne pouvez pas ne rien proposer');
      });

      it('Only voter can add a proposal', async function () {
        await sc.write.addProposal(['Proposal 1'], {
          account: addr1.account!.address,
        });
      });

      it('addProposal emits an event', async function () {
        await sc.write.addProposal(['Proposal 1'], {
          account: addr1.account!.address,
        });

        const events = await sc.getEvents.ProposalRegistered();
        expect(events).to.be.lengthOf(1);
        assert.equal(events[0].args.proposalId, 1);
      });

      it("Admin can't add a proposal", async function () {
        await expect(sc.write.addProposal(['Proposal 1'])).to.be.rejectedWith(
          "You're not a voter",
        );
      });

      it('Only voters can read a proposal', async function () {
        await sc.write.addProposal(['Proposal 1'], {
          account: addr1.account!.address,
        });

        const events = await sc.getEvents.ProposalRegistered();
        expect(events).to.be.lengthOf(1);
        const proposalId = events[0].args.proposalId;
        // assert.equal(events[0].args.proposalId, 1)
        const proposal = await sc.read.getOneProposal([proposalId], {
          account: addr1.account!.address,
        });
        assert.equal(proposal.description, 'Proposal 1');
        assert.equal(proposal.voteCount, 0);
      });

      it('Non-voter receive a rejected message, when tries to read a proposal', async function () {
        await sc.write.addProposal(['Proposal 1'], {
          account: addr1.account!.address,
        });

        const events = await sc.getEvents.ProposalRegistered();
        expect(events).to.be.lengthOf(1);
        const proposalId = events[0].args.proposalId;
        // assert.equal(events[0].args.proposalId, 1)
        await expect(sc.read.getOneProposal([proposalId])).to.be.rejectedWith(
          "You're not a voter",
        );
      });
    });
  });

  describe('Votes', function () {});
});
