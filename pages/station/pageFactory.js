const {NewWalletPage} = require("./newWalletPage");
const {SeedPage} = require("./seed-page");
const MultiSigPage = require("./multiSigPage");
const LedgerPage = require("./ledgerPage");

class PageFactory {
    constructor(browserContext) {
        this.browserContext = browserContext;
    }

   async  createPage(type) {
        switch (type) {
            case "newWallet":
                const newWalletPage = new NewWalletPage(this.browserContext);
                newWalletPage.initialize();
                return newWalletPage;
            case "seed":
                const seedPage = new SeedPage(this.browserContext)
                await seedPage.initialize();
                return seedPage;
            case "multi":
                return new MultiSigPage(this.browserContext);
            case "ledger":
                return new LedgerPage(this.browserContext);
            default:
                throw new Error("Invalid page type");
        }
    }
}

module.exports = PageFactory;
