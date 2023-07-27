const log = require('debug')('synpress:metamask');
const playwright = require('./playwrightStation');

const elements = require('../pages/station/main-page');

const station = {
  async initialSetup(playwrightInstance) {
    if (playwrightInstance) {
      await playwright.init(playwrightInstance);
    } else {
      await playwright.init();
    }

    await playwright.assignStartPage();
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
  
  async evaluateSettings() {
    await playwright.evaluateSettings();
  },

  async evaluateManageWallet() {
    await playwright.evaluateManageWallet();
  },
};

module.exports = station;
