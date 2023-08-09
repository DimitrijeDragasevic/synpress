const BasePage = require('./basePage');

class PrivateKeyPage extends BasePage {
    constructor(browserContext) {
        super(browserContext);
        this.page = this.createPage()
    }

    async createPage() {
        const pagePromise = this.getPageWithUrlPart('auth/import');
        await this.basePage.getByText('Import from private key').click();
        return await pagePromise;
    }
}

module.exports = PrivateKeyPage;
