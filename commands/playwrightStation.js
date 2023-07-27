const log = require('debug')('synpress:playwright');
const fetch = require('node-fetch');

const {
  seedFormElements,
  seedCompletedFormElements,
  manageWalletsForm,
} = require('../pages/station/seed-page');

const expect = require('@playwright/test').expect;

let browser;
let mainWindow;
let stationExtension;
let stationExtensionNewWallet;
let stationExtensionSeed;
let stationExtensionPrivateKey;
let stationExtensionMultiSig;
let stationExtensionLedger;
let activeTabName;

module.exports = {
  browser() {
    return browser;
  },
  mainWindow() {
    return mainWindow;
  },
  stationExtension() {
    return stationExtension;
  },
  stationExtensionNewWallet() {
    return stationExtensionNewWallet;
  },
  stationExtensionSeed() {
    return stationExtensionSeed;
  },
  stationExtensionPrivateKey() {
    return stationExtensionPrivateKey;
  },
  stationExtensionMultiSig() {
    return stationExtensionMultiSig;
  },
  stationExtensionLedger() {
    return stationExtensionLedger;
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
    let stationExtensionUrl;
    let serviceWorkers = await browser.contexts()[0].serviceWorkers();
    for (let worker of serviceWorkers) {
      const url = worker._initializer.url;

      // Check if the URL contains 'background.js'
      if (url.includes('background.js')) {
        stationExtensionUrl = url.replace('background.js', 'index.html#/');
        break; // Exit the loop once the correct service worker is found
      }
    }

    const blankPage = await browser.contexts()[0].newPage();
    await blankPage.goto(stationExtensionUrl);
    let pages = await browser.contexts()[0].pages();
    pages.forEach(page => {
      if (page.url().includes('index.html')) {
        stationExtension = page;
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
    await stationExtension.getByText('New wallet').click();
    stationExtensionNewWallet = await newWalletPagePromise;
  },
  async assignSeedPage() {
    const seedPagePromise = this.waitForNewPageWithUrlPart('auth/recover');
    await stationExtension.getByText('Import from seed phrase').click();
    stationExtensionSeed = await seedPagePromise;
  },
  async assignPrivateKeyPage() {
    const privateKeyPagePromise = this.waitForNewPageWithUrlPart('auth/import');
    await stationExtension.getByText('Import from private key').click();
    stationExtensionPrivateKey = await privateKeyPagePromise;
  },
  async assignMultiSigPage() {
    const multisigWalletPagePromise =
      this.waitForNewPageWithUrlPart('auth/multisig/new');
    await stationExtension.getByText('New multisig wallet').click();
    stationExtensionMultiSig = await multisigWalletPagePromise;
  },
  async assignLedgerPage() {
    const ledgerPagePromise = this.waitForNewPageWithUrlPart('auth/ledger');
    await stationExtension.getByText('Access with ledger').click();
    stationExtensionLedger = await ledgerPagePromise;
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
  async switchToStationWindow() {
    await stationExtension.bringToFront();
    await module.exports.assignActiveTabName('station');
    return true;
  },
  async bringToFrontAndReload(page) {
    page.bringToFront();
    page.reload();
  },

  async setupQaWalletAndVerify() {
    await this.fillSeedForm('Test wallet 1', 'Testtest123!');
    await this.bringToFrontAndReload(stationExtension);
    await this.verifyFirstWalletAdded();
  },
  async fillSeedForm(walletName, password, seed = process.env.SEED_PHRASE) {
    await stationExtensionSeed.bringToFront();
    await stationExtensionSeed.waitForLoadState();
    await stationExtensionSeed.fill(seedFormElements.inputName, walletName);
    await stationExtensionSeed.fill(seedFormElements.inputPassword, password);
    await stationExtensionSeed.fill(
      seedFormElements.inputconfirmPassword,
      password,
    );
    await stationExtensionSeed.fill(seedFormElements.inputMnemonicSeed, seed);
    await stationExtensionSeed.click(seedFormElements.submitButton),
      await stationExtensionSeed.waitForURL('**/recover#3');

    expect(await stationExtensionSeed.getByTestId('DoneAllIcon')).toBeVisible();
    expect(
      stationExtensionSeed.getByRole('button', {
        name: 'Connect',
        exact: true,
      }),
    ).toBeVisible();
    await stationExtensionSeed
      .getByRole('button', { name: 'Connect', exact: true })
      .click();
  },

  async verifyFirstWalletAdded() {
    expect(
      await stationExtension.getByRole('button', {
        name: 'Test wallet 1',
      }),
    ).toBeVisible();
    await stationExtension.getByText('Test wallet 1').click();
    expect(await stationExtension.getByText('Manage Wallets')).toBeVisible();
    expect(
      await stationExtension.getByRole('button', {
        name: 'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
      }),
    ).toBeVisible();
    expect(await stationExtension.getByText('Add a wallet')).toBeVisible();
    await stationExtension.click(manageWalletsForm.manageWalletsCloseButton);
  },

  async goToManageWalletsMenuFromHome() {
    await stationExtension
      .getByRole('button', { name: 'Test wallet 1' })
      .click();
    expect(await stationExtension.getByText('Manage Wallets')).toBeVisible();
    expect(
      await stationExtension.getByRole('button', {
        name: 'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
      }),
    );
    await stationExtension
      .getByRole('button', { name: 'Add a wallet' })
      .click();
  },

  async verifyElementsManageWalletsForm() {
    expect(await stationExtension.getByText('Manage Wallets')).toBeVisible();
    await expect(
      await this.getButtonByText(stationExtension, 'New wallet'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(stationExtension, 'Import from seed phrase'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(stationExtension, 'Import from private key'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(stationExtension, 'New multisig wallet'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(stationExtension, 'Access with ledger'),
    ).toBeVisible();
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
  /*                              Utility Functions                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Mimics a user typing text into a text box.
   *
   * @param {string} text The text to input inside of the desired text box.
   * @param {string} xpath The xpath which corresponds to the desired text box.
   */
  async userInput(text, xpath = '') {
    if (xpath) {
      await stationExtension.locator(xpath).fill(text);
    } else {
      await stationExtension.getByRole('textbox').fill(text);
    }
  },

  /**
   * Mimics a user submitting a transaction.
   *
   * @param {string} buttonText The text displayed on the transaction confirmation
   * button.
   * @param {boolean} expectDisabled Whether or not the Submit button is expected
   * to be disabled.
   */
  async userSubmit(buttonText = 'Submit', expectDisabled = false) {
    const submitButton = await stationExtension.getByRole('button', {
      name: buttonText,
    });

    if (expectDisabled) {
      await expect(submitButton).toHaveAttribute('disabled', '');
    } else {
      await submitButton.click();
    }
  },

  /**
   * Ensures text is in document, clicks text option, and closes modal.
   *
   * @param {string} text The text to find in the document.
   * @param {boolean} click Whether or not to click the text option.
   * @param {boolean} close Whether or not to close out of the settings modal.
   */
  async expectText(text, click = false, close = false, heading = false) {
    let textComponent;
    if (heading) {
      textComponent = await stationExtension.getByRole('heading', {
        name: text,
      });
    } else {
      textComponent = await stationExtension.getByText(text, {
        exact: true,
      });
    }

    await expect(textComponent).toBeVisible();

    if (click) {
      await textComponent.click();
    }

    if (close) {
      await stationExtension.getByTestId('CloseIcon').click();
    }
  },

  /* -------------------------------------------------------------------------- */
  /*                                  Settings                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Opens settings, selects desired option, and closes modal.
   *
   * @param {string} buttonText The name or text available on the button to click.
   * @param {boolean} initialize Whether or not to open the settings from the main page.
   * @param {boolean} close Whether or not to close out of the settings modal.
   */
  async selectSettings(buttonText, initialize = true, close = false) {
    if (initialize) {
      await stationExtension.getByTestId('SettingsIcon').click();
    }

    const settingsButton = await stationExtension.getByRole('button', {
      name: buttonText,
    });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    if (close) {
      await stationExtension.getByTestId('CloseIcon').click();
    }
  },

  // Evaluates settings and ensures proper functionality.
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

    // Change to Spanish and ensure Spanish translated receive text.
    await this.selectSettings('Español', false, true);
    await this.expectText(/Reciba/);

    // Change to Mandarin and ensure Mandarin translated buy text.
    await this.selectSettings('Idioma Español');
    await this.selectSettings('中文', false, true);
    await this.expectText('购买');

    // Change back to English.
    await this.selectSettings('语言 中文');
    await this.selectSettings('English', false, true);

    /* ---------------------------- Currency Settings --------------------------- */

    // Ensure the currency settings button is visible and click.
    await this.selectSettings('Currency USD');

    // Ensure search and select functionality.
    await this.userInput('JPY');
    await this.selectSettings('¥ - Japanese Yen', false, true);
    await this.expectText('¥ 0.00');

    // Change back to USD.
    await this.selectSettings('Currency JPY');
    await this.userInput('USD');
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
    await this.expectText(/^LUNA \d+$/, true, false, true);
    await this.expectText('uluna');
  },

  /* -------------------------------------------------------------------------- */
  /*                                Manage Wallet                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Opens manage wallet settings and selects desired option.
   *
   * @param {string} linkText The name or text available on the manage wallet link
   * to click.
   * @param {boolean} initialize Whether or not to open the manage wallet settings
   * from the main page.
   * @param {string} role The role of the component.
   */
  async selectManage(linkText, initialize = true, role = 'link') {
    if (initialize) {
      await stationExtension
        .getByRole('button', {
          name: 'Test wallet 1',
        })
        .click();
      await stationExtension
        .getByRole('button', {
          name: 'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
        })
        .click();
    }

    const manageLink = await stationExtension.getByRole(role, {
      name: linkText,
    });
    await expect(manageLink).toBeVisible();
    await manageLink.click();
  },

  // Evaluates manage wallet options and ensures proper functionality.
  async evaluateManageWallet() {
    /* ------------------------------ Export Wallet ----------------------------- */

    // Ensure the Export wallet link is visible and click.
    await this.selectManage('Export wallet');

    // Ensure error upon incorrect password entry.
    await this.userInput('wrong password');
    await this.expectText('Incorrect password');

    // Ensure correct password entry results in QR code display.
    await this.userInput('Testtest123!');
    await this.userSubmit();
    await this.expectText('QR code', false, true, true);

    // Evaluate Private key functionality.
    await this.expectText('Private key', true);

    // Ensure correct password entry results in private key display.
    await this.userInput('Testtest123!');
    await this.userSubmit();
    await this.expectText('Private Key', false, true, true);

    /* ----------------------------- Change Password ---------------------------- */

    // Ensure the Change password link is visible and click.
    await this.selectManage('Change password');

    // Ensure incorrect password error if wrong password entered.
    await this.userInput('wrong password', 'input[name="current"]');
    await this.expectText('Incorrect password');

    // Ensure short password error if not longer than 10 chars.
    await this.userInput('new', 'input[name="password"]');
    await this.expectText('Password must be longer than 10 characters');

    // Ensure password match error when new passwords mismatch.
    await this.userInput('newpassword', 'input[name="password"]');
    await this.userInput('newpass', 'input[name="confirm"]');
    await this.expectText('Password does not match');

    // Allow password change if all criteria pass.
    await this.userInput('Testtest123!', 'input[name="current"]');
    await this.userInput('newpassword', 'input[name="password"]');
    await this.userInput('newpassword', 'input[name="confirm"]');
    await this.userSubmit();
    await this.userSubmit('Confirm');

    /* ------------------------------- Lock Wallet ------------------------------ */

    // Ensure the Lock wallet button is visible and click.
    await this.selectManage('Lock', true, 'button');

    // Expect submit to be disabled if user enters wrong password.
    await this.selectManage('Test wallet 1', false);
    await this.userInput('wrong password');
    await this.userSubmit('Submit', true);

    // Ensure user can unlock wallet with new password.
    await this.userInput('newpassword');
    await this.userSubmit();

    /* ------------------------------ Delete Wallet ----------------------------- */

    // Ensure the Delete wallet link is visible and click.
    await this.selectManage('Delete wallet');

    // Expect submit to be disabled upon wrong wallet name input.
    await this.userInput('Wrong name 1');
    await this.userSubmit('Submit', true);

    // Expect user to be able to delete wallet when correct wallet name inputted.
    await this.userInput('Test wallet 1');
    await this.userSubmit();
    await this.userSubmit('Confirm');
    await this.expectText('Connect to Station');
  },

  async getButtonByText(page, text) {
    return await page.getByRole('button', { name: text, exact: true });
  },

  async fillCreateWalletForm(walletName, password = 'Testtest123!') {
    await this.assignNewWalletPage();
    await stationExtensionNewWallet.fill(
      createWalletElements.inputName,
      walletName,
    );
    await stationExtensionNewWallet.fill(
      createWalletElements.inputPassword,
      password,
    );
    await stationExtensionNewWallet.fill(
      createWalletElements.inputconfirmPassword,
      password,
    );

    const mnemonicText = await stationExtensionNewWallet.textContent(
      createWalletElements.mnemonicText,
    );
    const arrayMnemonic = mnemonicText.split(' ');
    await stationExtensionNewWallet.check(createWalletElements.checkBox);
    await stationExtensionNewWallet.click(createWalletElements.submitButton);
    await stationExtensionNewWallet.waitForURL('**/new#2');
    const firtNumberString = await stationExtensionNewWallet
      .getByText(/\b([1-9]|1[0-9]|2[0-4])\w{0,2} word\b/)
      .first()
      .textContent();
    const secondNumberString = await stationExtensionNewWallet
      .getByText(/\b([1-9]|1[0-9]|2[0-4])\w{0,2} word\b/)
      .last()
      .textContent();

    const firstNumber = this.getNFromNthWord(firtNumberString);
    const secondNumber = this.getNFromNthWord(secondNumberString);

    await stationExtensionNewWallet
      .getByRole('button', { name: arrayMnemonic[firstNumber - 1] })
      .first()
      .click();
    await stationExtensionNewWallet
      .getByRole('button', { name: arrayMnemonic[secondNumber - 1] })
      .last()
      .click();
    await stationExtensionNewWallet.click(createWalletElements.submitButton);

    await stationExtensionNewWallet.waitForURL('**/new#3');
    expect(
      await stationExtensionNewWallet.getByTestId('DoneAllIcon'),
    ).toBeVisible();
    expect(
      stationExtensionNewWallet.getByRole('button', {
        name: 'Connect',
        exact: true,
      }),
    ).toBeVisible();
    await stationExtensionNewWallet
      .getByRole('button', { name: 'Connect', exact: true })
      .click();

    expect(
      await stationExtensionNewWallet.getByRole('button', {
        name: walletName,
      }),
    ).toBeVisible();
    expect(
      await stationExtensionNewWallet.getByText('Portfolio value'),
    ).toBeVisible();
    expect(await stationExtensionNewWallet.getByText('Send')).toBeVisible();
    expect(await stationExtensionNewWallet.getByText('Receive')).toBeVisible();
    expect(await stationExtensionNewWallet.getByText('Buy')).toBeVisible();
    expect(
      await stationExtensionNewWallet.getByText('0').first(),
    ).toBeVisible();
    expect(
      await stationExtensionNewWallet.getByText('.00', { exact: true }).first(),
    ).toBeVisible();
    expect(
      await stationExtensionNewWallet
        .getByText('LUNA', { exact: true })
        .first(),
    ).toBeVisible();
    expect(await stationExtensionNewWallet.getByText('0').last()).toBeVisible();
    expect(
      await stationExtensionNewWallet.getByText('.00', { exact: true }).last(),
    ).toBeVisible();
  },

  getNFromNthWord(inputString) {
    const match = inputString.match(/(\d+)\w{0,2} word/);
    return match ? parseInt(match[1]) : null;
  },

  async fillImportFromSeedPhraseForm(
    walletName,
    password,
    seed = process.env.SEED_PHRASE_TWO,
  ) {
    await this.assignSeedPage();
    await this.fillSeedForm(walletName, password, seed);
  },
};
