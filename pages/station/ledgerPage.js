const BasePage = require('./basePage');

class LedgerPage extends BasePage {
    constructor(browserContext) {
        super(browserContext);
        this.page = this.createPage()
    }

    async createPage() {
        const pagePromise = this.getPageWithUrlPart('auth/ledger');
        await this.basePage.getByText('Access with ledger').click();
        return await pagePromise;
    }
}

module.exports = LedgerPage;
