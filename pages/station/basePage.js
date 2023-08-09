class BasePage {
    constructor(browserContext) {
        this.browserContext = browserContext
        this.browserContext;
        this.basePage = null
        
    }

    async assignStartPage() {
        
        let stationExtensionUrl;
        let serviceWorkers = await this.browserContext.serviceWorkers();

        for (let worker of serviceWorkers) {
            const url = worker._initializer.url;
            if (url.includes('background.js')) {
                stationExtensionUrl = url.replace('background.js', 'index.html#/');
                break;
            }
        }

        const blankPage = await this.browserContext.newPage();
        await blankPage.goto(stationExtensionUrl);

        let pages = await this.browserContext.pages();
        pages.forEach(page => {
            if (page.url().includes('index.html')) {
                this.basePage = page;
            }
        });
    }

    async getPageWithUrlPart(urlPart) {
        return new Promise(resolve => {
            this.browserContext.on('page', newPage => {
                newPage.url().includes(urlPart) && resolve(newPage);
            });
        });
    }
}

module.exports = BasePage;
