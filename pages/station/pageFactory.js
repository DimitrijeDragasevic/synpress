// Importing dependencies
const { NewWalletPage } = require('./newWalletPage');
const { SeedPage } = require('./seedPage');
const MultiSigPage = require('./multiSigPage');
const LedgerPage = require('./ledgerPage');
const HomePage = require('./homePage');
const PrivateKeyPage = require('./privateKeyPage');

/**
 * PageFactory is responsible for creating and initializing various page instances
 * based on the provided type. This acts as a centralized location for managing
 * all page initializations.
 */
class PageFactory {
  /**
   * @param {Object} browserContext - Context within which the page will operate
   */
  constructor(browserContext) {
    this.browserContext = browserContext;
  }

  /**
   * Create and initialize a page instance based on the given type
   *
   * @param {string} type - Type of the page to create. Supported values are 'newWallet', 'seed', 'multi', 'ledger', 'home', and 'privateKey'
   * @returns {Object} - Returns the initialized page instance
   * @throws {Error} - Throws an error if an unsupported page type is provided
   */
  async createPage(type) {
    switch (type) {
      case 'newWallet':
        const newWalletPage = new NewWalletPage(this.browserContext);
        await newWalletPage.initialize();
        return newWalletPage;
      case 'seed':
        const seedPage = new SeedPage(this.browserContext);
        await seedPage.initialize();
        return seedPage;
      case 'multi':
        const multisigPage = new MultiSigPage(this.browserContext);
        await multisigPage.initialize();
        return multisigPage;
      case 'ledger':
        const ledgerPage = new LedgerPage(this.browserContext);
        await ledgerPage.initialize();
        return ledgerPage;
      case 'home':
        const homePage = new HomePage(this.browserContext);
        await homePage.initialize();
        return homePage;
      case 'privateKey':
        const privateKeyPage = new PrivateKeyPage(this.browserContext);
        await privateKeyPage.initialize();
        return privateKeyPage;
      default:
        throw new Error('Invalid page type');
    }
  }
}

// Exporting the PageFactory class for external use
module.exports = PageFactory;
