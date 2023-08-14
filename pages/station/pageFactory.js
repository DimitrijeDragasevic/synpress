const { NewWalletPage } = require('./newWalletPage');
const { SeedPage } = require('./seedPage');
const MultiSigPage = require('./multiSigPage');
const LedgerPage = require('./ledgerPage');
const HomePage = require('./homePage');

class PageFactory {
  constructor(browserContext) {
    this.browserContext = browserContext;
  }

  async createPage(type) {
    switch (type) {
      case 'newWallet':
        const newWalletPage = new NewWalletPage(this.browserContext);
        newWalletPage.initialize();
        return newWalletPage;
      case 'seed':
        const seedPage = new SeedPage(this.browserContext);
        await seedPage.initialize();
        return seedPage;
      case 'multi':
        const multisigPage = new MultiSigPage(this.browserContext);
        multisigPage.initialize();
        return multisigPage;
      case 'ledger':
        const ledgerPage = new LedgerPage(this.browserContext);
        ledgerPage.initialize();
        return ledgerPage;
      case 'home':
        const homePage = new HomePage(this.browserContext);
        await homePage.initialize();
        return homePage;
      default:
        throw new Error('Invalid page type');
    }
  }
}

module.exports = PageFactory;
