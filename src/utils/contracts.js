const Web3 = require('web3');
const web3EthABI = require('web3-eth-abi');

function marshalString (str) {
  if (str.slice(0, 2) === '0x') return str;
  return '0x'.concat(str);
}

function unmarshalString (str) {
  if (str.slice(0, 2) === '0x') return str.slice(2);
  return str;
}
const autoRefactorCoinage = require('../contracts/AutoRefactorCoinage.json');
const agendaManager = require('../contracts/DAOAgendaManager.json');
const candidate = require('../contracts/Candidate.json');
const committeeProxy = require('../contracts/DAOCommitteeProxy.json');
const committee = require('../contracts/DAOCommittee.json');
const depositManager = require('../contracts/DepositManager.json');
const ton = require('../contracts/TON.json');
const wton = require('../contracts/WTON.json');
const powerTON = require('../contracts/PowerTON.json');
const seigManager = require('../contracts/SeigManager.json');
const daoVault = require('../contracts/DAOVault.json');
const layer2Registry = require('../contracts/Layer2Registry.json');
const layer2 = require('../contracts/Layer2.json');


const deployed = {
  'TON': '0x44d4F5d89E9296337b8c48a332B3b2fb2C190CD0',
  'WTON': '0x709bef48982Bbfd6F2D4Be24660832665F53406C',
  'Layer2Registry': '0xA609Cb2b9b0A4845077D2C965B7C6DFE5F59c847',
  'DepositManager': '0x57F5CD759A5652A697D539F1D9333ba38C615FC2',
  'CoinageFactory': '0xe2114e53a36fB4348c4AACd86D724f418c600206',
  'OldDAOVaultMock': '0x2677604E46CBdA88009e1F1D0ccb21ad5a23097e',
  'SeigManager': '0x957DaC3D3C4B82088A4939BE9A8063e20cB2efBE',
  'PowerTON': '0x72bc526739e5Af59443d72F396ae04d15Df5Ef83',
  'DAOVault': '0xeEcFEf9fA8315e72c007F976b9C8d929cf98bd79',
  'DAOAgendaManager': '0x83e1C1eeB2CBBBC39a79228fc32504b462B13839',
  'CandidateFactory': '0x1ACf6Cba554B95e85a32199b5AA292804B921EE4',
  'DAOCommittee': '0xe170be06501607a67c53692ae4D2A754fd282471',
  'DAOCommitteeProxy': '0x543550A8B8528A7Bcb4Ca42230F4a8C8117cdFDb',
  'EtherToken': '0xF346Ff41DbC9cd430b8c1f4d0475C980bb09bcFb',
};

function getContract (want, web3, address) {
  if (!web3) {
    web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/27113ffbad864e8ba47c7d993a738a10'));
  }
  const Coinage = new web3.eth.Contract(autoRefactorCoinage.abi, address);
  const Candidate = new web3.eth.Contract(candidate.abi, address);
  const Layer2 = new web3.eth.Contract(layer2.abi, address);
  const DAOAgendaManager = new web3.eth.Contract(agendaManager.abi, deployed.DAOAgendaManager);
  const DAOCommitteeProxy = new web3.eth.Contract(committee.abi, deployed.DAOCommitteeProxy); // NOTE: use committee abi.
  const DAOCommittee = new web3.eth.Contract(committee.abi, deployed.DAOCommittee); // NOTE: not used.
  const DepositManager = new web3.eth.Contract(depositManager.abi, deployed.DepositManager);
  const TON = new web3.eth.Contract(ton.abi, deployed.TON);
  const WTON = new web3.eth.Contract(wton.abi, deployed.WTON);
  const PowerTON = new web3.eth.Contract(powerTON.abi, deployed.PowerTON);
  const SeigManager = new web3.eth.Contract(seigManager.abi, deployed.SeigManager);
  const Layer2Registry = new web3.eth.Contract(layer2Registry.abi, deployed.Layer2Registry);

  const contracts = {
    Candidate,
    Layer2,
    DAOAgendaManager,
    DAOCommitteeProxy,
    DAOCommittee,
    DepositManager,
    TON,
    WTON,
    PowerTON,
    SeigManager,
    Coinage,
    Layer2Registry,
  };

  if (want) {
    return contracts.hasOwnProperty(want) ? contracts[want] : null; // eslint-disable-line
  } else {
    return contracts;
  }
}

module.exports.getContract = getContract;

const depositManagerFunctionsOfTypeA = [
  {
    'params': {
      'aboutParam0': 'uint256 globalWithdrawalDelay_: Minimum withdrawal period (unit: block)',
      'exampleParam0': '1000',
    },
    'name': 'setGlobalWithdrawalDelay',
    'title': 'Global withdrawal delay will be changed.',
    'prettyName': '',
    'explanation':
`Tokamak Network Layer 2 staking has a global withdrawal delay.

Staking operators can set individual withdrawal delay, but there is a minimum withdrawal delay period set throughout the network. This minimum withdrawal delay period is the 'global withdrawal delay', and each operator's withdrawal delay cannot be lower than the global withdrawal delay.

This withdrawal delay is specified in blocks. New global withdrawal delay will be applied when an offer is passed with the number of blocks you want to propose via 'globalWithdrawalDelay_'`,
  },
];
const seigManagerFunctionsOfTypeA = [
  {
    'params': {
      'aboutParam0':
`uint256 powerTONSeigRate_: PowerTON distribution ratio (decimal: 27)
100000000000000000000000000: 10%`,
      'exampleParam0': '100000000000000000000000000',
    },
    'name': 'setPowerTONSeigRate',
    'title': 'SeigManager- The proportion of the newly issued TON accumulated for PowerTON will be changed.',
    'prettyName': '',
    'explanation':
`Currently, TON seigniorage is issued each time a Ethereum block is created.

Additionally issued TON will be distributed among PowerTON, DAO and staking users, excluding TON allocated for fixed seigniorage rewards (19%).
This function allows you to determine the ratio of the newly issued TON accumulated for PowerTON.`,
  },
  {
    'params': {
      'aboutParam0':
`uint256 daoSeigRate_: DAO distribution ratio (decimal: 27)
100000000000000000000000000: 10%`,
      'exampleParam0': '100000000000000000000000000',
    },
    'name': 'setDaoSeigRate',
    'title': 'SeigManager- The proportion of the newly issued TON accumulated for DAO will be changed.',
    'prettyName': '',
    'explanation':
`Currently, TON seigniorage is issued each time a Ethereum block is created.

Additionally issued TON will be distributed among PowerTON, DAO and staking users, excluding TON allocated for fixed seignorage rewards (19%).
This function allows you to determine the ratio of the newly issued TON accumulated for DAO.`,
  },
  {
    'params': {
      'aboutParam0':
`uint256 PseigRate_: Additional seigniorage distribution ratio
100000000000000000000000000: 10%`,
      'exampleParam0': '100000000000000000000000000',
    },
    'name': 'setPseigRate',
    'title': 'SeigManager- The proportion of TON issued by seigiorage will be changed by the staking rate.',
    'prettyName': '',
    'explanation':
`Currently, TON seigniorage is issued each time a Ethereum block is created.

Additionally issued TON will be distributed among PowerTON, DAO and staking users, excluding TON allocated for fixed seignorage rewards (19%).
This function allows you to determine the ratio of the newly issued TON accumulated for staking users.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 adjustDelay_: Commission rate application grace period (Unit: Block)',
      'exampleParam0': '1000',
    },
    'name': 'setAdjustDelay',
    'title': 'SeigManager- The grace period for applying the commission rate will be changed.',
    'prettyName': '',
    'explanation':
`TON operator can set the commission rate deducted from the delegator.
However, certain period is required to apply the changed commission rate. The period is measured in blocks.

This function allows you to set a grace period for commission rate change application.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 minimumAmount_: Operator\'s minimum deposit quantity 1000000000000000000000000000: 1 WTON',
      'exampleParam0': '1000000000000000000000000000',
    },
    'name': 'setMinimumAmount',
    'title': 'SeigManager- The minimum amount of TON a operator (Layer 2 block creator) must deposit will be changed.',
    'prettyName': '',
    'explanation':
`TON operators must deposit and stake a minimum amount to operate Layer 2 chain of TON.

If you are staking less than the amount set in this function, you cannot commit.

* Commit: The act of collecting blocks from Layer 2 and entering them into Layer 1. Seigniorage (compensation) is paid when you prove that you are operating faithfully by making a commit.`,
  },
];
const daoCommitteeProxyFunctionsOfTypeA = [
  {
    'params': {
      'aboutParam0': 'uint256 _value: Member activity subsidy per second (decimal: 18) 1000000000000000000: 1 TON',
      'exampleParam0': '1000000000000000000',
    },
    'name': 'setActivityRewardPerSecond',
    'title': 'DAO Committee- Committee\'s subsidies for DAO activities will be determined.',
    'prettyName': '',
    'explanation':
`In Tokamak DAO, DAO pays a reward (activity subsidy) to encourage the sincere activities of committees that review major governance issues.

This activity subsidy is paid per second, and through this function, the amount of TON distributed per second can be set.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 _newMaxMember: Maximum number of members',
      'exampleParam0': '5',
      'aboutParam1': 'uint256 _quorum: Quorum',
      'exampleParam1': '3',
    },
    'name': 'increaseMaxMember',
    'title': 'DAOCommittee- The number of Committee members active in DAO will increase.',
    'prettyName': '',
    'explanation':
`This function allows you to increase the number of active committee members in Tokamak DAO.

The number of committee members to be increased goes into the first parameter (Param1), and the number of quorum goes into the second parameter (Param2).

For example, if there are 3 committee members currently and a function 'increaseMaxMember(2, 4)' is passed, the committee member will be 5 and the quorum will be 4.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 _reducingMemberIndex: Member index to be removed',
      'exampleParam0': '1',
      'aboutParam1': 'uint256 _quorum: Quorum',
      'exampleParam1': '3',
    },
    'name': 'decreaseMaxMember',
    'title': 'DAOCommittee- The number of Committee members active in the DAO will decrease.',
    'prettyName': '',
    'explanation':
`This function allows to reduce the number of active committee members in Tokamak DAO.

The number that goes into the first parameter (Param1) is the index of the committee member to be excluded, and the number that goes into the second parameter (Param2) is the quorum.

Each committee member is assigned with an index. Through this function, you can specify the members to be excluded and the quorum to be changed accordingly.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 _quorum: Quorum',
      'exampleParam0': '3',
    },
    'name': 'setQuorum',
    'title': 'DAOCommittee- The minimum number of votes for an agenda to pass will be determined.',
    'prettyName': '',
    'explanation':
`This function sets the minimum number of votes for a single item to pass.

If you record less than the minimum number of votes set here, the agenda will not pass and the agenda will be rejected.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 _fees: Agenda creation fee (decimal: 18) 1000000000000000000: 1 TON',
      'exampleParam0': '100000000000000000000',
    },
    'name': 'setCreateAgendaFees',
    'title': 'DAOCommittee- The amount of TON to be burned to make an agenda will be determined.',
    'prettyName': '',
    'explanation':
`In order for an agenda to be made, a certain amount of TON must be incinerated.

This function sets the amount of TON to be burned to make an agenda.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 _minimumNoticePeriod: Agenda minimum disclosure period (unit: seconds)',
      'exampleParam0': '10000',
    },
    'name': 'setMinimumNoticePeriodSeconds',
    'title': 'DAOCommittee- Minimum disclosure period of an agenda will be determined.',
    'prettyName': '',
    'explanation':
`The agenda will be published for a period of time before it is passed.

This function allows you to set the minimum disclosure period, and the unit is in seconds.

The actual disclosure period for each agenda can be set at the time of creation of the agenda, but it must be more than the minimum value set in this function.`,
  },
  {
    'params': {
      'aboutParam0': 'uint256 _minimumVotingPeriod: Agenda minimum voting period (unit: seconds)',
      'exampleParam0': '10000',
    },
    'name': 'setMinimumVotingPeriodSeconds',
    'title': 'DAOCommittee- Minimum voting period of an agenda will be determined.',
    'prettyName': '',
    'explanation':
`This function allows you to set the minimum voting period, and the unit is in seconds.

The actual voting period for each agenda can be set when creating an agenda, but it must be more than the minimum value set in this function.`,
  },
];
const daoVaultFunctionsOfTypeA = [
  {
    'params': {
      'aboutParam0': 'address _to: Address to which authority is granted',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'uint256 _amount: Amount (decimal: 18) 1000000000000000000: 1 TON',
      'exampleParam1': '1000000000000000000',
    },
    'name': 'approveTON',
    'title': 'DAO Vault- Permission to transfer the TON stored in DAO Vault will be granted. ',
    'prettyName': '',
    'explanation':
`Some of the TON seigniorage generated per block is accumulated into DAO. DAO Vault is responsible for storing the seigniorage.
Through this function, you can grant permission to transfer the TON stored in DAO Vault to a specific address in a specific amount.`,
  },
  {
    'params': {
      'aboutParam0': 'address _to: Address to which authority is granted',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'uint256 _amount: Amount (decimal: 27) 1000000000000000000000000000: 1 WTON',
      'exampleParam1': '1000000000000000000000000000',
    },
    'name': 'approveWTON',
    'title': 'DAO Vault- Permission to transfer the WTON stored in DAO Vault will be granted. ',
    'prettyName': '',
    'explanation':
`Some of the TON seigniorage generated per block is accumulated into DAO. DAO Vault is responsible for storing them.
Through this function, you can grant permission to transfer WTON stored in DAO Vault to a specific address in a specific amount.`,
  },
  {
    'params': {
      'aboutParam0': 'address _token: Token contract address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address _to: Address to which permission is granted',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
      'aboutParam2': 'uint256 _amount: Amount',
      'exampleParam2': '100000000000',
    },
    'name': 'approveERC20',
    'title': 'Permission to transfer the ERC20 stored in DAO Vault will be granted. ',
    'prettyName': '',
    'explanation': 'This function allows you to grant permission to transfer specific ERC20 tokens stored in DAO Vault to a specific address in a specific amount.',
  },
  {
    'params': {
      'aboutParam0': 'address _to: Address to receive withdrawal',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'uint256 _amount: Amount (decimal: 18) 1000000000000000000: 1 TON',
      'exampleParam1': '1000000000000000000',
    },
    'name': 'claimTON',
    'title': 'The transfer of the TON stored in the DAO Vault will be requested.',
    'prettyName': '',
    'explanation':
`Some of the TON seigniorage generated per block is accumulated into DAO. DAO Vault is responsible for storing the seigniorage.
Through this function, you can request to send the TON stored in the DAO Vault to a specific address in a specific amount.`,
  },
  {
    'params': {
      'aboutParam0': 'address _to: Address to receive withdrawal',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'uint256 _amount: Amount (decimal: 27) 1000000000000000000000000000: 1 WTON',
      'exampleParam1': '1000000000000000000000000000',
    },
    'name': 'claimWTON',
    'title': 'The transfer of the WTON stored in the DAO Vault will be requested.',
    'prettyName': '',
    'explanation':
`Some of the TON seigniorage generated per block is accumulated into DAO. The DAO Vault is responsible for storing the seigniorage.
Through this function, you can request to send the WTON stored in DAO Vault to a specific address in a specific amount.`,
  },
  {
    'params': {
      'aboutParam0': 'address _token: Token contract address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address _to: Address to receive withdrawal',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
      'aboutParam2': 'uint256 _amount: Amount',
      'exampleParam2': '100000000000',
    },
    'name': 'claimERC20',
    'title': 'The transfer of the ERC20 stored in the DAO Vault will be requested.',
    'prettyName': '',
    'explanation':
'This function allows you to request that the ERC20 tokens stored in the DAO Vault be transferred to a specific address and a specific amount.',
  },
];

const tonFunctionsOfTypeB = [
  {
    'params': {
      'aboutParam0': 'address account: Address that will have the right to issue additional TON',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'addMinter',
    'title': 'TON- Minter authority will be given to a specific address.',
    'prettyName': '',
    'explanation':
`Through this function, you can give permission to create TON to a specific address.
Enter the address to be authorized in the first parameter (Param1).`,
  },
  // {
  //   'params': {
  //     'aboutParam0': '',
  //     'exampleParam0': '',
  //   },
  //   'name': 'enableCallback',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  {
    'params': {
      'aboutParam0': 'address account: Address to receive TON',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'uint256 amount: TON issuance amount (decimal: 18) 1000000000000000000: 1 TON',
      'exampleParam1': '1000000000000000000',
    },
    'name': 'mint',
    'title': 'TON-  TON balance will increase.',
    'prettyName': '',
    'explanation':
`This function exists because WTON needs the authority to issue TON.
Through this function, you can add a specific amount of balance to a specific account.

Enter 'address account' in the first parameter (Param1) and 'amount' in the second parameter (Param2).`,
  },
  {
    'params': {
      'aboutParam0': 'address target: Address from which TON issuance authority is to be removed',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'renounceMinter',
    'title': 'TON- TON Minter authority will be removed.',
    'prettyName': '',
    'explanation':
`Minter reserves the authority to issue TON.
Through this function, you can remove Minter's authority.`,
  },
  // {
  //   'name': 'renounceOwnership',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  // {
  //   'name': 'renouncePauser',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  {
    'params': {
      'aboutParam0': 'address sender: The sender\'s address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address recipient: The recipient\'s address',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
      'aboutParam2': 'uint256 amount: Amount (decimal: 18) 1000000000000000000: 1 TON',
      'exampleParam2': '1000000000000000000',
    },
    'name': 'transferFrom',
    'title': 'TON- TON will be transferred to another address.',
    'prettyName': '',
    'explanation':
`This function allows you to send TON.
Through this function, TON in the first parameter (Param1) can be transferred to the second parameter (Param2) as much as the amount in the third parameter (Param3).
Enter the Sender account in Param1, the Recipient account in Param2, and the amount in Parma3.`,
  },
  // {
  //   'name': 'transferOwnership',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  // {
  //   'name': 'setSeigManager',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
];
const wtonFunctionsOfTypeB = [
  {
    'params': {
      'aboutParam0': 'address account: Address that will have the right to issue additional WTON',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'addMinter',
    'title': 'WTON- WTON Minter authority will be given.',
    'prettyName': '',
    'explanation':
`Through this function, you can give a specific account permission to create WTON.
Enter the account to be granted permission into Parma1.`,
  },
  {
    'params': {
      'aboutParam0': 'bool _callbackEnabled: true/false',
      'exampleParam0': 'false',
    },
    'name': 'enableCallback',
    'title': 'WTON- When WTON moves, it will be decided whether part of the seigniorage will be distributed to DAO and PowerTON.',
    'prettyName': '',
    'explanation':
`When Layer 2 commits, part of the seigniorage is distributed to DAO and PowerTON.
In addition, when WTON is transferred (incineration, issuance, transmission, etc.), some of the seigniorage can be distributed to DAO and PowerTON depending on the value of Param1.

If the value is True, part of the seigniorage will be distributed to DAO and PowerTON when the WTON is transferred (burn, issue, transmission, etc.), and if the value is False, the seigniorage will not be distributed.

* Commit: The act of collecting blocks from Layer 2 and entering them into Layer 1. Seigniorage (compensation) is paid when you prove that you are operating faithfully by making a commit.`,
  },
  {
    'params': {
      'aboutParam0': 'address account: Address to receive WTON',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'uint256 amount: WTON issuance amount (decimal: 27) 1000000000000000000000000000: 1 WTON',
      'exampleParam1': '1000000000000000000000000000',
    },
    'name': 'mint',
    'title': 'WTON- WTON balance will increase.',
    'prettyName': '',
    'explanation':
`This function exists because TON needs the authority to issue WTON.
Through this function, you can add a specific amount of balance to a specific account.

Enter 'address account' in the first parameter (Param1) and 'amount' in the second parameter (Param2).`,
  },
  // {
  //   'name': 'renounceMinter',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  // {
  //   'name': 'renounceOwnership',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  // {
  //   'name': 'renouncePauser',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  {
    'params': {
      'aboutParam0': 'address _seigManager: The new SeigManager address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setSeigManager',
    'title': 'WTON- Seigmanager will be updated.',
    'prettyName': '',
    'explanation':
`This function allows you to update SeigManager WTON has. SeigManager is a contract that manages the seigniorage.
Enter the seigniorage contract to be changed in the first parameter (Param1).`,
  },
  {
    'params': {
      'aboutParam0': 'address sender: The sender\'s address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address recipient: The recipient\'s address',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
      'aboutParam2': 'uint256 amount: Amount (decimal: 27) 1000000000000000000000000000: 1 WTON',
      'exampleParam2': '1000000000000000000000000000',
    },
    'name': 'transferFrom',
    'title': 'WTON- WTON will be transferred to another address.',
    'prettyName': '',
    'explanation':
`This function allows you to transfer WTON.
Through this function, WTON in Param1 can be transferred to Param2 as much as the amount in Param3.
Enter the account of Sender in the first parameter (Param1), the account of Recipient in the second parameter (Param2), and the amount in the third parameter (Parma3).`,
  },
  {
    'params': {
      'aboutParam0': 'address target: Target contract address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address newOwner: New owner address',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'transferOwnership',
    'title': 'WTON- DAO\'s owner rights for WTON will be transferred.',
    'prettyName': '',
    'explanation':
'This function allows you to update DAO (contract update). Through this function, owner rights for WTON held by DAO can be transferred to param1. Enter the contract to be changed in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address account: Address to be burned',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'uint256 amount: Amount (decimal: 27) 1000000000000000000000000000: 1 WTON',
      'exampleParam1': '1000000000000000000000000000',
    },
    'name': 'burnFrom',
    'title': 'WTON- Certain amount of WTON will be burned.',
    'prettyName': '',
    'explanation':
`This function allows you to incinerate a certain amount of WTON held by a certain account.
Enter the address acount in the first parameter (Param1) and the amount to be burned in the second parameter (Param2).`,
  },
];
const depositManagerFunctionsOfTypeB = [
  {
    'params': {
      'aboutParam0': 'address newOwner: Address to receive owner authority',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'transferOwnership',
    'title': 'DepositManager- DAO\'s owner rights for WTON will be transferred.',
    'prettyName': '',
    'explanation':
'DAO has owner rights for Depositmanager (user deposit and withdrawal process management during staking). This function allows you to change the authority, and you can enter the address to which the authority will be transferred in the first parameter (Param1). It will be used when the DAO is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address seigManager: New seig manager contract address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setSeigManager',
    'title': 'DepositManager- Seigniorage Manage Contract of Depositmanager will be changed.',
    'prettyName': '',
    'explanation':
`Deposit Manager (user deposit and withdrawal process management during staking) holds a contract to manage seigniorage.
This function allows you to change the contract, and you can enter the contract address to be changed in the first parameter (Parma1). It will be used when the seigniorage management contract is updated.`,
  },
//   {
//     'params': {
//       'aboutParam0': 'address layer2: Layer2 address',
//       'exampleParam0': '0x0000000000000000000000000000000000000000',
//       'aboutParam1': 'address recipient: The recipient\'s address',
//       'exampleParam1': '0x0000000000000000000000000000000000000000',
//       'aboutParam2': 'uint256 amount: Amount to slash',
//       'exampleParam2': '0x0000000000000000000000000000000000000000',
//     },
//     'name': 'slash',
//     'title': '',
//     'prettyName': '',
//     'explanation':
// 'This function allows you to change the operator of Layer 2. Since the operator can be forcibly changed, it can be used in the event of malicious act.',
//   },
];
const seigManagerFunctionsOfTypeB = [
  {
    'params': {
      'aboutParam0': 'address account: Address to receive authority',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'addPauser',
    'title': 'SeigManager- Permission to stop issuing seigniorage will be granted.',
    'prettyName': '',
    'explanation':
'This function allows you to grant permission to stop issuing seigniorage. Enter the address account to be authorized in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address target: Address from which authority is to be removed',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'renounceMinter',
    'title': 'SeigManager- Seigmanager\'s Minter rights for the first parameter (Param1) will be removed.',
    'prettyName': '',
    'explanation':
    'This function allows you to remove the Minter rights for the first parameter (Param1) held by the existing Seigmanger (seigniorage managing contract). It will be used when Seigmanger (the seigniorage managing contract) is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address target: The target address for which you want to remove owner rights from SeigManger.',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'renounceOwnership',
    'title': 'SeigManager- DAO\'s owner rights for Seigmanager will be removed.',
    'prettyName': '',
    'explanation':
    'This function allows you to remove the Owner rights for the first parameter (Param1) held by the existing Seigmanger (seigniorage managing contract). It will be used when Seigmanger (the seigniorage managing contract) is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address target: Target address for which you want to remove Pauser permission from SeigManger',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'renouncePauser',
    'title': 'SeigManager- Seigmanager\'s Pauser rights for the first parameter(Param1) will be removed.',
    'prettyName': '',
    'explanation':
    'This function removes the Pauser permission for the first parameter (Param1) held by the existing Seigmanger when Seigmanger (seigniorage managing contract) is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address target: The target address from which the owner authority to be transferred by SeigManger',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address newOwner: The address to which SeigManger\'s owner authority is transferred',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'transferOwnership',
    'title': 'SeigManager- First parameter\'s(Param1) owner rights of Seigmanager will be transferred.',
    'prettyName': '',
    'explanation':
`This function allows you to change the owner of the first parameter (Param1) held by Seigmanager (seigniorage managing contract) to the second parameter (Param2).
It will be used when Seigmanager (seigniorage managing contract) is updated.`,
  },
  {
    'name': 'pause',
    'title': 'SeigManager- Seigniorage issuance will be stopped.',
    'prettyName': '',
    'explanation': 'This function allows you to stop issuing seigniorage.',
  },
  {
    'name': 'unpause',
    'title': 'SeigManager- Seigniorage issuance will be resumed.',
    'prettyName': '',
    'explanation': 'This function allows you to resume issuance of seigniorage.',
  },
  {
    'params': {
      'aboutParam0': 'address powerton: New PowerTON address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setPowerTON',
    'title': 'SeigManager- PowerTON contract will be changed.',
    'prettyName': '',
    'explanation':
'This function allows you to set the new PowerTON cotntract as the first parameter (Param1). This function will be used when PowerTON is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address daoAddress: New DAO Vault address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setDao',
    'title': 'SeigManager-  Seigmanager\'s DAO Vault contract will be changed.',
    'prettyName': '',
    'explanation':
'This function allows you to set the new DAO contract as the first parameter (Param1). This function will be used when DAO Vault is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address daoAddress: New CoinageFactory address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setCoinageFactory',
    'title': 'SeigManager- CoinageFactory address will be changed.',
    'prettyName': '',
    'explanation':
'CoinageFactory is where the seigniorage management contracts are distributed for each layer 2. This function will be used when the seigniorage management method is upgraded.',
  },
  {
    'params': {
      'aboutParam0': 'address account: Address to receive challenger authority for Seigmanager',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'addChallenger',
    'title': 'SeigManager- The Challenger authority will be transferred.',
    'prettyName': '',
    'explanation':
'This function allows you to grant the Challenger authority to a specific Address account. Enter the Address account to receive the authority into the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address newSeigManager: New SeigManager address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address[] coinages: The address of the Coinage to which the owner\'s authority is transferred',
      'exampleParam1': '[0x0000000000000000000000000000000000000000, 0x0000000000000000000000000000000000000001]',
    },
    'name': 'transferCoinageOwnership',
    'title': 'SeigManager- Seigmanager will be updated.',
    'prettyName': '',
    'explanation':
'This function is used when Seigmanager (seigniorage managing contract) is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address daoAddress: New CoinageFactory address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'renounceWTONMinter',
    'title': 'Seigmanager\'s WTON Minter function will be removed.',
    'prettyName': '',
    'explanation':
`Seigmanger (seigniorage managing contract) has a Minter function for WTON.
Seigmanager's MInter function for WTON can be removed through this function. It will be used when Seigmanger is updated.`,
  },
  {
    'params': {
      'aboutParam0': 'address layer2: Layer 2 contract address to slash',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
      'aboutParam1': 'address challenger: New operator address',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'slash',
    'title': 'Layer2 operator will be changed.',
    'prettyName': '',
    'explanation':
'This function allows you to take action when an operator\'s cheating occurs. You can forcibly change the operator of the first parameter (Param1) layer 2 to the second parameter (Param2).',
  },
];
const layer2RegistryFunctionsOfTypeB = [
  {
    'params': {
      'aboutParam0': 'address layer2: Layer 2 contract address to slash',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'renounceOwnership',
    'title': 'Layer2Registry- DAO\'s owner rights will be removed.',
    'prettyName': '',
    'explanation':
'DAO has owner rights for Layer2Registry (a registry for Layer 2 into Seigmanager). Sender\'s owner rights can be removed through this function. It will be used when the DAO is updated.',
  },
  {
    'params': {
      'aboutParam0': 'address newOwner: Address to which owner authority for Layer2Registry is transferred',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'transferOwnership',
    'title': 'Layer2Registry- DAO\'s owner rights will be changed.',
    'prettyName': '',
    'explanation':
'DAO has ownership rights to Layer2Registry (a registry for Layer 2 into Seigmanager). This function allows you to pass the Sender\'s owner rights to the first parameter (Param1). It will be used when the DAO is updated.',
  },
];
const daoCommitteeProxyFunctionsOfTypeB = [
  {
    'params': {
      'aboutParam0': 'bytes32 role: Authority to add',
      'exampleParam0': '0',
      'aboutParam1': 'address account: Address to be authorized',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'grantRole',
    'title': 'DAOCommitteeProxy- Owner rights for DAO will be granted.',
    'prettyName': '',
    'explanation':
`This function allows you to grant owner rights (owner rights are displayed as 0) for DAO. You can give the DAO owner rights to the second parameter (Param2).
If you want to grant owner rights, enter 0 in the first parameter (Param1).`,
  },
  {
    'params': {
      'aboutParam0': 'bytes32 role: Authority to remove',
      'exampleParam0': '0',
      'aboutParam1': 'address account: Address from which authority is removed',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'renounceRole',
    'title': 'DAOCommitteeProxy- Owner rights for DAO will be removed.',
    'prettyName': '',
    'explanation':
`This function allows you to remove owner rights (owner rights are marked as 0) for the DAO.
If you want to remove the owner's authority, you can enter authority (the owner's authority is displayed as 0) in the first parameter (Param1) and your own address in the second parameter (Param2).`,
  },
  {
    'params': {
      'aboutParam0': 'bytes32 role: Authority to remove',
      'exampleParam0': '0',
      'aboutParam1': 'address account: Address from which authority is removed',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'revokeRole',
    'title': 'DAOCommitteeProxy- Authority of a specific address will be removed.',
    'prettyName': '',
    'explanation':
'This function allows you to remove someone else\'s authority. If you want to remove the owner authority, enter the authority (owner authority is displayed as 0) in param1 and the address of the target whose authority you want to remove in param2.',
  },
  {
    'params': {
      'aboutParam0': 'bool _pause: Whether to stop (True:1/ False:0)',
      'exampleParam0': '1',
    },
    'name': 'setProxyPause',
    'title': 'DAOCommitteeProxy- It will be decided whether to stop DAO.',
    'prettyName': '',
    'explanation':
`Owners have the right to stop DAO. This function allows the owner to decide whether to stop DAO.
If the first Param1 value is true, DAO stops, and if it is false, it operates normally.`,
  },
  {
    'params': {
      'aboutParam0': 'address impl: New DAO contract address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'upgradeTo',
    'title': 'DAOCommitteeProxy- Address of the DAO contract will be upgraded. ',
    'prettyName': '',
    'explanation':
`This function sets the new address of the DAO contract to be upgraded. Enter the DAO contract address to be upgraded in the first parameter (Param1).
It will be used when the DAO is upgraded.`,
  },
];
const daoCommitteeFunctionsOfTypeB = [
//   {
//     'params': {
//       'aboutParam0': 'bytes32 role: Authority to add',
//       'exampleParam0': '0',
//       'aboutParam1': 'address account: Address to be authorized',
//       'exampleParam1': '0x0000000000000000000000000000000000000000',
//     },
//     'name': 'grantRole',
//     'title': '',
//     'prettyName': '',
//     'explanation':
// `This function allows you to grant owner rights (owner rights are displayed as 0) for DAO. You can give the DAO owner rights to the second parameter (Param2).
// If you want to grant owner rights, enter 0 in the first parameter (Param1).`,
//   },
//   {
//     'params': {
//       'aboutParam0': 'bytes32 role: Authority to remove',
//       'exampleParam0': '0',
//       'aboutParam1': 'address account: Address from which authority is removed',
//       'exampleParam1': '0x0000000000000000000000000000000000000000',
//     },
//     'name': 'renounceRole',
//     'title': '',
//     'prettyName': '',
//     'explanation':
// `This function allows you to remove owner rights (owner rights are marked as 0) for the DAO.
// If you want to remove the owner's authority, you can enter authority (the owner's authority is displayed as 0) in the first parameter (Param1) and your own address in the second parameter (Param2).`,
//   },
//   {
//     'params': {
//       'aboutParam0': 'bytes32 role: Authority to remove',
//       'exampleParam0': '0',
//       'aboutParam1': 'address account: Address from which authority is removed',
//       'exampleParam1': '0x0000000000000000000000000000000000000000',
//     },
//     'name': 'revokeRole',
//     'title': '',
//     'prettyName': '',
//     'explanation':
// 'This function allows you to remove someone else\'s authority. If you want to remove the owner authority, enter the authority (owner authority is displayed as 0) in param1 and the address of the target whose authority you want to remove in param2.',
//   },
  {
    'params': {
      'aboutParam0': 'address _seigManager: New Seigmanager address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setSeigManager',
    'title': 'DAOCommittee- DAO\'s Seigmanager contract will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when upgrading the Seigmanager contract (seigniorage managing contract) owned by DAO. Enter the Seigmanager contract address to be upgraded in the first parameter (Param1). It will be used when Seigmanager is upgraded.',
  },
  {
    'params': {
      'aboutParam0': 'address[] _candidateContracts: Candidate contract address to change Seigmanager address',
      'exampleParam0': '[0x0000000000000000000000000000000000000000, 0x0000000000000000000000000000000000000001]',
      'aboutParam1': 'address _seigManager: New Seigmanager address',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setCandidatesSeigManager',
    'title': 'DAOCommittee- Seigmanager contract of candidate\'s contract will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when upgrading the Seigmanager contract (seigniorage managing contract) held by the candidate. Enter the candidate in the first parameter (Param1) and the Seigmanager contract address to be upgraded in the second parameter (Param2).',
  },
  {
    'params': {
      'aboutParam0': 'address[] _candidateContracts: Candidate contract address to change DAO contract address',
      'exampleParam0': '[0x0000000000000000000000000000000000000000, 0x0000000000000000000000000000000000000001]',
      'aboutParam1': 'address _committee: New DAO contract address',
      'exampleParam1': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setCandidatesCommittee',
    'title': 'DAOCommittee- DAO contract of candidate\'s contract will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when upgrading the Seigmanager contract (seigniorage managing contract) held by the candidate. Enter the candidate in the first parameter (Param1) and the DAO contract address to be upgraded in the second parameter (Param2).',
  },
  {
    'params': {
      'aboutParam0': 'address _daoVault: New DAO Vault address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setDaoVault',
    'title': 'DAOCommittee- DAO Vault will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when the DAO Vault is upgraded. Enter the DAO contract address to be upgraded in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address _layer2Registry: New Layer2Registry address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setLayer2Registry',
    'title': 'DAOCommittee- Layer2Registry will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when Layer2Registry (registry for Layer 2 into Seigmanager) is upgraded. Enter the DAO contract address to be upgraded in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address _agendaManager: New AgendaManager address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setAgendaManager',
    'title': 'DAOCommittee- DAO AgendaManager will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when the DAO AgendaManager is upgraded. Enter the DAO contract address to be upgraded in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address _candidateFactory: New CandidateFactory address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setCandidateFactory',
    'title': 'DAOCommittee- CandidateFactory will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when CandidateFactory is upgraded. Enter the DAO contract address to be upgraded in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address _ton: New TON address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setTon',
    'title': 'DAOCommittee- TON will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when TON is upgraded. Enter the DAO contract address to be upgraded in param1.',
  },
  // {
  //   'params': {
  //     'aboutParam0': 'address layer2: Layer 2 contract address to slash',
  //     'exampleParam0': '0x0000000000000000000000000000000000000000',
  //   },
  //   'name': 'registerOperatorByOwner',
  //   'title': '',
  //   'prettyName': '',
  //   'explanation': '',
  // },
  {
    'params': {
      'aboutParam0': 'uint256 _agendaID: The agenda number to finish',
      'exampleParam0': '13',
    },
    'name': 'endAgendaVoting',
    'title': 'DAOCommittee- If an agenda is rejected, it will be finally closed.',
    'prettyName': '',
    'explanation':
'This function finally closes an agenda if the agenda is rejected.',
  },
  {
    'params': {
      'aboutParam0': 'uint256 _agendaID: The agenda number to be changed',
      'exampleParam0': '13',
      'aboutParam1': 'uint256 _status: The progress of the agenda',
      'exampleParam1': '5',
      'aboutParam2': 'uint256 _result: Voting result of the agenda',
      'exampleParam2': '3',
    },
    'name': 'setAgendaStatus',
    'title': 'DAOCommittee- The DAO will change the outcome of an agenda regardless of the result of the vote on the agenda.',
    'prettyName': '',
    'explanation':
'This function allows the DAO to change the outcome of the agenda regardless of the vote result.',
  },
];
const daoVaultFunctionsOfTypeB = [
  {
    'name': 'renounceOwnership',
    'title': 'Candidate- DAO\'s authority for candidate contracts will be removed.',
    'prettyName': '',
    'explanation':
'The DAO holds owner rights to Vault. This function allows you to remove DAO\'s owner rights to the vault.',
  },
  {
    'params': {
      'aboutParam0': 'address newOwner: Address to which the owner authority will be transferred',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'transferOwnership',
    'title': 'Candidate- DAO\'s authority for candidate contracts will be transferred.',
    'prettyName': '',
    'explanation':
'The DAO holds owner rights to Vault. This function allows you to transfer owner rights for the vault held by the DAO. Enter the new owner in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address _ton: New TON address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setTON',
    'title': 'DAO Vault- TON will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when TON is upgraded. Enter the new TON address in the first parameter (Param1).',
  },
  {
    'params': {
      'aboutParam0': 'address _wton: New WTON address',
      'exampleParam0': '0x0000000000000000000000000000000000000000',
    },
    'name': 'setWTON',
    'title': 'DAO Vault- WTON will be upgraded.',
    'prettyName': '',
    'explanation':
'This function is used when WTON is upgraded. Enter the new WTON address in the first parameter (Param1).',
  },
];

const depositManagerABIOfTypeA = [];
const seigManagerABIOfTypeA = [];
const daoCommitteeProxyABIOfTypeA = [];
const daoVaultABIOfTypeA = [];

const tonABIOfTypeB = [];
const wtonABIOfTypeB = [];
const depositManagerABIOfTypeB = [];
const seigManagerABIOfTypeB = [];
const layer2RegistryABIOfTypeB = [];
const daoCommitteeProxyABIOfTypeB = [];
const daoCommitteeABIOfTypeB = [];
const daoVaultABIOfTypeB = [];

(() => {
  const set = (functions, abis, abi) => {
    functions.forEach(func => {
      const f = abi.find(f => f.name === func.name);
      f.selector = web3EthABI.encodeFunctionSignature(f);
      f.explanation = func.explanation;
      f.prettyName = func.prettyName;
      f.title = func.title;
      f.params = func.params;

      abis.push(f);
    });
  };

  set(depositManagerFunctionsOfTypeA, depositManagerABIOfTypeA, depositManager.abi);
  set(seigManagerFunctionsOfTypeA, seigManagerABIOfTypeA, seigManager.abi);
  set(daoCommitteeProxyFunctionsOfTypeA, daoCommitteeProxyABIOfTypeA, committee.abi);
  set(daoVaultFunctionsOfTypeA, daoVaultABIOfTypeA, daoVault.abi);

  set(tonFunctionsOfTypeB, tonABIOfTypeB, ton.abi);
  set(wtonFunctionsOfTypeB, wtonABIOfTypeB, wton.abi);
  set(depositManagerFunctionsOfTypeB, depositManagerABIOfTypeB, depositManager.abi);
  set(seigManagerFunctionsOfTypeB, seigManagerABIOfTypeB, seigManager.abi);
  set(layer2RegistryFunctionsOfTypeB, layer2RegistryABIOfTypeB, layer2Registry.abi);
  set(daoCommitteeProxyFunctionsOfTypeB, daoCommitteeProxyABIOfTypeB, committeeProxy.abi);
  set(daoCommitteeFunctionsOfTypeB, daoCommitteeABIOfTypeB, committee.abi);
  set(daoVaultFunctionsOfTypeB, daoVaultABIOfTypeB, daoVault.abi);
})();

module.exports.getContractABI = function (want, type = 'A') {
  if (!want) return [];

  if (type === 'A') {
    if (want === 'DepositManager') return depositManagerABIOfTypeA;
    else if (want === 'SeigManager') return seigManagerABIOfTypeA;
    else if (want === 'DAOCommitteeProxy') return daoCommitteeProxyABIOfTypeA;
    else if (want === 'DAOVault') return daoVaultABIOfTypeA;
    else return [];
  } else {
    if (want === 'TON') return tonABIOfTypeB;
    else if (want === 'WTON') return wtonABIOfTypeB;
    else if (want === 'DepositManager') return depositManagerABIOfTypeB;
    else if (want === 'SeigManager') return seigManagerABIOfTypeB;
    else if (want === 'Layer2Registry') return layer2RegistryABIOfTypeB;
    else if (want === 'DAOCommitteeProxy') return daoCommitteeProxyABIOfTypeB;
    else if (want === 'DAOCommittee') return daoCommitteeABIOfTypeB;
    else if (want === 'DAOVault') return daoVaultABIOfTypeB;
    else return [];
  }
};

module.exports.getContractABIFromAddress = function (address, type) {
  if (!address) return [];
  address = address.toLowerCase();

  if (type === 'A') {
    if (address === deployed.DepositManager.toLowerCase()) return depositManagerABIOfTypeA;
    else if (address === deployed.SeigManager.toLowerCase()) return seigManagerABIOfTypeA;
    else if (address === deployed.DAOCommitteeProxy.toLowerCase()) return daoCommitteeProxyABIOfTypeA;
    else if (address === deployed.DAOVault.toLowerCase()) return daoVaultABIOfTypeA;
    else return [];
  } else if (type === 'B') {
    if (address === deployed.TON.toLowerCase()) return tonABIOfTypeB;
    else if (address === deployed.WTON.toLowerCase()) return wtonABIOfTypeB;
    else if (address === deployed.DepositManager.toLowerCase()) return depositManagerABIOfTypeB;
    else if (address === deployed.SeigManager.toLowerCase()) return seigManagerABIOfTypeB;
    else if (address === deployed.Layer2Registry.toLowerCase()) return layer2RegistryABIOfTypeB;
    else if (address === deployed.DAOCommitteeProxy.toLowerCase()) return daoCommitteeProxyABIOfTypeB;
    else if (address === deployed.DAOCommittee.toLowerCase()) return daoCommitteeABIOfTypeB;
    else if (address === deployed.DAOVault.toLowerCase()) return daoVaultABIOfTypeB;
    else return [];
  } else {
    console.log('bug', 'no type'); // eslint-disable-line
  }
};

module.exports.getContractAddress = function (target) {
  const address = deployed[target];
  if (!address) {
    console.log('bug'); // eslint-disable-line
  }
  return address ? address : '';
};

module.exports.getFunctionSelector = function (contract, want, type) {
  if (!contract || !want) return '';

  if (type === 'A') {
    if (contract === 'DepositManager') return (depositManagerABIOfTypeA.find(f => f.name === want)).selector;
    else if (contract === 'SeigManager') return (seigManagerABIOfTypeA.find(f => f.name === want)).selector;
    else if (contract === 'DAOCommitteeProxy') return (daoCommitteeProxyABIOfTypeA.find(f => f.name === want)).selector;
    else if (contract === 'DAOVault') {
      return (daoVaultABIOfTypeA.find(f => f.name === want)).selector;
    }
    else {
      return '';
    }
  } else if (type === 'B') {
    if (contract === 'TON') return (tonABIOfTypeB.find(f => f.name === want)).selector;
    else if (contract === 'WTON') return (wtonABIOfTypeB.find(f => f.name === want)).selector;
    else if (contract === 'DepositManager') return (depositManagerABIOfTypeB.find(f => f.name === want)).selector;
    else if (contract === 'SeigManager') return (seigManagerABIOfTypeB.find(f => f.name === want)).selector;
    else if (contract === 'Layer2Registry') return (layer2RegistryABIOfTypeB.find(f => f.name === want)).selector;
    else if (contract === 'DAOCommitteeProxy') return (daoCommitteeProxyABIOfTypeB.find(f => f.name === want)).selector;
    else if (contract === 'DAOCommittee') return (daoCommitteeABIOfTypeB.find(f => f.name === want)).selector;
    else if (contract === 'DAOVault') return (daoVaultABIOfTypeB.find(f => f.name === want)).selector;
    else return '';
  } else {
    return '';
  }
};

module.exports.encodeParameters = function (typesArray, parameters) {
  const web3 = new Web3();
  return web3.eth.abi.encodeParameters(typesArray, parameters);
};

module.exports.encoded = function (type, value) {
  const types = [
    'uint256',
    'bool',
    'address',
    'address[]',
    'bytes32',
    'string',
  ];

  const index = types.indexOf(type);
  if (index === -1) {
    console.log('bug'); // eslint-disable-line
    return '';
  }
  if (index === 0) return String(value); // uint256
  else if (index === 1) { // bool
    value = value.toLowerCase();

    if (value === 'true') return true;
    else if (value === 'false') return false;
    else return -1;
  }
  else if (index === 2) { // address
    if (value.length !== 42) return -1;
    else return value;
  }
  else if (index === 3) { // address[]
    let bug = false;

    const values = [];
    value = value.replace(/\s/g, '');
    value = value.substring(1, value.length - 1);
    value.split(',').forEach(address => {
      if (address.length !== 42) bug = true;
      else values.push(value);
    });

    if (bug) return -1;
    return values;
  }
  else {
    return value;
  }
};

const decodeParameters = function (typesArray, hexString) {
  const web3 = new Web3();
  return web3.eth.abi.decodeParameters(typesArray, hexString);
};
module.exports.decodeParameters = decodeParameters;

const getABIFromSelector = function (selector, type) {
  let abi;

  if (type === 'A') {
    abi = depositManagerABIOfTypeA.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = seigManagerABIOfTypeA.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = daoCommitteeProxyABIOfTypeA.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = daoVaultABIOfTypeA.find(abi => abi.selector === selector);
    if (abi) return abi;
  } else if (type === 'B') {
    abi = tonABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = wtonABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = depositManagerABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = seigManagerABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = layer2RegistryABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = daoCommitteeProxyABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = daoCommitteeABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    abi = daoVaultABIOfTypeB.find(abi => abi.selector === selector);
    if (abi) return abi;

    if (!abi) {
      console.log('bug'); // eslint-disable-line
    }
  } else {
    console.log('bug', 'no type'); // eslint-disable-line
  }
};
module.exports.getABIFromSelector = getABIFromSelector;

module.exports.parseAgendaBytecode = function (tx, type) {
  const params1 = marshalString(unmarshalString(tx.input).substring(8));
  const decodedParams1 = decodeParameters(['address', 'uint256', 'bytes'], params1);

  const params2 = decodedParams1[2];
  const decodedParams2 = decodeParameters(['address[]', 'uint256', 'uint256', 'bool', 'bytes[]'], params2);

  const targets = decodedParams2[0];
  const commands = decodedParams2[4];

  if (targets.length !== commands.length) {
    console.log('bug'); // eslint-disable-line
  }

  const onChainEffects = [];
  for (let i = 0; i < targets.length; i++) {
    const selector = commands[i].slice(0, 10);
    const abi = getABIFromSelector(selector, type);

    if (!abi) {
      onChainEffects.push({
        target: '',
        name: '',
        types: [],
        bytecode: '',
      });
      console.log('bug', 'no abi'); // eslint-disable-line
      continue;
    }

    const target = targets[i];
    const name = abi.name;
    const types = [];
    abi.inputs.forEach(input => {
      types.push(input.type);
    });
    const bytecode = marshalString(unmarshalString(commands[i]).substring(8));
    const values = decodeParameters(types, bytecode);

    const onChainEffect = {
      target,
      name,
      types,
      values,
    };
    onChainEffects.push(onChainEffect);
  }
  return onChainEffects;
};

module.exports.metamaskErrorMessage = function (errorString) {
  let errString = '';
  if (errorString !== null && errorString.length > 0) {
    const key = 'message';
    const positionKey = errorString.indexOf(key);
    const startMessage = errorString.indexOf('"', positionKey + key.length + 2);
    const endMessage = errorString.indexOf('"', startMessage + 3);
    errString = errorString.substring(startMessage + 1, endMessage);
  }
  return errString;
};

module.exports.canExecute = async function (agendaId, _web3) {
  let canExecute = false;
  try {
    const AgendaManager = await getContract('DAOAgendaManager', _web3);
    if (AgendaManager !== null) {
      canExecute = await AgendaManager.methods.canExecuteAgenda(agendaId).call();
    } else {
      console.log('Utils.canExecuteAgenda AgendaManager is null') ; // eslint-disable-line
    }
  } catch (err) {
    console.log('Utils.canExecuteAgenda err', err) ; // eslint-disable-line
  }
  return canExecute;
};

module.exports.stakedOfCandidateContracts = async function (_web3, _candidateContract, account) {
  let amount = 0;
  if (_candidateContract !== null && _candidateContract.length > 0 && account !== null && account.length > 0) {
    const seigManager = await getContract('SeigManager', _web3);
    if (seigManager !== null) {
      const coinageAddress = await seigManager.methods.coinages(_candidateContract).call();
      if (coinageAddress) {
        const coinage = await getContract('Coinage', _web3, coinageAddress);
        if (coinage) {
          amount = await coinage.methods.balanceOf(account).call();
        } else {
          console.log('Utils.stakedOfCandidateContracts coinage is null') ; // eslint-disable-line
        }
      } else {
        console.log('Utils.stakedOfCandidateContracts coinageAddress is null') ; // eslint-disable-line
      }
    } else {
      console.log('Utils.stakedOfCandidateContracts is null') ; // eslint-disable-line
    }

  }
  return amount;
};

module.exports.minimumAmountOfOperator = async function (_web3) {
  let amount = 0;
  try {
    const seigManager = await getContract('SeigManager', _web3);
    if (seigManager !== null) {
      amount = await seigManager.methods.minimumAmount().call();
    } else {
      console.log('Utils.minimumAmountOfOperator is null') ; // eslint-disable-line
    }
  } catch (err) {
    console.log('Utils.minimumAmountOfOperator err', err) ; // eslint-disable-line
  }
  return amount;
};

// module.exports.getBlockTimeStamp = async function (blockNumber, web3) {
//   if (!web3) {
//     web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/27113ffbad864e8ba47c7d993a738a10'));
//   }
//   const block = await web3.eth.getBlock(blockNumber);
//   this.timestamp = block.timestamp;
//   return block.timestamp;
// };
