const HomePage = require('./homePage');

const inputName = '[name="name"]';
const inputPassword = '[name="password"]';
const inputconfirmPassword = '[name="confirm"]';
const inputMnemonicSeed = '[name="mnemonic"]';
const inputIndex = '[name="index"]';
const submitButton = '[type="submit"]';

const allDoneIcon = '[data-testid="DoneAllIcon"]';
const connectButton = '[type="button"]';

const manageWalletsCloseButton = '[class="Modal_close__2_zHW"]';
const expect = require('@playwright/test').expect;

class SeedPage extends HomePage {
  constructor(browserContext) {
    super(browserContext);
    this.page = null;
  }

  async initialize() {
    if (!this.homePage) {
      await this.assignStartPage();
    }
    await this.createPage();
  }

  async createPage() {
    const pagePromise = this.getPageWithUrlPart('auth/recover');
    await this.homePage.getByText('Import from seed phrase').click();
    this.page = await pagePromise;
  }

  async fillSeedForm(walletName, password, seed = process.env.SEED_PHRASE) {
    await this.page.bringToFront();
    await this.page.waitForLoadState();
    await this.page.fill(inputName, walletName);
    await this.page.fill(inputPassword, password);
    await this.page.fill(inputconfirmPassword, password);
    await this.page.fill(inputMnemonicSeed, seed);
    await this.page.click(submitButton),
      await this.page.waitForURL('**/recover#3');

    await expect(await this.page.getByTestId('DoneAllIcon')).toBeVisible();
    await expect(
      this.page.getByRole('button', {
        name: 'Connect',
        exact: true,
      }),
    ).toBeVisible();
    await this.page
      .getByRole('button', { name: 'Connect', exact: true })
      .click();
  }

  async verifyFirstWalletAdded() {
    await expect(
      await this.page.getByRole('button', {
        name: 'Test wallet 1',
      }),
    ).toBeVisible();
    await this.page.getByText('Test wallet 1').click();
    await expect(await this.page.getByText('Manage Wallets')).toBeVisible();
    await expect(
      await this.page.getByRole('button', {
        name: 'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
      }),
    ).toBeVisible();
    await expect(await this.page.getByText('Add a wallet')).toBeVisible();
    await this.page.click(manageWalletsForm.manageWalletsCloseButton);
  }
}

const seedFormElements = {
  inputName,
  inputPassword,
  inputconfirmPassword,
  inputMnemonicSeed,
  inputIndex,
  submitButton,
};

const seedCompletedFormElements = {
  allDoneIcon,
  connectButton,
};

const manageWalletsForm = {
  manageWalletsCloseButton,
};

module.exports = {
  SeedPage,
  seedFormElements,
  seedCompletedFormElements,
  manageWalletsForm,
};
