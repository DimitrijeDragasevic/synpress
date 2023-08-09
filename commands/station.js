const playwright = require('./playwrightStation');

const elements = require('../pages/station/basePage');

const station = {
  async initialSetup(playwrightInstance) {
    if (playwrightInstance) {
      await playwright.init(playwrightInstance);
    } else {
      await playwright.init();
    }

    // await playwright.assignStartPage();
    await playwright.assignSeedPage();
    await playwright.setupQaWalletAndVerify();
    return true;
  },
  async recoverWalletFromSeed() {
    await playwright.goToManageWalletsMenuFromHome();
    await playwright.fillImportFromSeedPhraseForm(
      'Test wallet 2',
      'Testtest123!',
    );
  },
  async verifyManageWalletsForm() {
    await playwright.goToManageWalletsMenuFromHome();
    await playwright.verifyElementsManageWalletsForm();
  },

  async createWallet(walletName) {
    await playwright.fillCreateWalletForm(walletName);
  },

  async evaluateMainPage() {
    await playwright.evaluateMainPage();
  },

  async evaluateSettings() {
    await playwright.evaluateSettings();
  },

  async evaluateManageWallet() {
    await playwright.evaluateManageWallet();
  },

  async evaluateManageAssets() {
    await playwright.evaluateManageAssets();
  },

  async closeTabs() {
    await playwright.close();
  },

  async importWalletFromPrivateKey() {
    await playwright.fillRecoverWalletFromPrivateKeyForm();
    await playwright.submitAndVerifyHomeScreen('private key');
  },

  async importWalletFromPrivateKeyInvalidKey() {
    await playwright.fillRecoverWalletFromPrivateKeyForm('123123awe');
    await playwright.verifyWrongPrivateKeyMessage();
  },

  async importWalletFromPrivateKeyWrongPassword() {
    await playwright.fillRecoverWalletFromPrivateKeyForm(
      process.env.PRIVATE_KEY_TWO,
      '123qwer',
    );
    await playwright.verifyWrongPassword();
  },

  async createMultiSigWallet(
    addresses = [
      'terra1u28fgu0p99eh9xc4623k6cw6qmfdnl9un23yxs',
      'terra10detxcnq49r3nnze7zuqprl7yqdh34fulqtakw',
    ],
    threshold = '2',
  ) {
    await playwright.goToManageWalletsMenuFromHome();
    return await playwright.createMutliSigWallet(addresses, threshold);
  },
};

module.exports = station;
