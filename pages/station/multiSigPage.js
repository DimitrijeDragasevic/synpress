const HomePage = require('./homePage');
const expect = require('@playwright/test').expect;

/**
 * MultiSigPage extends HomePage and provides functionalities specific to the "MultiSig Wallet" page.
 */

class MultiSigPage extends HomePage {
  /**
   * Constructor initializes a new instance of the MultiSigPage class
   *
   * @param {Object} browserContext - The browser context in which the page operates
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
   * Navigates to the "New multisig wallet" page and sets up a page instance for it.
   */

  async createPage() {
    const pagePromise = this.getPageWithUrlPart('auth/multisig/new');
    await this.homePage.getByText('New multisig wallet').click();
    this.page = await pagePromise;
  }
  /**
   * Creates a new MultiSig Wallet with given addresses and threshold
   *
   * @param {Array} addresses - An array of addresses to be added to the multisig wallet
   * @param {number} threshold - The threshold value for the multisig wallet
   * @returns {boolean} - Returns true upon successful execution
   */
  async createMutliSigWallet(addresses, threshold) {
    const DEFAULT_ADDRESS_COUNT = 3;
    const currentAddressCount = addresses.length;
    await expect(
      this.page.getByText('New multisig wallet').last(),
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="RemoveIcon"]').first(),
    ).toBeVisible();
    await expect(this.page.locator('[data-testid="AddIcon"]')).toBeVisible();

    if (currentAddressCount < DEFAULT_ADDRESS_COUNT) {
      const numberOfClicks = DEFAULT_ADDRESS_COUNT - currentAddressCount;
      for (let i = 0; i < numberOfClicks; i++) {
        await this.page.locator('[data-testid="RemoveIcon"]').first().click();
      }
    } else if (currentAddressCount > DEFAULT_ADDRESS_COUNT) {
      const numberOfClicks = currentAddressCount - DEFAULT_ADDRESS_COUNT;
      for (let i = 0; i < numberOfClicks; i++) {
        await this.page.click('[data-testid="AddIcon"]');
      }
    }

    for (let i = 0; i < currentAddressCount; i++) {
      await this.userInput(
        addresses[i],
        `[name="addresses.${i}.value"]`,
        this.page,
      );
    }

    await this.userInput(threshold, '[name="threshold"]', this.page);
    await this.userSubmit(true, this.page);
    await this.userInput('MultiSig wallet', '[name="name"]', this.page);

    await this.userSubmit(true, this.page);

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

    await this.evaluateMainPage(this.page, 'MultiSig wallet');
    return true;
  }
}

module.exports = MultiSigPage;
