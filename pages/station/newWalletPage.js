const BasePage = require('./basePage');

const inputName = '[name="name"]'
const inputPassword = '[name="password"]'
const inputconfirmPassword = '[name="confirm"]'
const mnemonicText = '[class="TextArea_textarea__2a4Ez"]'
const checkBox = '[class="Checkbox_track__2gz9s"]'
const submitButton = '[type="submit"]'
const mnemonicNumber = '[class="Form_label__bOv6h"]'

class NewWalletPage extends BasePage {
    constructor(browserContext) {
        super(browserContext);
        this.page = this.createPage()
    }

    async createPage() {
        const pagePromise = this.getPageWithUrlPart('auth/new');
        await this.basePage.getByText('New wallet').click();
        return await pagePromise;
    }
}

const createWalletElements = {
    inputName,
    inputPassword,
    inputconfirmPassword,
    mnemonicText,
    checkBox,
    submitButton,
    mnemonicNumber
}

module.exports = {
    NewWalletPage,
    createWalletElements
};
