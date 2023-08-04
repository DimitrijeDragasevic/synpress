const log = require('debug')('synpress:playwright');
const fetch = require('node-fetch');

const {
  seedFormElements,
  seedCompletedFormElements,
  manageWalletsForm,
} = require('../pages/station/seed-page');

const { createWalletElements } = require('../pages/station/create-wallet-page');

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
    if (stationExtension) {
      console.log("stationExtension already assigned.");
      return; // Exit the function if stationExtension already has a value
    }
  
    let isUrlFoundInPages = false;
    const pages = await browser.contexts()[0].pages();
    for (const page of pages) {
      if (page.url().includes(stationExtensionUrl)) {
        isUrlFoundInPages = true;
        break;
      }
    }
  
    if (!isUrlFoundInPages) {
      const blankPage = await browser.contexts()[0].newPage();
      await blankPage.goto(stationExtensionUrl);
      stationExtension = blankPage;
      console.log("Assigned stationExtension.");
    } else {
      console.log("Page with stationExtensionUrl already exists.");
    }
  },
  

  async waitForNewPageWithUrlPart(urlPart) {
    return new Promise(resolve => {
      browser.contexts()[0].once('page', newPage => {
        if (newPage.url().includes(urlPart)) {
          resolve(newPage);
        }
      });
    });
  },
  async assignPage(urlPart, buttonText) {
    const context = browser.contexts()[0];
    const pages = await context.pages();
    for (const page of pages) {
      if (page.url().includes(urlPart)) {
        await page.reload();
        return page;
      }
    }
  
    const pagePromise = this.waitForNewPageWithUrlPart(urlPart);
    await stationExtension.getByText(buttonText).click();
    const pageVar = await pagePromise;
    await pageVar.reload();
    return pageVar;
  },
  
  async assignNewWalletPage() {
    stationExtensionNewWallet = await this.assignPage('auth/new', 'New wallet');
  },
  
  async assignSeedPage() {
    stationExtensionSeed = await this.assignPage('auth/recover', 'Import from seed phrase');
  },
  
  async  assignPrivateKeyPage() {
    stationExtensionPrivateKey = await this.assignPage('auth/import', 'Import from private key');
  },
  
  async  assignMultiSigPage() {
    stationExtensionMultiSig = await this.assignPage('auth/multisig/new', 'New multisig wallet');
  },
  
  async  assignLedgerPage() {
    stationExtensionLedger = await this.assignPage('auth/ledger', 'Access with ledger');
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

  async checkIfWalletSetup() {
     return await expect(await stationExtensionSeed.getByTestId('manage-wallets-button')).toBeVisible();  
  },

  async fillSeedForm(walletName, password, seed = process.env.SEED_PHRASE) {
    // const button = await stationExtensionSeed.$('button:text("Test wallet 1")');
    // console.log(button)
    // if (button) {
    //   return;
    // } 
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

  async close() {
    let pages = await browser.contexts()[0].pages();
    pages.forEach(page => {
      if (page.url().includes('runner')) {
        return;
      }
      page.close();
    });
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
   * @param {boolean} enabled Whether or not the Submit button is expected
   * to be enabled.
   */
  async userSubmit(enabled = true) {
    const submitButton = await stationExtension.getByRole('button', {
      name: 'Submit',
    });

    if (enabled) {
      await submitButton.click();
    } else {
      await expect(submitButton).toHaveAttribute('disabled', '');
    }
  },

  /**
   * A function to expect and click a button if specified to test functionality.
   *
   * @param {string} buttonText The name, text, asset, or test ID associated with
   * the button.
   * @param {string} type The type of buttonText supplied to the function.
   * @param {string} role The role of the button element (button, link, etc.).
   * @param {boolean} click Whether or not to click the button.
   */
  async expectButton(buttonText, type, role = 'button', click = true) {
    // Assign button using buttonText based on type supplied.
    let button;
    if (type === 'name') {
      button = await stationExtension.getByRole(role, { name: buttonText });
    } else if (type === 'id') {
      button = await stationExtension.getByTestId(buttonText);
    } else if (type === 'element') {
      button = await stationExtension
        .locator('div')
        .filter({ hasText: buttonText })
        .getByRole(role);
    } else if (type === 'asset') {
      button = await stationExtension
        .getByRole('listitem')
        .filter({
          hasText: new RegExp(`^${buttonText}`),
        })
        .getByRole(role);
    }

    await expect(button).toBeVisible();

    if (click) {
      await button.click();
    }
  },

  /**
   * Ensures text is in document, clicks text option, and closes modal.
   *
   * @param {string} text The text to find in the document.
   * @param {boolean} click Whether or not to click the text option.
   * @param {boolean} close Whether or not to close out of the settings modal.
   * @param {boolean} heading Whether or not the text has a heading role.
   */
  async expectText(text, click = false, close = false, heading = false) {
    let textComponent;
    if (heading) {
      textComponent = await stationExtension
        .getByRole('heading', {
          name: text,
        })
        .first();
    } else {
      textComponent = await stationExtension
        .getByText(text, {
          exact: true,
        })
        .first();
    }

    await expect(textComponent).toBeVisible();

    if (click) {
      await textComponent.click();
    }

    if (close) {
      await this.expectButton('CloseIcon', 'id');
    }
  },

  /* -------------------------------------------------------------------------- */
  /*                                  Main Page                                 */
  /* -------------------------------------------------------------------------- */

  // Ensures main page is loaded with all relevant elements.
  async evaluateMainPage() {
    /* --------------------------------- Buttons -------------------------------- */

    const buttons = {
      walletButton: {
        buttonText: 'Test wallet 1',
        type: 'name',
      },
      settingsButton: {
        buttonText: 'SettingsIcon',
        type: 'id',
      },
      sendButton: {
        buttonText: /^Send$/,
        type: 'element',
      },
      receiveButton: {
        buttonText: /^Receive$/,
        type: 'element',
      },
      buyButton: {
        buttonText: /^Buy$/,
        type: 'element',
      },
      manageButton: {
        buttonText: 'Manage',
        type: 'name',
      },
    };

    for (const button in buttons) {
      const attributes = buttons[button];
      await this.expectButton(
        attributes.buttonText,
        attributes.type,
        'button',
        false,
      );
    }

    /* ------------------------------ Text Elements ----------------------------- */

    for (const text of [
      'Portfolio value',
      /\$ [\d]{1,5}\.[\d]{2}/,
      'Send',
      'Receive',
      'Buy',
      'Assets',
    ]) {
      await this.expectText(text);
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
      await this.expectButton('SettingsIcon', 'id');
    }

    await this.expectButton(buttonText, 'name');

    if (close) {
      await this.expectButton('CloseIcon', 'id');
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
    await this.expectText('Reciba');

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
    await this.expectText('¥ —');

    // Change back to USD.
    await this.selectSettings('Currency JPY');
    await this.userInput('USD');
    await this.selectSettings('$ - United States Dollar', false, true);
    await this.expectText('$ —');

    /* ----------------------------- Theme Settings ----------------------------- */

    // Ensure the theme settings button is visible and click.
    await this.selectSettings('Theme Dark');

    // Attempt to change to all available themes.
    for (const theme of ['Blossom', 'Light', 'Madness', 'Moon', 'Whale']) {
      await this.expectText(theme, true);
    }

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
      await this.expectButton('Test wallet 1', 'name');
      await this.expectButton(
        'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
        'name',
      );
    }

    await this.expectButton(linkText, 'name', role);
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
    await this.expectButton('Confirm', 'name');

    /* ------------------------------- Lock Wallet ------------------------------ */

    // Ensure the Lock wallet button is visible and click.
    await this.selectManage('Lock', true, 'button');

    // Expect submit to be disabled if user enters wrong password.
    await this.selectManage('Test wallet 1', false);
    await this.userInput('wrong password');
    await this.userSubmit(false);

    // Ensure user can unlock wallet with new password.
    await this.userInput('newpassword');
    await this.userSubmit();

    /* ------------------------------ Delete Wallet ----------------------------- */

    // Ensure the Delete wallet link is visible and click.
    await this.selectManage('Delete wallet');

    // Expect submit to be disabled upon wrong wallet name input.
    await this.userInput('Wrong name 1');
    await this.userSubmit(false);

    // Expect user to be able to delete wallet when correct wallet name inputted.
    await this.userInput('Test wallet 1');
    await this.userSubmit();
    await this.expectButton('Confirm', 'name');
    await this.expectText('Connect to Station');
  },

  /* -------------------------------------------------------------------------- */
  /*                                Manage Assets                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Opens asset management modal, clicks desired filter, and evaluates resulting
   * asset list.
   *
   * @param {string} filter The asset management filter to click.
   * @param {string} filteredAsset The asset which is expected to be filtered out
   * of the asset list after applying the filter.
   */
  async evaluateFilter(filter, filteredAsset) {
    // Evaluate checking and unchecking the filter.
    for (const action of ['check', 'uncheck']) {
      // Open the asset management modal.
      await this.expectButton('Manage', 'name');

      if (
        filter === 'Hide non-whitelisted' &&
        stationExtension.isVisible(`text='${filteredAsset}'`)
      ) {
        // Evaluate if Hide non-whitelisted filter filters specified asset.
        await this.expectText(filter, true, true);
        const nonWhitelistedToken = await stationExtension
          .getByText(filteredAsset)
          .first();
        if (action === 'check') {
          await expect(nonWhitelistedToken).toBeVisible();
        } else {
          await expect(nonWhitelistedToken).not.toBeVisible();
        }
      } else if (
        filter === 'Hide low-balance' &&
        stationExtension.isVisible(`text='${filteredAsset}'`)
      ) {
        // Evaluate if Hide low-balance filter filters specified asset.
        await this.expectText(filter, true, true);
        const lowBalanceToken = await stationExtension
          .getByText(filteredAsset)
          .first();
        if (action === 'check') {
          await expect(lowBalanceToken).toBeVisible();
        } else {
          await expect(lowBalanceToken).not.toBeVisible();
        }
      }
    }
  },

  /**
   * Opens asset management settings, clicks desired asset, and evaluates
   * resulting asset list.
   *
   * @param {string} asset The symbol of an asset unavailable in the active
   * wallet to include in the asset list.
   */
  async evaluateAsset(asset) {
    // Evaluate checking and unchecking the asset.
    for (const action of ['check', 'uncheck']) {
      // Open the asset management modal.
      await this.expectButton('Manage', 'name');

      // Click asset and close out of asset management modal.
      await this.userInput(asset);
      await this.expectButton(asset, 'asset');
      await this.expectButton('CloseIcon', 'id');

      // Evaluate if asset is properly added or removed from the asset list.
      const assetItem = await stationExtension.getByRole('article').filter({
        hasText: new RegExp(`^${asset}.*?${asset}$`),
      });
      if (action === 'check') {
        await expect(assetItem).toBeVisible();
      } else {
        await expect(assetItem).not.toBeVisible();
      }
    }
  },

  // Evaluates manage assets actions and ensures proper functionality.
  async evaluateManageAssets() {
    /* --------------------------- Add / Remove Assets -------------------------- */

    const unavailableAssets = ['AKT', 'BNB', 'DOT'];
    // Evaluate selection of unavailable assets in manage assets.
    for (const unavailableAsset of unavailableAssets) {
      await this.evaluateAsset(unavailableAsset);
    }

    /* ------------------------------ Apply Filters ----------------------------- */

    // Evaluate the application of asset management filters.
    await this.evaluateFilter('Hide non-whitelisted', 'ATOM-OSMO LP');
    await this.evaluateFilter('Hide low-balance', 'axlUSDT');
  },
};
