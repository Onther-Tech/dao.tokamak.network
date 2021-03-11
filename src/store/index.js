import Web3 from 'web3';
import { toBN } from 'web3-utils';
import numeral from 'numeral';

import {
  getCandidates,
  getAgendas,
  getCandidateVoteRank,
  getAgendaContents,
  getVotersByCandidate,
  getAgendaVotesByVoter,
  getAgendaVotes,
  getAgendasCanVote,
} from '@/api';
import {
  getContract,
  parseAgendaBytecode,
  getContractABIFromAddress,
} from '@/utils/contracts';
import { agendaStatus } from '@/utils/helpers';
import { createCurrency } from '@makerdao/currency';

import Vue from 'vue';
import Vuex from 'vuex';

const _TON = createCurrency('TON');

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    launched: false,
    etherscanAddress: 'https://etherscan.io',
    pendingTx: '',
    confirmBlock: 1,

    web3: null,
    account: '',
    chainId: '',
    blockNumber: 0,
    blockTime: 0,

    tonBalance: 0,
    wtonBalance: 0,
    winningProbability: '',
    contractState: {},

    candidates: [],
    maxMember: 0,
    members: [],
    nonmembers: [],

    agendas: [],
    agendasCanVote: [],

    voters: [],
    myVotes: 0,
    votersOfAgenda: [],
    votingDetails: [],
    myVote: [],
    agendaVotesByCandidates: [],
    activityReward: [],
    votedCandidatesFromAccount: [],

    requestsByCandidate: [],
    candidateVoteRank: [],
  },
  mutations: {
    SET_WEB3 (state, web3) {
      state.web3 = web3;
    },
    SET_ACCOUNT (state, account) {
      state.account = account;
    },
    SET_CHAIN_ID (state, chainId) {
      state.chainId = chainId;
    },
    SET_BLOCK_NUMBER (state, blockNumber) {
      state.blockNumber = blockNumber;
    },
    SET_BLOCK_TIME (state, blockTime) {
      state.blockTime = blockTime;
    },
    SET_CANDIDATES (state, candidates) {
      state.candidates = candidates;
    },
    SET_MAX_MEMBER (state, maxMember) {
      state.maxMember = maxMember;
    },
    SET_MEMBERS (state, members) {
      state.members = members;
    },
    SET_NONMEMBERS (state, nonmembers) {
      state.nonmembers = nonmembers;
    },
    SET_AGENDAS (state, agendas) {
      state.agendas = agendas;
    },
    SET_AGENDAS_CAN_VOTE (state, agendasCanVote) {
      state.agendasCanVote = agendasCanVote;
    },
    SET_VOTERS_OF_AGENDA (state, votersOfAgenda) {
      state.votersOfAgenda = votersOfAgenda;
    },
    SET_AGENDA_VOTING_DETAILS (state, votingDetails) {
      state.votingDetails = votingDetails;
    },
    SET_VOTES_AGENDAS (state, agendaVotesByCandidates) {
      state.agendaVotesByCandidates = agendaVotesByCandidates;
    },
    SET_MY_VOTE (state, myVote) {
      state.myVote = myVote;
    },
    SET_ACTIVITY_REWARD (state, activityReward) {
      state.activityReward = activityReward;
    },
    SET_TON_BALANCE (state, tonBalance) {
      state.tonBalance = tonBalance;
    },
    SET_WTON_BALANCE (state, wtonBalance) {
      state.wtonBalance = wtonBalance;
    },
    SET_WINNING_PROBABILITY (state, winningProbability) {
      state.winningProbability = winningProbability;
    },
    SET_CONTRACT_STATE (state, contractState) {
      state.contractState = contractState;
    },
    SET_VOTERS (state, voters) {
      state.voters = voters;
    },
    SET_MY_VOTES (state, myVotes) {
      state.myVotes = myVotes;
    },
    SET_VOTED_CANDIDATES_FROM_ACCOUNT (state, votedCandidatesFromAccount) {
      state.votedCandidatesFromAccount = votedCandidatesFromAccount;
    },

    SET_REQUESTS_BY_CANDIDATE (state, requestsByCandidate) {
      state.requestsByCandidate = requestsByCandidate;
    },
    SET_CANDIDATE_VOTE_RANK (state, candidateVoteRank) {
      state.candidateVoteRank = candidateVoteRank;
    },

    SET_PENDING_TX (state, pendingTx) {
      state.pendingTx = pendingTx;
    },
    LAUNCHED (state) {
      state.launched = true;
    },
  },
  actions: {
    async connectEthereum ({ commit, dispatch }, web3) {
      commit('SET_WEB3', web3);
      if (web3) {
        const [accounts, chainId, blockNumber]
          = await Promise.all([
            web3.eth.getAccounts(),
            web3.eth.getChainId(),
            web3.eth.getBlockNumber(),
          ]);
        if (accounts.length === 0) {
          commit('SET_ACCOUNT', '');
        } else {
          const account = accounts[0];
          commit('SET_ACCOUNT', account);
        }
        commit('SET_CHAIN_ID', chainId);
        commit('SET_BLOCK_NUMBER', blockNumber);

        const block = await web3.eth.getBlock(blockNumber);
        commit('SET_BLOCK_TIME', block.timestamp);

        await dispatch('setBalance');
        await dispatch('setAgendas');
        await dispatch('setVotedCandidatesFromAccount');
        await dispatch('setRequests');
        await dispatch('setContractState');

        await dispatch('setVoteAgendas');
        await dispatch('setAgendasCanVote');
      }
    },
    disconnectEthereum ({ commit }) {
      commit('SET_WEB3', null);
      commit('SET_ACCOUNT', '');
      commit('SET_CHAIN_ID', '');
      commit('SET_PENDING_TX', '');
    },
    async setBalance ({ state, commit }) {
      const ton = getContract('TON', state.web3);
      const wton = getContract('WTON', state.web3);
      const powerTON = getContract('PowerTON', state.web3);

      const [
        tonBalance,
        wtonBalance,
        power,
        totalDeposits,
      ] = await Promise.all([
        ton.methods.balanceOf(state.account).call(),
        wton.methods.balanceOf(state.account).call(),
        powerTON.methods.powerOf(state.account).call(),
        powerTON.methods.totalDeposits().call(),
      ]);

      commit('SET_TON_BALANCE', tonBalance);
      commit('SET_WTON_BALANCE', wtonBalance);

      const winningProbability = numeral(power / totalDeposits).format('0.00%');
      commit('SET_WINNING_PROBABILITY', winningProbability);
    },
    async setMyVotes ({ state, commit }, candidateContractAddress) {
      const candidateContract = getContract('Candidate', state.web3, candidateContractAddress);
      const myVotes = await candidateContract.methods.stakedOf(state.account).call();

      commit('SET_MY_VOTES', myVotes);
    },
    async setRequests ({ state, commit }) {
      const requestsByCandidate = [];

      const depositManager = getContract('DepositManager', state.web3);
      state.candidates.forEach(async candidate => {
        const candidateContract = candidate.kind === 'layer2' ? candidate.candidate : candidate.candidateContract;
        const numPendingRequests = await depositManager.methods.numPendingRequests(candidateContract, state.account).call();
        if (numPendingRequests === 0) {
          return [];
        }

        let requestIndex
            = await depositManager.methods.withdrawalRequestIndex(candidateContract, state.account).call();

        const pendingRequests = [];
        for (let i = 0; i < numPendingRequests; i++) {
          pendingRequests.push(depositManager.methods.withdrawalRequest(candidateContract, state.account, requestIndex).call());
          requestIndex++;
        }
        const requests = await Promise.all(pendingRequests);
        candidate.requests = requests;
        requestsByCandidate.push(candidate);
      });
      commit('SET_REQUESTS_BY_CANDIDATE', requestsByCandidate);
    },
    async setContractState ({ state, commit }) {
      const agendaManager = getContract('DAOAgendaManager', state.web3);
      const committeeProxy = getContract('DAOCommitteeProxy', state.web3);
      const seigManager = getContract('SeigManager', state.web3);
      const [
        createAgendaFee,
        claimableAmount,
        minimumAmount,
      ] = await Promise.all([
        agendaManager.methods.createAgendaFees().call(),
        committeeProxy.methods.getClaimableActivityReward(state.account).call(),
        seigManager.methods.minimumAmount().call(),
      ]);

      const contractState = {
        createAgendaFee,
        claimableAmount,
        minimumAmount,
      };
      commit('SET_CONTRACT_STATE', contractState);
    },
    async launch ({ commit, dispatch }) {
      await dispatch('setMembersAndNonmembers');
      await dispatch('setCandidateVoteRank');

      await dispatch('setAgendas');
      await dispatch('setVotersOfAgenda');
      await dispatch('setVotingDetails');
      commit('LAUNCHED');
    },
    async setMembersAndNonmembers ({ state, commit }) {
      const daoCommitteeProxy = getContract('DAOCommitteeProxy', state.web3);
      const seigManager = getContract('SeigManager', web3);
      const layer2Registry = getContract('Layer2Registry', web3);

      const [
        c,
        maxMember,
      ] = await Promise.all([
        getCandidates(),
        daoCommitteeProxy.methods.maxMember().call(),
      ]);
      commit('SET_MAX_MEMBER', maxMember);

      const memberAddresses = [];
      for (let i = 0; i < maxMember; i++) {
        const memberAddress = await daoCommitteeProxy.methods.members(i).call();
        const member = {
          address: memberAddress.toLowerCase(),
          memberIndex: i,
        };
        memberAddresses.push(member);
      }

      let web3 = state.web3;
      if (!web3) {
        web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/27113ffbad864e8ba47c7d993a738a10'));
      }

      const candidates = await Promise.all(
        c.map(async candidate => {
          const addr = candidate.kind === 'layer2' ? candidate.candidate : candidate.candidateContract;

          const [
            isRegistered, coinage, lastCommitBlockNumber,
          ] = await Promise.all([
            layer2Registry.methods.layer2s(candidate.layer2).call(),
            seigManager.methods.coinages(candidate.layer2).call(),
            seigManager.methods.lastCommitBlock(addr).call(),
          ]);
          if (!isRegistered || !coinage) {
            console.log('bug', 'not registered candidate'); // eslint-disable-line
            return false;
          }

          const coinageContract = getContract('Coinage', web3, coinage);
          const [
            selfVote, totalVote, info, lastCommitBlock,
          ] = await Promise.all([
            coinageContract.methods.balanceOf(candidate.operator).call(),
            coinageContract.methods.totalSupply().call(),
            daoCommitteeProxy.methods.candidateInfos(candidate.candidate).call(),
            web3.eth.getBlock(lastCommitBlockNumber),
          ]);

          candidate.vote = totalVote; // TODO: totalVote
          candidate.selfVote = selfVote;
          candidate.info = info;
          candidate.coinage = coinage;
          candidate.lastCommitBlockNumber = lastCommitBlockNumber;
          candidate.lastCommitAt = lastCommitBlock.timestamp;
          return candidate;
        }),
      );
      const candidatesFiltered = candidates.filter(candidate => candidate);
      commit('SET_CANDIDATES', candidatesFiltered);

      const members = [];
      for (let i = 0; i < maxMember; i++) {
        members.push(false);
      }
      const nonmembers = [];
      let isMember = false;

      candidatesFiltered.forEach(candidate => {
        memberAddresses.forEach(member => {
          if (member.address.includes(candidate.candidate.toLowerCase())) {
            candidate.memberIndex = member.memberIndex;
            members[member.memberIndex] = candidate;
            isMember = true;
            return;
          }
        });

        if (!isMember) {
          nonmembers.push(candidate);
        }
        isMember = false;
      });
      commit('SET_MEMBERS', members);
      commit('SET_NONMEMBERS', nonmembers);
    },
    async setMembersAndNonmembersDeprecated ({ state, commit }) {
      const daoCommitteeProxy = getContract('DAOCommitteeProxy', state.web3);
      const candidates = [];
      const [
        candidatesPre,
        maxMember,
      ] = await Promise.all([
        await getCandidates(),
        await daoCommitteeProxy.methods.maxMember().call(),
      ]);
      const addressMembers = [];
      for (let i = 0; i < maxMember; i++) {
        const memberAddress = await daoCommitteeProxy.methods.members(i).call();
        if (!memberAddress) {
          console.log('bug', 'NO MEMBER ADDRESS'); // eslint-disable-line
        }
        const member = {
          address: memberAddress.toLowerCase(),
          memberIndex: i,
        };

        addressMembers.push(member);
      }
      //const getVotesProm = [];
      //const getSelfVotesProm = []; // NOTE: candidate self votes
      const seigManager = getContract('SeigManager', state.web3);
      const layer2Registry = getContract('Layer2Registry', state.web3);
      let i = 0;
      await candidatesPre.forEach(async function (candidate) {
        // TODO: fix contract.
        // daoCommittee.methods.totalSupplyOnCandidate(candidate.candidate).call()
        //const candidateContract = getContract('Candidate', state.web3, candidate.candidateContract);
        let coinageContract = null;
        if (candidate.layer2 != null) {
          const isLayer2 = await layer2Registry.methods.layer2s(candidate.layer2).call();
          if (isLayer2) {
            const coinage = await seigManager.methods.coinages(candidate.layer2).call();
            coinageContract = getContract('Coinage', state.web3, coinage);
            if (coinageContract) {
              const votes = await coinageContract.methods.totalSupply().call();
              //getVotesProm.push( coinageContract.methods.totalSupply().call() );
              let self = candidate.operator;
              if (self === null || self.length === 0) {
                const candidateContract = getContract('Layer2', state.web3, candidate.layer2);
                self = await candidateContract.methods.operator().call();
                candidate.operator = self;
              }
              const selfVote = await coinageContract.methods.balanceOf(self).call();
              //getSelfVotesProm.push( coinageContract.methods.balanceOf(self).call() );
              candidate.vote = votes;
              candidate.selfVote = selfVote;
              const info = await daoCommitteeProxy.methods.candidateInfos(candidate.candidate).call();
              candidate.info = info;
              //console.log('candidates.push', i, candidate); // eslint-disable-line

              candidates.push(candidate);
            } else {
              //console.log('coinageContract is null ', i, candidate); // eslint-disable-line
            }
          } else {
            //console.log('isLayer2 is null ', i, candidate); // eslint-disable-line
          }
        }
        //console.log('candidate', i, candidate, candidates);  // eslint-disable-line
        i++;
        if (i === candidatesPre.length) {
          commit('SET_CANDIDATES', candidates);
          const members = new Array(maxMember);
          const nonmembers = [];
          let isMember = false;
          candidates.forEach(candidate => {
            addressMembers.forEach(member => {
              if (member.address.includes(candidate.candidate.toLowerCase())) {
                candidate.memberIndex = member.memberIndex;
                members[member.memberIndex] = candidate;
                isMember = true;
                return;
              }
            });
            if (!isMember) {
              nonmembers.push(candidate);
            }
            isMember = false;
          });
          console.log('***candidates -->', candidates, members, nonmembers); // eslint-disable-line
          commit('SET_MAX_MEMBER', maxMember);
          commit('SET_MEMBERS', members);
          commit('SET_NONMEMBERS', nonmembers);
        }
        /*
        getVotesProm.push(candidateContract.methods.totalStaked().call());
        candidateContract.methods.totalStaked().call();
        console.log('launch start setMembersAndNonmembers 5-1 operator:', candidate.operator, 'candidate:', candidate.candidate ) ;
        const self = candidate.kind === 'layer2' ? candidate.operator : candidate.candidate;
        if(self) getSelfVotesProm.push(candidateContract.methods.stakedOf(self).call());
        */
      });
      /*
      const votes = await Promise.all(getVotesProm);
      const selfVotes = await Promise.all(getSelfVotesProm);
      const getInfosProm = [];
      candidates.forEach(candidate => getInfosProm.push(daoCommitteeProxy.methods.candidateInfos(candidate.candidate).call()));
      const infos = await Promise.all(getInfosProm);
      for (let i = 0; i < candidates.length; i++) {
        candidates[i].selfVote = selfVotes[i]; // eslint-disable-line
        candidates[i].vote = votes[i]; // eslint-disable-line
        candidates[i].info = infos[i]; // eslint-disable-line
      }
      commit('SET_CANDIDATES', candidates);
      const members = new Array(maxMember);
      const nonmembers = [];
      let isMember = false;
      candidates.forEach(candidate => {
        addressMembers.forEach(member => {
          if (member.address.includes(candidate.candidate.toLowerCase())) {
            candidate.memberIndex = member.memberIndex;
            members[member.memberIndex] = candidate;
            isMember = true;
            return;
          }
        });
        if (!isMember) {
          nonmembers.push(candidate);
        }
        isMember = false;
      });
      commit('SET_MEMBERS', members);
      commit('SET_NONMEMBERS', nonmembers);
      */
    },
    async setVotersOfAgenda ({ state, commit }) {
      let web3 = state.web3;
      if (!web3) {
        web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/27113ffbad864e8ba47c7d993a738a10'));
      }
      const votersOfAgenda = [];
      const daoAgendaManager = getContract('DAOAgendaManager', web3);

      const agendas = state.agendas;

      agendas.forEach(async function (agenda) {
        if (agenda.voters.length !== 0) {
          for (const voter of agenda.voters) {
            const result = await daoAgendaManager.methods.getVoteStatus(agenda.agendaid, voter).call();
            const data = {
              id: agenda.agendaid,
              voter: voter,
              result: result,
            };
            votersOfAgenda.push(data);
          }
        }
      });
      commit('SET_VOTERS_OF_AGENDA', votersOfAgenda);
    },
    async setAgendas ({ state, commit, dispatch }) {
      let web3 = state.web3;
      if (!web3) {
        web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/27113ffbad864e8ba47c7d993a738a10'));
      }
      const daoCommittee = getContract('DAOCommittee', web3);

      const account = state.account;
      const agendas = await await getAgendas();

      let activityReward ;
      if (account !== '') {
        activityReward = await daoCommittee.methods.getClaimableActivityReward(account).call();
        activityReward = _TON(activityReward, 'wei').toString();
      } else {
        activityReward = '0 TON';
      }
      commit('SET_ACTIVITY_REWARD', activityReward);

      const promAgendaTx = [];
      const promAgendaContents = [];
      for (let i = 0; i < agendas.length; i++) {
        const txHash = agendas[i].transactionHash;
        promAgendaTx.push(web3.eth.getTransaction(txHash));

        promAgendaContents.push(getAgendaContents(agendas[i].agendaid));
      }
      const agendaTxs = await Promise.all(promAgendaTx);
      const agendaContents = await Promise.all(promAgendaContents);
      for (let i = 0; i < agendas.length; i++) {
        if (agendaContents[i] != null) {
          agendas[i].contents = agendaContents[i].contents;
          agendas[i].creator = agendaContents[i].creator;
          agendas[i].type = agendaContents[i].type;
          agendas[i].onChainEffects = parseAgendaBytecode(agendaTxs[i], agendas[i].type);
        }
      }
      commit('SET_AGENDAS', agendas);
      await dispatch('setVoteAgendas');
    },
    async setVotingDetails ({ state, commit }) {
      const votes = await getAgendaVotes();
      const votingDetails = [];

      let web3 = state.web3;
      if (!web3) {
        web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/27113ffbad864e8ba47c7d993a738a10'));
      }

      votes.forEach(async function (vote) {
        const block = await web3.eth.getBlock(vote.blockNumber);
        votingDetails.push({
          agendaid: vote.agendaid,
          timestamp: block.timestamp,
          chainId: vote.chainId,
          comment: vote.comment,
          hasVoted: vote.hasVoted,
          transactionHash: vote.transactionHash,
          vote: vote.vote,
          voter: vote.voter,
        });
      });
      commit('SET_AGENDA_VOTING_DETAILS', votingDetails);
    },
    async setCandidateVoteRank ({ commit }) {
      const candidateVoteRank = await getCandidateVoteRank();
      commit('SET_CANDIDATE_VOTE_RANK', candidateVoteRank);
    },
    async setAgendasCanVote ({ state, commit }) {
      const agendasCanVote = await getAgendasCanVote(state.account);
      commit('SET_AGENDAS_CAN_VOTE', agendasCanVote);
    },
    async setVoters ({ commit }, candidate) {
      if (candidate != null) {
        let address = candidate.candidateContract;
        if (candidate.kind === 'layer2') {
          address = candidate.layer2;
        }

        const voters = await getVotersByCandidate(address.toLowerCase());
        commit('SET_VOTERS', voters);
      }
    },
    async setVotedCandidatesFromAccount ({ state, commit }) {
      const myVotesProm = [];
      state.candidates.forEach(candidate => {
        const candidateContract = getContract('Candidate', state.web3, candidate.candidateContract);
        myVotesProm.push(candidateContract.methods.stakedOf(state.account).call());
      });
      const myVotes = await Promise.all(myVotesProm);

      const votedCandidatesFromAccount = [];
      for (let i = 0; i < state.candidates.length; i++) {
        const candidate = state.candidates[i];
        if (myVotes[i] > 0) {
          votedCandidatesFromAccount.push({
            name: candidate.name,
            myVotes: myVotes[i],
            candidate: candidate.candidate,
            candidateContract: candidate.candidateContract,
          });
        }
      }
      commit('SET_VOTED_CANDIDATES_FROM_ACCOUNT', votedCandidatesFromAccount);
    },
    async setActivityReward ({ state, commit }) {
      const web3 = state.web3;
      const candidates = this.getters.myCandidatesArrays;
      try {
        if (web3 != null) {
          const committeeProxy = await getContract('DAOCommitteeProxy', web3);
          let activityReward;
          if (candidates != null && candidates.length > 0) {
            const agendaVotesByCandidates = state.agendaVotesByCandidates;
            candidates.forEach(async function (account) {
              activityReward = await committeeProxy.methods.getClaimableActivityReward(account.candidate).call();
              activityReward = _TON(activityReward, 'wei').toString(18);
              agendaVotesByCandidates.forEach(candidate => {
                if (candidate.candidate.toLowerCase() === account.candidate.toLowerCase()) {
                  candidate.claimableAmount = activityReward;
                }
              });
            });
            commit('SET_VOTES_AGENDAS', agendaVotesByCandidates);
            //commit('SET_ACTIVITY_REWARD', agendaVotesByCandidates[0].claimableAmount);

            if (candidates[0] != null) {
              activityReward = await committeeProxy.methods.getClaimableActivityReward(candidates[0].candidate).call();
              activityReward = _TON(activityReward, 'wei').toString(18);
              commit('SET_ACTIVITY_REWARD', activityReward);
            }
          }
        }
      } catch (error) {
        console.log('setActivityReward error', error);  // eslint-disable-line
      }
    },
    async setVoteAgendas ({ state, commit, dispatch }) {
      const account = state.account;
      const agendas = state.agendas;
      const myCandidateContracts = [];
      try {
        if (agendas != null && account != null && account.length > 0 && agendas.length > 0) {
          if (state.candidates != null && state.candidates.length > 0) {
            state.candidates.forEach(candidate=>{
              if (candidate.operator.toLowerCase() === account.toLowerCase())
                myCandidateContracts.push({
                  candidateContract: candidate.candidateContract,
                  candidate: candidate.candidate,
                  operator: candidate.operator,
                  layer2: candidate.layer2,
                  name: candidate.name,
                  canVoteAgendas: [],
                  agendaVote: [],
                  countCanVoteAgendas: 0,
                  countAgendaVote: 0,
                  claimableAmount: 0,
                  voteRates: 0,
                });
            });
          }
          myCandidateContracts.forEach(async function (candidateContract) {
            //console.log('setVoteAgendas myCandidateContracts in account', account, 'candidateContract', candidateContract);
            agendas.forEach(agenda => {
              agenda.voters.forEach(voter =>{
                if (voter != null && voter.toLowerCase() === candidateContract.candidate.toLowerCase()) {
                  candidateContract.canVoteAgendas.push(agenda.agendaid);
                  candidateContract.countCanVoteAgendas ++;
                }
              });
            });
            candidateContract.agendaVote = await getAgendaVotesByVoter(candidateContract.candidateContract);
            candidateContract.countAgendaVote = candidateContract.agendaVote.length ;
            if (candidateContract.countAgendaVote > 0 && candidateContract.countCanVoteAgendas > 0)
              candidateContract.voteRates = ((candidateContract.countAgendaVote / candidateContract.countCanVoteAgendas) * 100).toFixed(2);

          });
          commit('SET_VOTES_AGENDAS', myCandidateContracts);
        }
      } catch (error) {
        console.log('setVoteAgendas error', error);  // eslint-disable-line
      }
      await dispatch('setActivityReward');
    },
  },
  getters: {
    getVoteResult: (state) => (agendaId, account) => {
      const voters = state.votersOfAgenda.filter(voter => String(voter.id) === String(agendaId));
      return voters.filter(vote => vote.voter.toLowerCase() === account.toLowerCase());
    },
    getVotersOfAgenda: (state) => (agendaId) => {
      const currentVoter = state.votersOfAgenda.filter(voter => String(voter.id) === String(agendaId));
      return currentVoter;
    },
    agendaVoteResult: (state) => (agendaId) => {
      const agenda = state.agendas.find(agenda => String(agenda.agendaid) === String(agendaId));
      return agenda.voting;
    },
    getAgendaByID: (state) => (agendaId) => {
      const agenda = state.agendas.find(agenda => String(agenda.agendaid) === String(agendaId));
      return agenda ? agenda : {};
    },
    candidate: (state) => (address) => {
      if (address) {
        const index = state.candidates.map(candidate => candidate.candidateContract.toLowerCase()).indexOf(address.toLowerCase());
        return index !== -1 ? state.candidates[index] : null;
      } else return null;
    },
    isCandidate: (_, getters) => {
      return getters.candidateContractFromEOA;
    },
    candidateContractFromEOA: (state) => {
      const account = state.account.toLowerCase();
      if (!account) return '';

      const candidate = state.candidates.find(candidate => candidate.candidate.toLowerCase() === account);
      const operator = state.candidates.find(candidate => candidate.operator.toLowerCase() === account);

      if (candidate) return candidate.candidateContract;
      else if (operator) return operator.candidateContract;
      else return '';
    },
    candidateFromEOA: (state) => {
      const account = state.account.toLowerCase();
      if (!account) return '';

      const candidate = state.candidates.find(candidate => candidate.candidate.toLowerCase() === account);
      const operator = state.candidates.find(candidate => candidate.operator.toLowerCase() === account);

      if (candidate) return candidate.candidate;
      else if (operator) return operator.candidate;
      else return '';
    },
    myCandidateContracts: (state) => {
      const account = state.account.toLowerCase();
      if (!account) return '';
      const myCandidateContracts = [];
      for (let i = 0; i < state.candidates.length; i++) {
        if (state.candidates[i].operator.toLowerCase() === account) {
          myCandidateContracts.push(state.candidates[i].candidateContract);
        }
      }
      if (myCandidateContracts.length === 0) return '';
      else return myCandidateContracts.toString();
    },
    myCandidates: (state) => {
      const account = state.account.toLowerCase();
      if (!account) return '';
      const myCandidateContracts = [];
      for (let i = 0; i < state.candidates.length; i++) {
        if (state.candidates[i].operator.toLowerCase() === account) {
          myCandidateContracts.push(state.candidates[i].candidate);
        }
      }
      if (myCandidateContracts.length === 0) return '';
      else return myCandidateContracts.toString();
    },
    myCandidatesArrays: (state) => {
      const account = state.account.toLowerCase();
      if (!account) return [];
      const myCandidateContracts = [];
      for (let i = 0; i < state.candidates.length; i++) {
        if (state.candidates[i].operator.toLowerCase() === account) {
          myCandidateContracts.push(state.candidates[i]);
        }
      }

      if (myCandidateContracts.length === 0) return [];
      else return myCandidateContracts;
    },
    member: (state, getters) => (candidateContract) => {
      return state.members.find(member => {
        if (!member || !member.candidateContract) return false;
        return member.candidateContract.toLowerCase() === getters.candidate(candidateContract).candidateContract.toLowerCase();
      });
    },
    isMember: (_, getters) => {
      const candidateContract = getters.candidateContractFromEOA;
      if (!candidateContract) return false;

      const member = getters.member(candidateContract);
      return member;
    },
    isMembersInMyCandidatesArrays: (_, getters) => {
      const candidateContracts = getters.myCandidatesArrays;
      if (!candidateContracts) return null;
      let members = null;
      candidateContracts.forEach(candidate=>{
        if (members === null) members = [];
        if (getters.member(candidate.candidateContract)) members.push(getters.member(candidate.candidateContract)) ;
      });
      return members;
    },
    requests: (state) => (address) => {
      const index = state.requestsByCandidate.map(candidate => candidate.candidateContract.toLowerCase()).indexOf(address.toLowerCase());
      return index > -1 ? state.requestsByCandidate[index].requests : [];
    },
    totalVotesForCandidate: (_, getters) => (address) => {
      const candidate = getters.candidate(address);
      return (!candidate || !candidate.vote) ? 0 : candidate.vote;
    },
    notWithdrawableRequests: (state, getters) => (candidate) => {
      const requests = getters.requests(candidate);
      if (!requests || requests.length === 0) {
        return [];
      }
      return requests.filter(request => parseInt(request.withdrawableBlockNumber) > state.blockNumber);
    },
    withdrawableRequests: (state, getters) => (candidate) => {
      const requests = getters.requests(candidate);
      if (!requests || requests.length === 0) {
        return [];
      }
      return requests.filter(request => parseInt(request.withdrawableBlockNumber) <= state.blockNumber);
    },
    numCanRevote: (_, getters) => (address, revoteIndex) => {
      const requests = getters.requests(address);
      if (!requests) {
        return 0;
      }
      return requests.length - revoteIndex;
    },
    canRevote: (_, getters) => (address, revoteIndex) => {
      const requests = getters.requests(address);
      if (!requests) {
        return 0;
      }

      const voteRequests = requests.slice(0, requests.length - revoteIndex);
      const amount = voteRequests.reduce((prev, cur) => prev + parseInt(cur.amount), 0);
      return amount;
    },
    numCanWithdraw: (_, getters) => (address, withdrawIndex) => {
      const requests = getters.withdrawableRequests(address);
      if (!requests) {
        return 0;
      }
      return requests.length - withdrawIndex;
    },
    canWithdraw: (_, getters) => (address, withdrawIndex) => {
      const requests = getters.withdrawableRequests(address);
      if (!requests) {
        return 0;
      }

      const withdrawableRequests = requests.slice(0, requests.length - withdrawIndex);
      const amount = withdrawableRequests.reduce((prev, cur) => prev + parseInt(cur.amount), 0);
      return amount;
    },
    createAgendaFee: (state) => {
      if (!state.contractState) return 0;
      return state.contractState.createAgendaFee ? state.contractState.createAgendaFee : 0;
    },
    claimableAmount: (state) => {
      if (!state.contractState || !state.contractState.claimableAmount) return 0;
      return state.contractState.claimableAmount;
    },
    minimumAmount: (state) => {
      if (!state.contractState) return 0;
      return state.contractState.minimumAmount;
    },
    canUpdateReward: (_, getters) => (address) => {
      const candidate = getters.candidate(address);
      if (!candidate || !getters.minimumAmount) return false;

      const minimumAmount = toBN(getters.minimumAmount);
      const selfVote = toBN(candidate.selfVote);
      return selfVote.gte(minimumAmount);
    },
    agendaOnChainEffects: (_, getters) => (agendaId) => {
      const agenda = getters.getAgendaByID(agendaId);
      if (!agenda) {
        return [];
      }

      return agenda.onChainEffects ? agenda.onChainEffects : [];
    },
    agendaTitle: (_, getters) => (agendaId) => {
      const onChainEffects = getters.agendaOnChainEffects(agendaId);
      if (onChainEffects.length === 3) {
        if (onChainEffects[0].name === 'setPowerTONSeigRate' &&
            onChainEffects[1].name === 'setDaoSeigRate' &&
            onChainEffects[2].name === 'setPseigRate'
        ) {
          return 'SeigManager- All the seigniorage rates will be changed';
        }
      }
      if (!onChainEffects || onChainEffects.length === 0) {
        return '';
      }
      const abi = getContractABIFromAddress(onChainEffects[0].target, getters.agendaType(agendaId));
      if (!abi || abi.length === 0) {
        console.log('bug', 'no abi'); // eslint-disable-line
        return '';
      }

      const abiFound = abi.find(a => a.name === onChainEffects[0].name);
      return abiFound.title;
    },
    agendaExplanation: (_, getters) => (agendaId, type) => {
      const onChainEffects = getters.agendaOnChainEffects(agendaId);
      if (onChainEffects.length === 3) {
        if (onChainEffects[0].name === 'setPowerTONSeigRate' &&
            onChainEffects[1].name === 'setDaoSeigRate' &&
            onChainEffects[2].name === 'setPseigRate'
        ) {
          return `Currently, TON seigniorage is issued each time a Ethereum block is created.

          Additionally issued TON will be distributed among PowerTON, DAO and staking users, excluding TON allocated for fixed seignorage rewards (19%).
          This function allows you to determine the ratio of the newly issued TON accumulated for PowerTON, DAO and staking users.`;
        }
      }
      if (!onChainEffects || onChainEffects.length === 0) {
        console.log('bug', 'no on-chain effects'); // eslint-disable-line
        return '';
      }
      const abi = getContractABIFromAddress(onChainEffects[0].target, type);
      if (!abi || abi.length === 0) {
        return '';
      }

      const abiFound = abi.find(a => a.name === onChainEffects[0].name);
      return abiFound.explanation;
    },
    agendaInputs: (_, getters) => (agendaId, type) => {
      const onChainEffects = getters.agendaOnChainEffects(agendaId);
      if (!onChainEffects || onChainEffects.length === 0) {
        console.log('bug', 'no on-chain effects'); // eslint-disable-line
        return '';
      }
      const abi = getContractABIFromAddress(onChainEffects[0].target, type);
      if (!abi || abi.length === 0) {
        console.log('bug', 'no abi'); // eslint-disable-line
        return '';
      }

      const abiFound = abi.find(a => a.name === onChainEffects[0].name);
      return abiFound.inputs;
    },
    agendaCreator: (_, getters) => (agendaId) => {
      const agenda = getters.getAgendaByID(agendaId);
      if (!agenda) {
        return '';
      }

      return agenda.creator ? agenda.creator : '';
    },
    agendaContents: (_, getters) => (agendaId) => {
      const agenda = getters.getAgendaByID(agendaId);
      if (!agenda) {
        return '';
      }

      return agenda.contents ? agenda.contents : '';
    },
    agendaType: (_, getters) => (agendaId) => {
      const agenda = getters.getAgendaByID(agendaId);
      if (!agenda) {
        return '';
      }

      return agenda.type ? agenda.type : 'A'; // TODO: 'A' -> ''
    },
    comments: (state) => (agendaId) => {
      if (!state.votingDetails) return [];
      return state.votingDetails.filter(v => v.agendaid === Number(agendaId));
    },
    sortedCandidates: (state, getters) => {
      const candidates = [];
      state.members.forEach(member => {
        if (member.candidateContract) candidates.push(member);
      });

      const nonmembers = getters.sortedNonmembersByVotes;
      return candidates.concat(nonmembers);
    },
    sortedCandidateVoteRank: (state) => {
      if (!state.candidates || state.candidates.length === 0) return [];

      return state.candidates.sort(function (a, b) {
        a = a.vote.toString(16);
        a = toBN(a);

        b = b.vote.toString(16);
        b = toBN(b);

        if (a.cmp(b) === 1) return -1;
        else if (a.cmp(b) === 0) return 0;
        else return 1;
      });
    },
    sortedNonmembersByVotes: (state) => {
      if (!state.nonmembers || state.nonmembers.length === 0) return [];

      return state.nonmembers.sort(function (a, b) {
        a = a.vote.toString(16);
        a = toBN(a);

        b = b.vote.toString(16);
        b = toBN(b);

        if (a.cmp(b) === 1) return -1;
        else if (a.cmp(b) === 0) return 0;
        else return 1;
      });
    },
    sortedVotedCandidatesFromAccountByVotes: (state) => {
      if (!state.votedCandidatesFromAccount || state.votedCandidatesFromAccount.length === 0) return [];

      return state.votedCandidatesFromAccount.sort(function (a, b) {
        a = a.myVotes.toString(16);
        a = toBN(a);

        b = b.myVotes.toString(16);
        b = toBN(b);

        if (a.cmp(b) === 1) return -1;
        else if (a.cmp(b) === 0) return 0;
        else return 1;
      });
    },
    votersWithBalance: (state) => {
      if (!state.voters) return [];
      return state.voters.filter(v => v.balance > 0);
    },
    sumOfVotes: (state) => {
      const initialAmount = 0;
      const reducer = (amount, voter) => amount + voter.balance;
      return state.voters.reduce(reducer, initialAmount);
    },
    agendaIdsCanVote: (state) => {
      if (!state.agendasCanVote) {
        return [];
      }
      return state.agendasCanVote.map(agenda => agenda.agendaid);
    },
    membersArray: (state) => {
      const maxMember = parseInt(state.maxMember);
      return Array.from(Array(maxMember).keys());
    },
    voteResult: (state, getters) => {
      if (!getters.candidateFromEOA) {
        return [];
      }
      return state.votersOfAgenda.filter(result => result.voter.toLowerCase() === getters.candidateFromEOA.toLowerCase());
    },
    haveAlreadyVotedForAgenda: (state, getters) => (agendaId) => {
      if (!state.votingDetails) {
        return true;
      }
      const found = state.votingDetails.find(votingDetail =>
        votingDetail.agendaid === agendaId && votingDetail.voter.toLowerCase() === getters.candidateContractFromEOA.toLowerCase(),
      );
      return found ? true : false;
    },
    canVoteForAgenda: (state, getters) => (agendaId) => {
      if (!agendaId || agendaId < 0) {
        return false;
      }

      const agenda = getters.getAgendaByID(agendaId);
      if (agendaStatus(agenda.status) === 'NOTICE' && state.blockTime >= agenda.tNoticeEndTime) {
        return getters.isMember;
      } else {
        if (getters.haveAlreadyVotedForAgenda(agendaId)) {
          return false;
        }

        const found = agenda.voters.find(voter =>
          voter.toLowerCase() === getters.candidateFromEOA.toLowerCase(),
        );
        return found ? true : false;
      }
    },
  },
});
