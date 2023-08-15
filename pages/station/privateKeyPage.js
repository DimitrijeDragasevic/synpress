const BasePage = require('./homePage');
const expect = require('@playwright/test').expect;

/**
 * PrivateKeyPage extends BasePage and offers functionality to manage and interact with the "Import from private key" page.
 */

class PrivateKeyPage extends BasePage {
  /**
   * Constructor initializes a new instance of the PrivateKeyPage class.
   *
   * @param {Object} browserContext - The browser context in which the page operates.
   */
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

  /**
   * Navigates to the "Import from private key" page and sets up the page instance for it.
   */
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

  async submitAndVerifyHomeScreen() {
    // Check if the Submit button is enabled and click it
    await this.page.getByText('Submit').isEnabled();
    await this.page.getByText('Submit').click();

    // Check if the text for various wallet features are visible on the page
    await expect(await this.page.getByText('Portfolio value')).toBeVisible();
    await expect(await this.page.getByText('Send')).toBeVisible();
    await expect(await this.page.getByText('Receive')).toBeVisible();
    await expect(await this.page.getByText('Buy')).toBeVisible();

    // Verify that the specific asset 'LUNA' is visible
    await expect(
      await this.page.getByText('LUNA', { exact: true }).first(),
    ).toBeVisible();
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
