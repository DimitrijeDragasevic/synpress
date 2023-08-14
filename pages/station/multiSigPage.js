const HomePage = require('./homePage');

class MultiSigPage extends HomePage {
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
    const pagePromise = this.getPageWithUrlPart('auth/multisig/new');
    await this.homePage.getByText('New multisig wallet').click();
    this.page = await pagePromise;
  }

  async createMutliSigWallet(addresses, threshold) {
    await this.assignMultiSigPage();
    const DEFAULT_ADDRESS_COUNT = 3;
    const currentAddressCount = addresses.length;
    await expect(
      this.page.getByText('New multisig wallet').last(),
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="RemoveIcon"]').first(),
    ).toBeVisible();
    await expect(this.page.locator('[data-testid="AddIcon"]')).toBeVisible();

    if (currentAddressCount < DEFAULT_ADDRESS_COUNT) {
      const numberOfClicks = DEFAULT_ADDRESS_COUNT - currentAddressCount;
      for (let i = 0; i < numberOfClicks; i++) {
        await this.page.locator('[data-testid="RemoveIcon"]').first().click();
      }
    } else if (currentAddressCount > DEFAULT_ADDRESS_COUNT) {
      const numberOfClicks = currentAddressCount - DEFAULT_ADDRESS_COUNT;
      for (let i = 0; i < numberOfClicks; i++) {
        await this.page.click('[data-testid="AddIcon"]');
      }
    }

    for (let i = 0; i < currentAddressCount; i++) {
      await this.userInput(
        addresses[i],
        `[name="addresses.${i}.value"]`,
        this.page,
      );
    }

    await this.userInput(threshold, '[name="threshold"]', this.page);
    await this.userSubmit(true, this.page);
    await this.userInput('MultiSig wallet', '[name="name"]', this.page);

    await this.userSubmit(true, this.page);

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

    await this.evaluateMainPage(this.page, 'MultiSig wallet');
    return true;
  }
}

module.exports = MultiSigPage;
