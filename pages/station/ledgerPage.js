const HomePage = require('./homePage');

class LedgerPage extends HomePage {
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
    const pagePromise = this.getPageWithUrlPart('auth/ledger');
    await this.homePage.getByText('Access with ledger').click();
    this.page = await pagePromise;
  }
}

module.exports = LedgerPage;
