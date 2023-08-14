const HomePage = require('./homePage');

const inputName = '[name="name"]';
const inputPassword = '[name="password"]';
const inputconfirmPassword = '[name="confirm"]';
const mnemonicText = '[class="TextArea_textarea__2a4Ez"]';
const checkBox = '[class="Checkbox_track__2gz9s"]';
const submitButton = '[type="submit"]';
const mnemonicNumber = '[class="Form_label__bOv6h"]';

class NewWalletPage extends HomePage {
  constructor(browserContext) {
    super(browserContext);
    this.page = null;
  }

  async initialize() {
    if (!this.homePage) {
      await this.assignStartPage();
    }
    await this.createPage();
  }

  async createPage() {
    const pagePromise = this.getPageWithUrlPart('auth/new');
    console.log("TEST")
    console.log(this.browserContext)
    await this.homePage.getByText('New wallet').click();
    this.page = await pagePromise;
  }

  async fillCreateWalletForm(walletName, password = 'Testtest123!') {
    await this.assignNewWalletPage();
    await this.page.fill(createWalletElements.inputName, walletName);
    await this.page.fill(createWalletElements.inputPassword, password);
    await this.page.fill(createWalletElements.inputconfirmPassword, password);

    const mnemonicText = await this.page.textContent(
      createWalletElements.mnemonicText,
    );
    const arrayMnemonic = mnemonicText.split(' ');
    await this.page.check(createWalletElements.checkBox);
    await this.page.click(createWalletElements.submitButton);
    await this.page.waitForURL('**/new#2');
    const firtNumberString = await this.page
      .getByText(/\b([1-9]|1[0-9]|2[0-4])\w{0,2} word\b/)
      .first()
      .textContent();
    const secondNumberString = await this.page
      .getByText(/\b([1-9]|1[0-9]|2[0-4])\w{0,2} word\b/)
      .last()
      .textContent();

    const firstNumber = this.getNFromNthWord(firtNumberString);
    const secondNumber = this.getNFromNthWord(secondNumberString);

    await this.page
      .getByRole('button', { name: arrayMnemonic[firstNumber - 1] })
      .first()
      .click();
    await this.page
      .getByRole('button', { name: arrayMnemonic[secondNumber - 1] })
      .last()
      .click();
    await this.page.click(createWalletElements.submitButton);

    await this.page.waitForURL('**/new#3');
    await expect(await this.page.getByTestId('DoneAllIcon')).toBeVisible();
    await expect(
      this.page.getByRole('button', {
        name: 'Connect',
        exact: true,
      }),
    ).toBeVisible();
    await this.page
      .getByRole('button', { name: 'Connect', exact: true })
      .click();

    await expect(
      await this.page.getByRole('button', {
        name: walletName,
      }),
    ).toBeVisible();
    await expect(await this.page.getByText('Portfolio value')).toBeVisible();
    await expect(await this.page.getByText('Send')).toBeVisible();
    await expect(await this.page.getByText('Receive')).toBeVisible();
    await expect(await this.page.getByText('Buy')).toBeVisible();
    await expect(await this.page.getByText('0').first()).toBeVisible();
    await expect(
      await this.page.getByText('.00', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      await this.page.getByText('LUNA', { exact: true }).first(),
    ).toBeVisible();
    await expect(await this.page.getByText('0').last()).toBeVisible();
    await expect(
      await this.page.getByText('.00', { exact: true }).last(),
    ).toBeVisible();
  }

  getNFromNthWord(inputString) {
    const match = inputString.match(/(\d+)\w{0,2} word/);
    return match ? parseInt(match[1]) : null;
  }
}

const createWalletElements = {
  inputName,
  inputPassword,
  inputconfirmPassword,
  mnemonicText,
  checkBox,
  submitButton,
  mnemonicNumber,
};

module.exports = {
  NewWalletPage,
  createWalletElements,
};
