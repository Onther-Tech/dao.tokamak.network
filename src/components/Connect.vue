<template>
  <div class="connect">
    <button
      v-if="!connectedAccount"
      :class="{ sub: isSub }"
      @click="connect"
    >
      Connect Wallet
    </button>
    <div v-else style="position: relative;">
      <div class="account"
           :style="[pendingTx ? { 'visibility': 'hidden' } : {}]"
      >
        <div ref="icon" class="icon" />
        <div class="address">
          {{ shortAddress }}
        </div>
      </div>
      <div class="pending"
           :style="[!pendingTx ? { 'visibility': 'hidden' } : {}]"
           @click="etherscan()"
      >
        <div class="loader" />
        <div class="label">Tx PENDING</div>
      </div>
    </div>
  </div>
</template>

<script>
import Web3 from 'web3';
import { mapState } from 'vuex';
import jazzicon from '@metamask/jazzicon';

export default {
  props: {
    isSub: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      connectedAccount: '',
      newBlockHeaderSubscription: null,
    };
  },
  computed: {
    ...mapState([
      'account',
      'launched',
      'web3',
      'pendingTx',

      'etherscanAddress',
    ]),
    shortAddress () {
      return `${this.connectedAccount.slice(0, 7)}...${this.connectedAccount.slice(-4)}`;
    },
    iconNumber () {
      return parseInt(this.connectedAccount.slice(2, 10), 16);
    },
  },
  created () {
    if (this.account) {
      this.connectedAccount = this.account;
      this.$nextTick(() => {
        this.setIcon();
      });
    }
  },
  methods: {
    async connect () {
      if (typeof window.ethereum !== 'undefined') {
        const web3 = new Web3(ethereum);
        try {
          await ethereum.request({ method: 'eth_requestAccounts' });

          const chainId = await web3.eth.getChainId();
          if (chainId !== 4) {
            return alert('The current network is not rinkeby network. Please change it to the rinkeby network.');
          }

          const accounts = await web3.eth.getAccounts();
          this.connectedAccount = accounts[0];

          this.$nextTick(() => {
            this.setIcon();
          });

          for (;;) {
            await new Promise(r => setTimeout(r, 500));
            if (this.launched) break;
          }
          await this.$store.dispatch('connectEthereum', web3);

          if (this.$route.params.address) {
            const candidateContractAddress = this.$route.params.address;
            await this.$store.dispatch('setMyVotes', candidateContractAddress);
          }

          this.newBlockHeaderSubscription = web3.eth.subscribe('newBlockHeaders', (error, result) => {
            if (error) {
              console.log('bug', 'failed to get new block'); // eslint-disable-line
            }
            this.$store.commit('SET_BLOCK_TIME', result.timestamp);
          });

        } catch (e) {
          // User deny to connect MetaMask wallet.
        }

        const handleAccountsChanged = async (accounts) => {
          if (accounts.length === 0) {
            this.$store.dispatch('disconnectEthereum');
          } else {
            this.$store.commit('SET_PENDING_TX', '');

            const accounts = await web3.eth.getAccounts();
            this.connectedAccount = accounts[0];

            this.$nextTick(() => {
              this.setIcon();
            });

            for (;;) {
              await new Promise(r => setTimeout(r, 500));
              if (this.launched) break;
            }
            await this.$store.dispatch('connectEthereum', web3);
            if (this.$route.params.address) {
              const candidateContractAddress = this.$route.params.address;
              await this.$store.dispatch('setMyVotes', candidateContractAddress);
            }
          }
        };
        const handleChainChanged = () => {
          this.$store.dispatch('disconnectEthereum');

          const iconEle = this.$refs.icon;
          if (iconEle) {
            if (iconEle.childElementCount === 1) {
              this.connectedAccount = '';
              iconEle.removeChild(iconEle.lastElementChild);
            }
          }
        };
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged); // https://docs.metamask.io/guide/ethereum-provider.html#legacy-events
      } else {
        return alert('Please install metamsk wallet.');
      }
    },
    setIcon () {
      const icon = jazzicon(25, this.iconNumber);
      const iconEle = this.$refs.icon;
      if (iconEle) {
        if (iconEle.childElementCount === 1) {
          iconEle.removeChild(iconEle.lastElementChild);
        }
        iconEle.append(icon);
      }
    },
    etherscan () {
      window.open(this.etherscanAddress + '/tx/' + this.pendingTx, '_blank'); // eslint-disable-line
    },
  },
};
</script>

<style lang="scss" scoped>
button {
  /* font styles */
  font-family: Roboto;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  letter-spacing: normal;
  text-align: center;
  color: #a6c8e9;

  height: 35px;
  padding: 7px 16px 9px;
  border-radius: 19px;
  border: solid 1px #6c9ed0;
  background: #0062c2;

  cursor: pointer;
  white-space: nowrap;
}

.sub {
  color: #86929d;

  border-radius: 19px;
  border: solid 1px #d7d9df;
  background: #ffffff;
}

.account {
  width: 165px;
  height: 35px;

  display: flex;
  align-items: center;

  padding: 5px 21px 5px 13px;
  border-radius: 19px;
  border: solid 1px #d7d9df;
  background-color: #ffffff;

  position: relative;
}

.address {
  /* text styles */
  font-family: Roboto;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  letter-spacing: normal;
  text-align: left;
  color: #3e495c;
}

.icon {
  margin-right: 8px;
  margin-bottom: -5px;
}

.pending {
  width: 165px;
  height: 35px;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 19px;
  border: solid 1px #2a72e5;
  background-color: #ffffff;

  position: absolute;
  right: 0;
  top: 0;

  &:hover {
    cursor: pointer;
  }
}

.loader {
  width: 20px;
  height: 20px;

  border: 2px solid #d9e6fb;
  border-top: 2px solid #2a72e5;
  border-radius: 50%;

  animation: spin 2s linear infinite;

  margin-right: 16px;
  margin-left: -12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.label {
  font-family: Roboto;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.36;
  letter-spacing: normal;
  text-align: left;
  color: #2a72e5;
}
</style>
