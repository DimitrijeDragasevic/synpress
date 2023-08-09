const BasePage = require('./basePage');

class MultiSigPage extends BasePage {
    constructor(browserContext) {
        super(browserContext);
        this.page = this.createPage()
    }

    async createPage() {
        const pagePromise = this.getPageWithUrlPart('auth/multisig/new');
        await this.basePage.getByText('New multisig wallet').click();
        return await pagePromise;
    }
}

module.exports = MultiSigPage;
