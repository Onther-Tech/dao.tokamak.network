<template>
  <div class="header" :class="{ 'header-sub': isSub }">
    <modal v-if="showModal"
           :width="'490px'"
           @on-closed="showModal=false"
    >
      <template #body>
        <modal-claim @on-closed="showModal=false" />
      </template>
    </modal>
    <div v-if="$mq === 'desktop'" class="logo" @click="$route.path !== '/' ? $router.push({ path: '/' }) : ''">
      <div v-if="isSub" class="logo-container">
        <img v-if="isSub" src="@/assets/logo-sub.png" alt="">
        <div class="beta beta-sub">rinkeby</div>
      </div>
      <div v-else class="logo-container">
        <img src="@/assets/logo.png" alt="">
        <div class="beta">rinkeby</div>
      </div>
    </div>
    <div v-else class="logo-tablet" @click="$route.path !== '/' ? $router.push({ path: '/' }) : ''">
      <div v-if="isSub" class="logo-container">
        <img src="@/assets/mobile-logo-sub.png" alt=""
             width="105" height="30"
        >
        <div class="beta beta-sub">rinkeby</div>
      </div>
      <div v-else class="logo-container">
        <img src="@/assets/mobile-logo.png" alt=""
             width="105" height="30"
        >
        <div class="beta">rinkeby</div>
      </div>
    </div>
    <div style="display: flex; flex: 1; justify-content: flex-end;">
      <div class="menu">
        <router-link :to="'/election'"
                     class="menu-item" :class="{ 'menu-item-sub': isSub, selected: $route.path.includes('election') }"
        >
          Election
        </router-link>
        <router-link :to="'/propose'"
                     class="menu-item" :class="{ 'menu-item-sub': isSub, selected: $route.path.includes('propose') }"
        >
          Propose
        </router-link>
        <router-link :to="'/agenda'"
                     class="menu-item" :class="{ 'menu-item-sub': isSub, selected: $route.path.includes('agenda') }"
        >
          Committee
        </router-link>
        <connect-wallet :is-sub="isSub" />
      </div>
      <div v-if="account!=='' && isCandidate" class="container">
        <div>
          <button
            :class="{ 'claim': isSub }"
            @click="showModal=true"
          >
            Claim
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Connect from '@/components/Connect.vue';
import Modal from '@/components/Modal.vue';
import ModalClaim from '@/containers/ModalClaim.vue';
import { mapGetters, mapState } from 'vuex';

export default {
  components: {
    'connect-wallet': Connect,
    'modal': Modal,
    'modal-claim': ModalClaim,
  },
  data () {
    return {
      showModal: false,
    };
  },
  computed: {
    ...mapState([
      'account',
    ]),
    ...mapGetters([
      'isCandidate',
    ]),
    isSub () {
      return this.$route.path !== '/';
    },
  },
  methods: {
    route (path) {
      if (this.$route.path === path) {
        return;
      }
      this.$router.push({ path });
    },
  },
};
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;

  height: 84px;
  background: #0062c2;

  padding-left: 30px;
  padding-right: 30px;
}

.header-sub {
  background: #fafbfc;
}

.logo-container {
  display: flex;
  align-items: center;

  .beta {
    margin-top: 4px;

    font-family: Georgia;
    font-size: 14px;
    font-weight: normal;
    font-stretch: normal;
    font-style: italic;
    line-height: 1.14;
    letter-spacing: normal;
    text-align: left;
    color: #ffffff;

    margin-left: 4px;

    &-sub {
      color: #2a72e5;
    }
  }
}

.logo {
  display: flex;
  align-items: center;

  z-index: 1;

  &:hover {
    cursor: pointer;
  }
}

.logo-tablet {
  display: flex;
  align-items: center;

  z-index: 1;

  &:hover {
    cursor: pointer;
  }
}

button {
  width: 76px;
  height: 35px;
  padding: 8px 20px;
  border-radius: 19px;
  border: solid 1px #6c9ed0;
  background: #0062c2;
  outline: none;
  font-family: Roboto;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  letter-spacing: normal;
  text-align: center;
  color: #a6c8e9
}
button:hover {
  cursor: pointer;
}

.claim {
  background: #2a72e5;
  color: #ffffff;
}

.logo img {
  width: 306px;
  height: 30px;
}

.menu {
  width: 100%;
  max-width: 500px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  z-index: 1;
}

.menu-item {
  /* font styles */
  font-family: Roboto;
  font-size: 16px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  letter-spacing: normal;
  text-align: center;
  color: #ffffff;

  text-decoration: none;
}

.menu-item-sub {
  color: #3e495c;
}

.menu-item-sub:hover {
  font-family: Roboto;
  font-size: 16px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  letter-spacing: normal;
  text-align: center;
  color: #2a72e5;
}

.selected {
  color: #2a72e5;
}

.container {
  height: 84px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 15px;

  z-index: 1;
}
</style>
