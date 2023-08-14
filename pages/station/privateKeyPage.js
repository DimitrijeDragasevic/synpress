const BasePage = require('./homePage');

class PrivateKeyPage extends BasePage {
  constructor(browserContext) {
    super(browserContext);
    this.page = null;
  }

  async initialize() {
    if (this.homePage == null || this.homePage == undefined) {
      await this.assignStartPage();
    }
    await this.createPage();
  }

  async createPage() {
    const pagePromise = this.getPageWithUrlPart('auth/import');
    await this.homePage.getByText('Import from private key').click();
    this.page = await pagePromise;
  }

  /**
   * Fills and submits the form to recover a wallet from a private key.
   * Validates the presence of expected elements after form submission.
   *
   * @param {string} privateKey The private key used to recover the wallet (default to process.env.PRIVATE_KEY).
   * @param {string} password The password used to secure the wallet (default to 'Testtest123!').
   */
  async fillRecoverWalletFromPrivateKeyForm(privateKey, password) {
    // Check if the text 'Import from private key' is visible on the page
    await expect(
      await this.page.getByText('Import from private key'),
    ).toBeVisible();

    // Fill in the private key
    await this.userInput(privateKey, 'textarea[name="key"]', this.page);

    // Fill in the password
    await this.userInput(password, 'input[name="password"]', this.page);
  }

  async verifyWrongPrivateKeyMessage() {
    await expect(await this.page.getByText('Invalid')).toBeVisible();
    await this.page.getByText('Submit').isDisabled();
  }

  async verifyWrongPassword() {
    await this.page.getByText('Submit').click();
    await expect(await this.page.getByText('Incorrect password')).toBeVisible();
  }
}

module.exports = PrivateKeyPage;
