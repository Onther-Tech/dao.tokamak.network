<template>
  <div v-if="!canUseThisApp" class="alert">
    <div class="alert-message" v-html="alert" /> <!-- eslint-disable-line -->
  </div>
</template>

<script>
export default {
  data () {
    return {
      alert: '',
      chainId: '0x4', // production: '0x1', develop: '0x4'
    };
  },
  computed: {
    canUseThisApp () {
      return this.alert === '';
    },
  },
  async created () {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', async () => {
        await this.showAlert();
      });
    }
    await this.showAlert();
  },
  methods: {
    async showAlert () {
      if (typeof window.ethereum !== 'undefined') {
        // https://docs.metamask.io/guide/ethereum-provider.html#ethereum-chainid-deprecated
        const chainId = await ethereum.request({ method: 'eth_chainId' });

        if (chainId !== this.chainId) {
          this.alert = 'The current network is not rinkeby network. Please change it to the rinkeby network.';
        } else {
          this.alert = '';
        }
      } else {
        const aTag = function (href, link) {
          return `<a target="_blank" rel="noopener noreferrer" href="${href}">${link}</a>`;
        };

        this.alert = `Metamask wallet is not installed. Please install it ${aTag('https://metamask.io/', 'here')}.`;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.alert {
  display: flex;
  justify-content: center;

  border-bottom: solid 4px #2a72e5;

  .alert-message {
    font-family: Roboto;
    font-size: 14px;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    line-height: 1.43;
    letter-spacing: 0.42px;
    color: #304156;

    margin-top: 15px;
    margin-bottom: 15px;
  }
}
</style>
