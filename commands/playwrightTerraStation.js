const log = require('debug')('synpress:playwright');
const fetch = require('node-fetch');

const {
  seedFormElements,
  seedCompletedFormElements,
  manageWalletsForm,
} = require('../pages/terrastation/seed-page');

const expect = require('@playwright/test').expect;

let browser;
let mainWindow;
let terraStationExtension;
let terraStationExtensionNewWallet;
let terraStationExtensionSeed;
let terraStationExtensionPrivateKey;
let terraStationExtensionMultiSig;
let terraStationExtensionLedger;
let activeTabName;

module.exports = {
  browser() {
    return browser;
  },
  mainWindow() {
    return mainWindow;
  },
  terraStationExtension() {
    return terraStationExtension;
  },
  terraStationExtensionNewWallet() {
    return terraStationExtensionNewWallet;
  },
  terraStationExtensionSeed() {
    return terraStationExtensionSeed;
  },
  terraStationExtensionPrivateKey() {
    return terraStationExtensionPrivateKey;
  },
  terraStationExtensionMultiSig() {
    return terraStationExtensionMultiSig;
  },
  terraStationExtensionLedger() {
    return terraStationExtensionLedger;
  },
  activeTabName() {
    return activeTabName;
  },
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
    return browser.isConnected();
  },
  async assignStartPage() {
    let terraStationExtensionUrl;
    let serviceWorkers = await browser.contexts()[0].serviceWorkers();
    for (let worker of serviceWorkers) {
      const url = worker._initializer.url;

      // Check if the URL contains 'background.js'
      if (url.includes('background.js')) {
        terraStationExtensionUrl = url.replace('background.js', 'index.html#/');
        break; // Exit the loop once the correct service worker is found
      }
    }

    const blankPage = await browser.contexts()[0].newPage();
    await blankPage.goto(terraStationExtensionUrl);
    let pages = await browser.contexts()[0].pages();
    pages.forEach(page => {
      if (page.url().includes('index.html')) {
        terraStationExtension = page;
      }
    });
  },
  async waitForNewPageWithUrlPart(urlPart) {
    return new Promise(resolve => {
      browser.contexts()[0].on('page', newPage => {
        newPage.url().includes(urlPart) && resolve(newPage);
      });
    });
  },
  async assignNewWalletPage() {
    const newWalletPagePromise = this.waitForNewPageWithUrlPart('auth/new');
    await terraStationExtension.getByText('New wallet').click();
    terraStationExtensionNewWallet = await newWalletPagePromise;
  },
  async assignSeedPage() {
    const seedPagePromise = this.waitForNewPageWithUrlPart('auth/recover');
    await terraStationExtension.getByText('Import from seed phrase').click();
    terraStationExtensionSeed = await seedPagePromise;
  },
  async assignPrivateKeyPage() {
    const privateKeyPagePromise = this.waitForNewPageWithUrlPart('auth/import');
    await terraStationExtension.getByText('Import from private key').click();
    terraStationExtensionPrivateKey = await privateKeyPagePromise;
  },
  async assignMultiSigPage() {
    const multisigWalletPagePromise =
      this.waitForNewPageWithUrlPart('auth/multisig/new');
    await terraStationExtension.getByText('New multisig wallet').click();
    terraStationExtensionMultiSig = await multisigWalletPagePromise;
  },
  async assignLedgerPage() {
    const ledgerPagePromise = this.waitForNewPageWithUrlPart('auth/ledger');
    await terraStationExtension.getByText('Access with ledger').click();
    terraStationExtensionLedger = await ledgerPagePromise;
  },
  async clear() {
    browser = null;
    return true;
  },

  async switchToCypressWindow() {
    if (mainWindow) {
      await mainWindow.bringToFront();
      await module.exports.assignActiveTabName('cypress');
    }
    return true;
  },
  async switchToTerraStationWindow() {
    await terraStationExtension.bringToFront();
    await module.exports.assignActiveTabName('terraStation');
    return true;
  },
  async bringToFrontAndReload(page) {
    page.bringToFront();
    page.reload();
  },

  async setupQaWalletAndVerify() {
    await this.fillSeedForm('Test wallet 1', 'Testtest123!');
    await this.bringToFrontAndReload(terraStationExtension);
    await this.verifyFirstWalletAdded();
  },
  async fillSeedForm(walletName, password, seed = process.env.SEED_PHRASE) {
    await terraStationExtensionSeed.bringToFront();
    await terraStationExtensionSeed.waitForLoadState();
    await terraStationExtensionSeed.fill(
      seedFormElements.inputName,
      walletName,
    );
    await terraStationExtensionSeed.fill(
      seedFormElements.inputPassword,
      password,
    );
    await terraStationExtensionSeed.fill(
      seedFormElements.inputconfirmPassword,
      password,
    );
    await terraStationExtensionSeed.fill(
      seedFormElements.inputMnemonicSeed,
      seed,
    );
    await terraStationExtensionSeed.click(seedFormElements.submitButton),
      await terraStationExtensionSeed.waitForURL('**/recover#3');

    expect(
      await terraStationExtensionSeed.getByTestId('DoneAllIcon'),
    ).toBeVisible();
    expect(
      terraStationExtensionSeed.getByRole('button', {
        name: 'Connect',
        exact: true,
      }),
    ).toBeVisible();
    await terraStationExtensionSeed
      .getByRole('button', { name: 'Connect', exact: true })
      .click();
  },

  async verifyFirstWalletAdded() {
    expect(
      await terraStationExtension.getByRole('button', {
        name: 'Test wallet 1',
      }),
    ).toBeVisible();
    await terraStationExtension.getByText('Test wallet 1').click();
    expect(
      await terraStationExtension.getByText('Manage Wallets'),
    ).toBeVisible();
    expect(
      await terraStationExtension.getByRole('button', {
        name: 'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
      }),
    ).toBeVisible();
    expect(await terraStationExtension.getByText('Add a wallet')).toBeVisible();
    await terraStationExtension.click(
      manageWalletsForm.manageWalletsCloseButton,
    );
  },

  async goToManageWalletsMenuFromHome() {
    await terraStationExtension
      .getByRole('button', { name: 'Test wallet 1' })
      .click();
    expect(
      await terraStationExtension.getByText('Manage Wallets'),
    ).toBeVisible();
    expect(
      await terraStationExtension.getByRole('button', {
        name: 'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
      }),
    );
    await terraStationExtension
      .getByRole('button', { name: 'Add a wallet' })
      .click();
  },

  async fillImportFromSeedPhraseForm(
    walletName,
    password,
    seed = process.env.SEED_PHRASE_TWO,
  ) {
    await this.assignSeedPage();
    await this.fillSeedForm(walletName, password, seed);
  },

  /* -------------------------------------------------------------------------- */
  /*                                  Settings                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Ensures text is in document, clicks text option, and closes modal.
   *
   * @param {string} text The text to find in the document.
   * @param {boolean} click Whether or not to click the text option.
   * @param {boolean} close Whether or not to close out of the settings modal.
   */
  async expectText(text, click = false, close = false) {
    const textComponent = await terraStationExtension.getByText(text, {
      exact: true,
    });

    await expect(textComponent).toBeVisible();

    if (click) {
      await textComponent.click();
    }

    if (close) {
      await terraStationExtension.getByTestId('CloseIcon').click();
    }
  },

  /**
   * Opens settings, selects desired option, and closes modal.
   *
   * @param {string} buttonText The name or text available on the button to click.
   * @param {boolean} initialize Whether or not to open the settings from the main page.
   * @param {boolean} close Whether or not to close out of the settings modal.
   */
  async selectSettings(buttonText, initialize = true, close = false) {
    if (initialize) {
      await terraStationExtension.getByTestId('SettingsIcon').click();
    }

    const settingsButton = await terraStationExtension.getByRole('button', {
      name: buttonText,
    });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    if (close) {
      await terraStationExtension.getByTestId('CloseIcon').click();
    }
  },

  // Runs through each of the available settings and ensures proper functionality.
  async evaluateSettings() {
    /* ---------------------------- Network Settings ---------------------------- */

    // Ensure the network settings button is visible and click.
    await this.selectSettings('Network Mainnet');

    // Change to Testnet and ensure TESTNET banner is visible.
    await this.selectSettings('Testnets', false);
    await this.expectText('TESTNET');

    // Change to Classic and ensure CLASSIC banner is visible.
    await this.selectSettings('Network Testnet');
    await this.selectSettings('Terra Classic', false);
    await this.expectText('CLASSIC');

    // Change back to Mainnet.
    await this.selectSettings('Network Classic');
    await this.selectSettings('Mainnets', false);

    /* ---------------------------- Language Settings --------------------------- */

    // Ensure the language settings button is visible and click.
    await this.selectSettings('Language English');

    // Change to Spanish and ensure Spanish receive text.
    await this.selectSettings('Español', false, true);
    await this.expectText(/Reciba/);

    // Change to Mandarin and ensure Mandarin text.
    await this.selectSettings('Idioma Español');
    await this.selectSettings('中文', false, true);
    await this.expectText('购买');

    // Change back to English.
    await this.selectSettings('语言 中文');
    await this.selectSettings('English', false, true);

    /* ---------------------------- Currency Settings --------------------------- */

    // Ensure the currency settings button is visible and click.
    await this.selectSettings('Currency USD');

    // Ensure search criteria augments component.
    await terraStationExtension.getByRole('textbox').fill('JPY');
    await this.selectSettings('¥ - Japanese Yen', false, true);
    await this.expectText('¥ 0.00');

    // Change back to USD.
    await this.selectSettings('Currency JPY');
    await terraStationExtension.getByRole('textbox').fill('USD');
    await this.selectSettings('$ - United States Dollar', false, true);
    await this.expectText('$ 0.00');

    /* ----------------------------- Theme Settings ----------------------------- */

    // Ensure the theme settings button is visible and click.
    await this.selectSettings('Theme Dark');

    // Attempt to change to all available themes.
    await this.expectText('Light', true);
    await this.expectText('Blossom', true);
    await this.expectText('Moon', true);
    await this.expectText('Whale', true);
    await this.expectText('Madness', true);

    // Change back to Dark theme and close out of settings.
    await this.expectText('Dark', true, true);

    /* ---------------------------- Advanced Settings --------------------------- */

    // Ensure the advanced settings button is visible and click.
    await this.selectSettings('Advanced');

    // Click into the LUNA asset and ensure uluna is available for copy.
    await this.expectText('Developer Mode', true, true);
    await terraStationExtension
      .getByRole('heading', { name: /^LUNA \d+$/ })
      .click();
    await this.expectText('uluna');
  },
};
