import { getCandidates, getAgendas, getAgendaVoteCasted, getVotersByCandidate, getCandidateRankByVotes } from '@/api';
import { getContracts } from '@/utils/contracts';
import { createCurrency } from '@makerdao/currency';
import { WTON } from '@/utils/helpers';

import Vue from 'vue';
import Vuex from 'vuex';

const _TON = createCurrency('TON');

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    web3: null,
    account: '',
    chainId: '',
    blockNumber: 0,

    tonBalance: 0,

    candidates: [],
    members: [],
    nonmembers: [],

    agendas: [],
    voteCasted: [],
    voteRate: 0,
    myVote: [],
    activityReward: [],
    myVotesByCandidate: [],
    votersByCandidate: [],
    requestsByCandidate: [],
    candidateRankByVotes: [],

    pendingTx: '',
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

    SET_CANDIDATES (state, candidates) {
      state.candidates = candidates;
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
    SET_AGENDA_VOTE_CASTED (state, voteCasted) {
      state.voteCasted = voteCasted;
    },
    SET_VOTE_RATE (state, voteRate) {
      state.voteRate = voteRate;
    },
    SET_MY_VOTE (state, myVote) {
      state.myVote = myVote;
    },
    SET_ACTIVITY_REWARD (state, activityReward) {
      state.activityReward = activityReward;
    },
    SET_VOTERS_BY_CANDIDATE (state, voters) {
      state.votersByCandidate = voters;
    },
    SET_TON_BALANCE (state, tonBalance) {
      state.tonBalance = tonBalance;
    },

    SET_MY_VOTES_BY_CANDIDATE (state, myVotesByCandidate) {
      state.myVotesByCandidate = myVotesByCandidate;
    },
    SET_REQUESTS_BY_CANDIDATE (state, requestsByCandidate) {
      state.requestsByCandidate = requestsByCandidate;
    },
    SET_CANDIDATE_RANK_BY_VOTES (state, candidateRankByVotes) {
      state.candidateRankByVotes = candidateRankByVotes;
    },

    SET_PENDING_TX (state, pendingTx) {
      state.pendingTx = pendingTx;
    },
  },
  actions: {
    async connectEthereum ({ commit, dispatch }, web3) {
      commit('SET_WEB3', web3);

      const accounts = await web3.eth.getAccounts();
      if (accounts.length === 0) {
        commit('SET_ACCOUNT', '');
      } else {
        const account = accounts[0];
        commit('SET_ACCOUNT', account);
      }

      const chainId = await web3.eth.getChainId();
      commit('SET_CHAIN_ID', chainId);

      const blockNumber = await web3.eth.getBlockNumber();
      commit('SET_BLOCK_NUMBER', blockNumber);

      // TODO: await?
      await dispatch('setBalance');
      await dispatch('setRequests');
      // await dispatch('setMyVotes');
    },
    disconnectEthereum ({ commit }) {
      commit('SET_WEB3', null);
      commit('SET_ACCOUNT', '');
      commit('SET_CHAIN_ID', '');
    },
    async setBalance ({ state, commit }) {
      const ton = getContracts('TON', state.web3);
      const daoCommittee = getContracts('DAOCommittee', state.web3);

      const tonBalance = await ton.methods.balanceOf(state.account).call();
      commit('SET_TON_BALANCE', tonBalance);

      const myVotesByCandidate = [];
      state.candidates.forEach(async candidate => {
        const myVotes = await daoCommittee.methods.totalSupplyOnCandidate(candidate.operator).call();
        candidate.myVotes = myVotes;
        myVotesByCandidate.push(candidate);
      });
      commit('SET_MY_VOTES_BY_CANDIDATE', myVotesByCandidate);
    },
    async setRequests ({ state, commit }) {
      const requestsByCandidate = [];

      const depositManager = getContracts('DepositManager', state.web3);
      state.candidates.forEach(async candidate => {
        const numPendingRequests = await depositManager.methods.numPendingRequests(candidate.layer2, state.account).call();
        if (numPendingRequests === 0) {
          return [];
        }

        let requestIndex
            = await depositManager.methods.withdrawalRequestIndex(candidate.layer2, state.account).call();

        const pendingRequests = [];
        for (let i = 0; i < numPendingRequests; i++) {
          pendingRequests.push(depositManager.methods.withdrawalRequest(candidate.layer2, state.account, requestIndex).call());
          requestIndex++;
        }
        const requests = await Promise.all(pendingRequests);
        candidate.requests = requests;
        requestsByCandidate.push(candidate);
      });
      commit('SET_REQUESTS_BY_CANDIDATE', requestsByCandidate);
    },
    async launch ({ dispatch }) {
      await dispatch('setMembersAndNonmembers');
      await dispatch('setVotersByCandidate');
      await dispatch('setCandidateRankByVotes');
      await dispatch('setAgendas');
    },
    async setMembersAndNonmembers ({ state, commit }) {
      const daoCommittee = getContracts('DAOCommittee', state.web3);
      const daoCommitteeProxy = getContracts('DAOCommitteeProxy', state.web3);

      const [
        candidates,
        maxMember,
      ] = await Promise.all([
        await getCandidates(),
        await daoCommitteeProxy.methods.maxMember().call(),
      ]);
      const getMembers = [];
      for (let i = 0; i < maxMember; i++) {
        getMembers.push(daoCommitteeProxy.methods.members(i).call());
      }
      const addressMembers = (await Promise.all(getMembers)).map(member => member.toLowerCase());

      const getVotes = [];
      candidates.forEach(candidate => getVotes.push(daoCommittee.methods.totalSupplyOnCandidate(candidate.operator).call()));
      const votes = await Promise.all(getVotes);

      const getInfos = [];
      candidates.forEach(candidate => getInfos.push(daoCommittee.methods.candidateInfos(candidate.operator).call()));
      const infos = await Promise.all(getInfos);

      for (let i = 0; i < candidates.length; i++) {
        candidates[i].vote = votes[i]; // eslint-disable-line
        candidates[i].info = infos[i]; // eslint-disable-line
      }
      commit('SET_CANDIDATES', candidates);

      const members = [];
      const nonmembers = [];
      candidates.forEach(
        candidate => (addressMembers.includes(candidate.operator.toLowerCase()) ? members : nonmembers).push(candidate),
      );
      commit('SET_MEMBERS', members);
      commit('SET_NONMEMBERS', nonmembers);
    },
    async setAgendas (context) {
      const daoCommittee = getContracts('DAOCommittee', this.web3);
      const account = context.state.account;
      const [
        agendas,
        events,
      ] = await Promise.all([
        await getAgendas(),
        await getAgendaVoteCasted(),
      ]);

      let activityReward;
      if (account !== '') {
        [ activityReward ] = await Promise.all([await daoCommittee.methods.getClaimableActivityReward(account).call()]);
        activityReward = _TON(activityReward, 'wei').toString();
      } else {
        activityReward = '0 TON';
      }

      context.commit('SET_ACTIVITY_REWARD', activityReward);

      const voteCasted = [];
      events.forEach(event => (event.eventName === 'AgendaVoteCasted' ? voteCasted.push(event) : 0)); // check
      context.commit('SET_AGENDA_VOTE_CASTED', voteCasted);

      const myVote = [];
      voteCasted.forEach(vote => (vote.from === account.toLowerCase() ? myVote.push(vote.data) : '')); // check
      const voteRate = (myVote.length / agendas.length) * 100;

      context.commit('SET_MY_VOTE', myVote);
      context.commit('SET_VOTE_RATE', voteRate);

      context.commit('SET_AGENDAS', agendas);
    },
    async setVotersByCandidate ({ state, commit }) {
      const votersByCandidate = [];

      state.candidates.forEach(async candidate => {
        candidate.voters = await getVotersByCandidate(candidate.layer2);
        votersByCandidate.push(candidate);
      });

      commit('SET_VOTERS_BY_CANDIDATE', votersByCandidate);
    },
    async setCandidateRankByVotes ({ commit }) {
      const candidateRankByVotes = await getCandidateRankByVotes();
      commit('SET_CANDIDATE_RANK_BY_VOTES', candidateRankByVotes);
    },
  },
  getters: {
    getAgendaByID: (state) => (agendaId) => {
      const index = state.agendas.map(agenda => agenda.agendaid).indexOf(Number(agendaId));
      return index > -1 ? state.agendas[index] : '';
    },
    getVotedListByID: (state) => (agendaId) => {
      const voted = [];
      state.voteCasted.forEach(async casted => casted.data.id === agendaId ? voted.push(casted.data) : '');
      return voted;
    },
    candidate: (state) => (address) => {
      const index = state.candidates.map(candidate => candidate.layer2.toLowerCase()).indexOf(address.toLowerCase());
      return index !== -1 ? state.candidates[index] : null;
    },
    requests: (state) => (address) => {
      const index = state.requestsByCandidate.map(candidate => candidate.layer2.toLowerCase()).indexOf(address.toLowerCase());
      return index > -1 ? state.requestsByCandidate[index].requests : [];
    },
    voters: (state) => (address) => {
      const index = state.votersByCandidate.map(candidate => candidate.layer2.toLowerCase()).indexOf(address.toLowerCase());
      return index > -1 ? state.votersByCandidate[index].voters : [];
    },
    selectedVoters: (_, getters) => (address, page) => {
      const first = page * 4;
      return getters.voters(address) ? getters.voters(address).slice(first, first+4) : [];
    },
    myVotes: (state) => (address) => {
      const index = state.myVotesByCandidate.map(candidate => candidate.layer2.toLowerCase()).indexOf(address.toLowerCase());
      return index > -1 ? state.myVotesByCandidate[index].myVotes : 0;
    },
    totalVotesByCandidate: (state) => (address) => {
      const index = state.votersByCandidate.map(candidate => candidate.layer2.toLowerCase()).indexOf(address.toLowerCase());
      const candidate = state.votersByCandidate[index];

      if (!candidate) return 0;
      const voters = candidate.voters;

      const initialAmount = 0;
      const reducer = (amount, voter) => amount + voter.balance;
      return voters.reduce(reducer, initialAmount);
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
        return WTON(0);
      }

      const voteRequests = requests.slice(0, requests.length - revoteIndex);
      const amount = voteRequests.reduce((prev, cur) => prev + parseInt(cur.amount), 0);
      return WTON(amount);
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
        return WTON(0);
      }

      const withdrawableRequests = requests.slice(0, requests.length - withdrawIndex);
      const amount = withdrawableRequests.reduce((prev, cur) => prev + parseInt(cur.amount), 0);
      return WTON(amount);
    },
  },
});
