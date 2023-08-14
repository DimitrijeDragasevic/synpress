const HomePage = require('./homePage');

/**
 * Represents the LedgerPage, a specialized type of HomePage where users can access using a ledger.
 * It provides functionalities to initialize and navigate to the ledger access page.
 */

class LedgerPage extends HomePage {
  /**
   * Constructor initializes a new instance of the LedgerPage class.
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
   * Creates or navigates to the ledger access page.
   * It waits for the appearance of a specific URL part to detect the ledger page,
   * and once the URL is detected, assigns that page to `this.page`.
   */
  async createPage() {
    const pagePromise = this.getPageWithUrlPart('auth/ledger');
    await this.homePage.getByText('Access with ledger').click();
    this.page = await pagePromise;
  }
}

module.exports = LedgerPage;
