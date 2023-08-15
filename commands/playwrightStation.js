const log = require('debug')('synpress:playwright');
const fetch = require('node-fetch');
const { defineConfig } = require('@playwright/test');
const expect = require('@playwright/test').expect;

const PageFactory = require('../pages/station/pageFactory');

let browser;
let browserContext;
let pageFactory;
let stationExtension;
let stationExtensionNewWallet;
let stationExtensionSeed;
let stationExtensionPrivateKey;
let stationExtensionMultiSig;
let stationExtensionLedger;
let activeTabName;

//all of the test share a single browser context
//can be changed and manupilated but this is the entrypoint for each browser context

module.exports = {
  config: defineConfig({
    expect: {
      timeout: 7000,
    },
  }),

  async assignActiveTabName(tabName) {
    activeTabName = tabName;
    return true;
  },

  async init(playwrightInstance) {
    const chromium = playwrightInstance
      ? playwrightInstance
      : require('@playwright/test').chromium;
    const debuggerDetails = await fetch('http://127.0.0.1:9222/json/version'); //DevSkim: ignore DS137138
    const debuggerDetailsConfig = await debuggerDetails.json();
    const webSocketDebuggerUrl = debuggerDetailsConfig.webSocketDebuggerUrl;
    if (process.env.SLOW_MODE) {
      if (!isNaN(process.env.SLOW_MODE)) {
        browser = await chromium.connectOverCDP(webSocketDebuggerUrl, {
          slowMo: Number(process.env.SLOW_MODE),
        });
      } else {
        browser = await chromium.connectOverCDP(webSocketDebuggerUrl, {
          slowMo: 50,
        });
      }
    } else {
      browser = await chromium.connectOverCDP(webSocketDebuggerUrl);
    }

    // Initialize browserContext after browser initialization
    browserContext = browser.contexts()[0];
    // Initialize pageFactory after browserContext initialization
    pageFactory = new PageFactory(browserContext);

    return browser.isConnected();
  },

  async assignHomePage() {
    stationExtension = await pageFactory.createPage('home')
  },
  async assignNewWalletPage() {
    stationExtensionNewWallet = await pageFactory.createPage('newWallet');
  },
  async assignSeedPage() {
    stationExtensionSeed = await pageFactory.createPage('seed');
  },
  async assignPrivateKeyPage() {
    stationExtensionPrivateKey = await pageFactory.createPage('privateKey');
  },
  async assignMultiSigPage() {
    stationExtensionMultiSig = await pageFactory.createPage('multi');
  },
  async assignLedgerPage() {
    stationExtensionLedger = await pageFactory.createPage('ledger');
  },

  async clear() {
    browser = null;
    return true;
  },

  async setupQaWalletAndVerify() {
    await stationExtensionSeed.fillSeedForm('Test wallet 1', 'Testtest123!');
    await stationExtensionSeed.verifyFirstWalletAdded();
  },

  async verifyElementsManageWalletsForm() {
    await stationExtension.verifyElementsManageWalletsForm();
  },

  async fillImportFromSeedPhraseForm(
    walletName,
    password,
    seed = process.env.SEED_PHRASE_TWO,
  ) {
    await this.assignSeedPage();
    await stationExtensionSeed.fillSeedForm(walletName, password, seed);
  },

  async close() {
    let pages = await browser.contexts()[0].pages();
    pages.forEach(page => {
      if (page.url().includes('runner')) {
        return;
      }
      page.close();
    });
  },

  async fillCreateWalletForm(walletName) {
    await stationExtensionNewWallet.fillCreateWalletForm(walletName)
  },

  async goToManageWalletsMenuFromHome() {

    await stationExtension.goToManageWalletsMenuFromHome()
  },

  async submitAndVerifyHomeScreen() {
    await stationExtensionPrivateKey.submitAndVerifyHomeScreen()
  },

  async evaluateMainPage() {
    await stationExtension.evaluateMainPage()
  },

  async evaluateSettings() {
    await stationExtension.evaluateSettings();
  },

  async evaluateManageWallet() {
    await stationExtension.evaluateManageWallet();
  },

  async evaluateManageAssets() {
    await stationExtension.evaluateManageAssets();
  },

  async fillRecoverWalletFromPrivateKeyForm(privateKey = process.env.PRIVATE_KEY, password = 'Testtest123!') {
    await this.assignPrivateKeyPage()
    await stationExtensionPrivateKey.fillRecoverWalletFromPrivateKeyForm(privateKey, password)
  },

  async verifyWrongPrivateKeyMessage() {
    await stationExtensionPrivateKey.verifyWrongPrivateKeyMessage();
  },

  async verifyWrongPassword() {
    await stationExtensionPrivateKey.verifyWrongPassword();
  },
  async createMutliSigWallet(addresses, threshold){
    await this.assignMultiSigPage()
    await stationExtensionMultiSig.createMutliSigWallet(addresses, threshold);
    return true
  }

};
