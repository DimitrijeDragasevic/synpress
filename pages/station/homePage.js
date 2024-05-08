const expect = require('@playwright/test').expect;

/**
 * Represents the HomePage, which serves as the main landing page for users.
 * It provides functionalities to initialize, assign, and interact with the home page.
 */
class HomePage {
  /**
   * Constructor initializes a new instance of the HomePage class.
   * @param {Object} browserContext - The browser context in which the page operates.
   */
  constructor(browserContext) {
    this.browserContext = browserContext;
    this.homePage = null;
  }

  async initialize() {
    await this.assignStartPage();
  }

  /**
   * Detects or sets up the station extension home page.
   * It searches for existing pages within the browser context that match the expected URL.
   * If none is found, it creates a new home page by navigating to the station extension URL.
   */
  async assignStartPage() {
    let stationExtensionUrl;
    let serviceWorkers = await this.browserContext.serviceWorkers();

    // Iterate over the service workers to find the station extension URL
    for (let worker of serviceWorkers) {
      const url = worker._initializer.url;
      if (url.includes('background.js')) {
        stationExtensionUrl = url.replace('background.js', 'index.html#/');
        break;
      }
    }
    let pages = await this.browserContext.pages();

    // Iterate over the existing pages to see if the home page already exists
    for (let page of pages) {
      if (page.url().includes('index.html')) {
        console.log('This page already exists in the browser context');
        console.log('Reassigning');
        this.homePage = page;
        return; // HomePage exists, so exit the function early.
      }
    }
    // If we reach here, it means homePage doesn't exist. So, create it.
    console.log('Creating new home page');
    const blankPage = await this.browserContext.newPage();
    await blankPage.goto(stationExtensionUrl);
    this.homePage = blankPage;
  }

  /**
   * Listens for a new page with a specific URL part to be opened within the browser context.
   * Once such a page is detected, it resolves the promise with that page.
   * @param {string} urlPart - The URL substring to look for when a new page is opened.
   * @returns {Promise} - Resolves with the detected page that contains the specified URL part.
   */
  async getPageWithUrlPart(urlPart) {
    return new Promise(resolve => {
      this.browserContext.on('page', newPage => {
        newPage.url().includes(urlPart) && resolve(newPage);
      });
    });
  }

  async getButtonByText(page, text) {
    return await page.getByRole('button', { name: text, exact: true });
  }

  async verifyElementsManageWalletsForm() {
    await expect(await this.homePage.getByText('Manage Wallets')).toBeVisible();
    await expect(
      await this.getButtonByText(this.homePage, 'New wallet'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(this.homePage, 'Import from seed phrase'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(this.homePage, 'Import from private key'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(this.homePage, 'New multisig wallet'),
    ).toBeVisible();
    await expect(
      await this.getButtonByText(this.homePage, 'Access with ledger'),
    ).toBeVisible();
  }

  async goToManageWalletsMenuFromHome() {
    await this.homePage.bringToFront();
    await this.homePage.reload();
    await this.expectButton('Test wallet 1', 'name');
    await expect(await this.homePage.getByText('Manage Wallets')).toBeVisible();
    await this.homePage.getByRole('button', { name: 'Add a wallet' }).click();
  }
  /**
   * A function to expect and click a button if specified to test functionality.
   *
   * @param {string} buttonText The name, text, asset, or test ID associated with
   * the button.
   * @param {string} type The type of buttonText supplied to the function.
   * @param {string} role The role of the button element (button, link, etc.).
   * @param {boolean} click Whether or not to click the button.
   */
  async expectButton(
    buttonText,
    type,
    role = 'button',
    click = true,
    page = this.homePage,
  ) {
    this.homePage.bringToFront();
    // Assign button using buttonText based on type supplied.
    let button;
    if (type === 'name') {
      button = await page.getByRole(role, { name: buttonText, exact: true });
    } else if (type === 'id') {
      button = await page.getByTestId(buttonText);
    } else if (type === 'element') {
      button = await page
        .locator('div')
        .filter({ hasText: buttonText })
        .getByRole(role);
    } else if (type === 'asset') {
      button = await page
        .getByRole('listitem')
        .filter({
          hasText: new RegExp(`^${buttonText}`),
        })
        .getByRole(role);
    } else if (type === 'sendback') {
      button = await page
        .getByRole('heading', {
          name: buttonText,
        })
        .getByRole(role, {
          name: 'Send back',
        });
    }

    await expect(button).toBeVisible();

    if (click) {
      await button.click();
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Utility Functions                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Mimics a user typing text into a text box.
   *
   * @param {string} text The text to input inside of the desired text box.
   * @param {string} xpath The xpath which corresponds to the desired text box.
   */
  async userInput(text, xpath = '', page = this.homePage) {
    if (xpath) {
      await page.locator(xpath).fill(text);
    } else {
      await page.getByRole('textbox').fill(text);
    }
  }

  /**
   * Mimics a user submitting a transaction.
   *
   * @param {boolean} enabled Whether or not the Submit button is expected
   * to be enabled.
   */
  async userSubmit(enabled = true, page = this.homePage) {
    const submitButton = await page.getByRole('button', {
      name: 'Submit',
    });

    if (enabled) {
      await submitButton.click();
    } else {
      await expect(submitButton).toHaveAttribute('disabled', '');
    }
  }

  /**
   * Ensures text is in document, clicks text option, and closes modal.
   *
   * @param {string} text The text to find in the document.
   * @param {boolean} click Whether or not to click the text option.
   * @param {boolean} close Whether or not to close out of the settings modal.
   * @param {boolean} heading Whether or not the text has a heading role.
   * @param {number} timeout Number of milliseconds to wait for text element to appear.
   */
  async expectText(
    text,
    click = false,
    close = false,
    heading = false,
    timeout = 10000,
    page = this.homePage,
  ) {
    let textComponent;
    if (heading) {
      textComponent = await page
        .getByRole('heading', {
          name: text,
          exact: true,
        })
        .first();
    } else {
      textComponent = await page
        .getByText(text, {
          exact: true,
        })
        .first();
    }

    await expect(textComponent).toBeVisible({ timeout });

    if (click) {
      await textComponent.click();
    }

    if (close) {
      await this.expectButton('CloseIcon', 'id');
    }
  }

  /**
   * Ensures link is in document and links to correct href.
   *
   * @param {string} linkText String or regex representing the text of the link
   * element.
   * @param {string} href The href which corresponds to the expected link.
   */
  async expectLink(linkText, href, page = this.homePage) {
    // Find link and expect to be visible in document.
    const linkComponent = await page.getByRole('link', {
      name: linkText,
    });
    await expect(linkComponent).toBeVisible();

    // Extract href from link and expect it to match provided regex.
    const linkHref = await linkComponent.evaluate(node =>
      node.getAttribute('href'),
    );
    const escapedHref = await this.escapeText(href);
    await expect(linkHref).toMatch(new RegExp(escapedHref + '[a-zA-Z0-9]+'));
  }

  // Adds escape char \ to special characters in string and converts to regex.
  async escapeText(text) {
    const escapedText = await text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    return escapedText;
  }

  /**
   * Retries a certain action up to a specified number of attempts.
   *
   * @param {function} action Action to execute and potentially repeat.
   * @param {function} failureAction Action to execute after reloading application.
   * @param {number} attempts Number of times to attempt action before allowing process
   * to fail.
   */
  retryAction = async (
    action,
    failureAction = () => {},
    attempts = 3,
    page = this.homePage,
  ) => {
    // If process fails, reload extension and try again up to number of attempts.
    let result;
    for (let i = 0; i < attempts; i++) {
      try {
        result = await action();
      } catch (err) {
        await console.log(err);
        await page.reload();
        await failureAction();
      }
      return result;
    }
  };

  /**
   * Times out code for specified number of milliseconds.
   *
   * @param {number} ms Number of milliseconds to timeout.
   */
  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Ensures main page is loaded with all relevant elements.
  async evaluateMainPage(page = this.homePage, buttonName = 'Test wallet 1') {
    /* --------------------------------- Buttons -------------------------------- */
    this.homePage.reload();

    const buttons = {
      walletButton: {
        buttonText: buttonName,
        type: 'name',
      },
      settingsButton: {
        buttonText: 'SettingsIcon',
        type: 'id',
      },
      sendButton: {
        buttonText: /^Send$/,
        type: 'element',
      },
      receiveButton: {
        buttonText: /^Receive$/,
        type: 'element',
      },
      buyButton: {
        buttonText: /^Buy$/,
        type: 'element',
      },
      manageButton: {
        buttonText: 'Manage',
        type: 'name',
      },
    };

    for (const button in buttons) {
      const attributes = buttons[button];
      await this.expectButton(
        attributes.buttonText,
        attributes.type,
        'button',
        false,
        page,
      );
    }

    /* ------------------------------ Text Elements ----------------------------- */

    for (const text of [
      'Portfolio value',
      /\$ [\d]{1,5}\.[\d]{2}/,
      'Send',
      'Receive',
      'Buy',
      'Assets',
    ]) {
      await this.expectText(text, false, false, false);
    }
  }

  /**
   * Opens settings, selects desired option, and closes modal.
   *
   * @param {string} buttonText The name or text available on the button to click.
   * @param {boolean} initialize Whether or not to open the settings from the main page.
   * @param {boolean} close Whether or not to close out of the settings modal.
   */
  async selectSettings(buttonText, initialize = true, close = false) {
    if (initialize) {
      await this.expectButton('SettingsIcon', 'id');
    }

    await this.expectButton(buttonText, 'name');

    if (close) {
      await this.expectButton('CloseIcon', 'id');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Send Transactions                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Extracts amount of a particular asset on a specified chain from the
   * corresponding asset page.
   *
   * @param {string} token The token to evaluate the amount of.
   * @param {string} chain The chain or chain path where the token is located.
   */
  async extractAmount(token, chain, page = this.homePage) {
    // Construct regex based on whether a chain or chain path was supplied.
    let regex;
    if (chain.includes('-')) {
      const unsupportedChain = await chain.split('-').pop();
      const chainPath = await chain.replaceAll('-', ' → ');
      regex = await new RegExp(
        `^${unsupportedChain}Send back${chainPath}\\$ \\d+\\.[\\d]{2}(\\d+\\.[\\d]{2}) ${token}$`,
      );
    } else {
      regex = await new RegExp(
        `^${chain}\\$ \\d+\\.[\\d]{2}(\\d+\\.[\\d]{2}) ${token}$`,
      );
    }

    // Wait for regex to be available on page.
    await this.expectText(regex, false, false, false, 30000);

    // Extract text which matches assigned regex.
    const chainText = await page
      .getByRole('article')
      .filter({ hasText: regex })
      .textContent();

    // Extract amount from text and return value.
    const result = await regex.exec(chainText);
    return Number(result[1]);
  }

  /**
   * Evaluates amounts of the test token on both the origin and destination chains.
   *
   * @param {string} token The token to use to test send transactions.
   * @param {string} origin The chain from which the token is originally sent.
   * @param {string} destination The chain to which the token is originally sent.
   */
  async evaluateAmounts(token, origin, destination) {
    const getAmounts = async () => {
      // Click into test token asset page.
      await this.goToAssetPage(token);

      // Extract relevant amounts and return values.
      const amountOrigin = await this.extractAmount(token, origin);
      const amountDestination = await this.extractAmount(token, destination);
      return [amountOrigin, amountDestination];
    };

    // Retry action up to 3 times.
    return await this.retryAction(getAmounts);
  }

  /**
   * Ensures that the before and after amounts of the test token on both the origin and
   * destination chains corroborate with the send transaction.
   *
   * @param {number} beforeOrigin The amount of the test token on the origin chain
   * before executing the send transaction.
   * @param {number} beforeDestination The amount of the test token on the destination
   * chain before executing the send transaction.
   * @param {number} sendAmount The amount of the test token which was sent.
   * @param {token} token The token to use to test send transactions.
   * @param {origin} origin The chain from which the token is originally sent.
   * @param {destination} destination The chain to which the token is originally sent.
   */
  async auditTransaction(
    beforeOrigin,
    beforeDestination,
    sendAmount,
    token,
    origin,
    destination,
    page = this.homePage,
  ) {
    // Wait and then reload extension to update token amounts.
    await this.timeout(5000);
    await page.reload();

    // Evaluate current amounts on origin and destination chains.
    const [afterOrigin, afterDestination] =
      (await this.evaluateAmounts(token, origin, destination)) ?? [];

    await console.log(
      beforeOrigin,
      afterOrigin,
      beforeDestination,
      afterDestination,
    );

    // Attempt to audit amounts before and after transaction.
    try {
      const expectedOrigin =
        Math.round((beforeOrigin - sendAmount) * 100) / 100;
      const expectedDestination =
        Math.round((beforeDestination + sendAmount) * 100) / 100;
      await expect(afterOrigin).toEqual(expectedOrigin);
      await expect(afterDestination).toEqual(expectedDestination);
      await this.expectButton('BackIcon', 'id');
      await console.log('confirmed');
    } catch (err) {
      // Amounts may have not been updated, try again.
      try {
        await this.auditTransaction(
          beforeOrigin,
          beforeDestination,
          sendAmount,
          token,
          origin,
          destination,
        );
      } catch (err) {
        console.log(err);
      }
    }
    return;
  }

  /**
   * Navigates to the asset page of the specified token from the main page.
   *
   * @param {string} token The token to use to test send transactions.
   */
  async goToAssetPage(token, page = this.homePage) {
    const clickAsset = async () => {
      // Wait for assets to load.
      await this.timeout(5000);

      // Click into test token asset page.
      await page.getByRole('heading').click();
      await this.expectText(new RegExp(`^${token} \\d*$`), true, false, true);

      // Ensure automated software clicked into correct asset page.
      await page.getByText(token);
    };

    await this.retryAction(clickAsset);
  }

  /**
   * Evaluates sending 0.01 axlUSDC to active wallet's Osmosis address.
   *
   * The result should be a decrease of 0.01 axlUSDC on Terra and an increase of
   * 0.01 axlUSDC on the Axelar-Terra-Osmosis path.
   *
   * Finally, the Send back functionality is used to send back 0.01 axlUSDC on the
   * Axelar-Terra-Osmosis path to Terra.
   *
   * Due to transaction fees being paid in other denominations, in very small amounts,
   * the resulting values on the asset page of axlUSDC after executing the transactions
   * in this function should match the original amounts.
   *
   * @param {string} token The token to use to test send transactions.
   * @param {string} origin The chain from which the token is originally sent.
   * @param {string} destination The chain to which the token is originally sent.
   * @param {number} sendAmount The amount of the test token to send.
   */
  async evaluateSend(
    token = 'axlUSDC',
    origin = 'Terra',
    destination = 'Axelar-Terra-Osmosis',
    sendAmount = 0.01,
    page = this.homePage,
  ) {
    /* ---------------------------------- Send ---------------------------------- */

    // Extract amounts on origin and destination chains before send transaction.
    const [amountBeforeSendTerra, amountBeforeSendOsmosis] =
      (await this.evaluateAmounts(token, origin, destination)) ?? [];

    // Navigate to the send page and verify relevant elements.
    await this.expectButton('Send', 'name');
    for (const text of [
      'Send',
      'Asset',
      'axlUSDC',
      'Source chain',
      'Terra',
      'Recipient',
      'Amount',
      'Memo (optional)',
      'Check if this transaction requires a memo',
      'Fee',
      'LUNA',
      'Balance',
      'Balance after tx',
      'Password',
    ]) {
      await this.expectText(text, false, false, false, 10000);
    }

    // Select wallet's Osmosis address as recipient and verify confirmation message.
    await this.expectButton('ContactsIcon', 'id');
    await this.expectButton('Select from your addresses', 'name');
    await this.expectButton('Osmosis Osmosis osmo16...m4f9mj', 'name');
    await this.expectText('Destination chain: Osmosis');

    // Fill out the rest of the send form and submit transaction.
    await this.userInput(sendAmount.toString(), 'input[name="input"]');
    await this.userInput('Testtest123!', 'input[type="password"]');
    // await this.userSubmit();

    // Confirm elements on broadcasting transaction page.
    await this.expectText('Broadcasting transaction', false, false, true);
    await this.expectText('Tx hash', false, false, true);
    await this.expectLink(
      /[A-Z0-9]{6}[.]{3}[A-Z0-9]{6}/,
      'https://terrasco.pe/mainnet/tx/',
    );

    // Confirm elements on successful transaction page.
    await this.expectText('Success!', false, false, true, 180000);
    await this.expectText('Tx hash', false, false, true);
    await this.expectLink(
      /[a-z0-9]{6}[.]{3}[a-z0-9]{6}/,
      'https://terrasco.pe/mainnet/address/',
    );
    await this.expectLink(
      /[A-Z0-9]{6}[.]{3}[A-Z0-9]{6}/,
      'https://terrasco.pe/mainnet/tx/',
    );
    await this.expectButton('Confirm', 'name');

    /* -------------------------- Confirm Send Amounts -------------------------- */

    // const [amountBeforeSendTerra, amountBeforeSendOsmosis] = [13.78, 5.18];

    await this.auditTransaction(
      amountBeforeSendTerra,
      amountBeforeSendOsmosis,
      sendAmount,
      token,
      origin,
      destination,
    );

    /* -------------------------------- Send Back ------------------------------- */

    // Extract amounts on origin and destination chains before send back transaction.
    const [amountBeforeSendBackOsmosis, amountBeforeSendBackTerra] =
      (await this.evaluateAmounts(token, destination, origin)) ?? [];

    // Retry clicking send back button up to 3 times.
    const clickSendBack = async (
      buttonText = 'Osmosis Send back Axelar → Terra → Osmosis',
    ) => {
      // Wait for chains to load.
      await this.timeout(5000);
      // Click button to send back from destination to origin.
      await this.expectButton(buttonText, 'sendback');
    };
    const onSendBackDisabled = async () => {
      await this.goToAssetPage(token);
    };
    this.retryAction(clickSendBack, onSendBackDisabled);

    // Focus on send back modal to keep it active.
    await page.getByRole('dialog').focus();

    // Confirm elements in the send back transaction page.
    for (const text of [
      'Amount',
      'Fee',
      'Balance',
      'Balance after tx',
      'Password',
    ]) {
      await this.expectText(text);
    }

    await console.log('first page confirmed');

    // Fill out send back form and click submit.
    await this.userInput(sendAmount.toString(), 'input[name="input"]');
    await this.userInput('Testtest123!', 'input[type="password"]');
    await this.userSubmit();

    await this.timeout(5000);

    await console.log('make transaction');

    // Confirm next stage of send back transaction is displayed on modal.
    for (const text of [
      'Amount',
      'Fee',
      'Balance',
      'Balance after tx',
      'Password',
    ]) {
      await this.expectText(text, false, false, false, 800000);
    }

    await console.log('first tx confirmed');

    // Attempt to submit without a password, confirm error, and close modal.
    await this.userSubmit();
    await this.expectText('Incorrect password', false, true);

    await console.log('incorrect password');

    /* ------------------------ Confirm Send Back Amounts ----------------------- */

    await this.auditTransaction(
      amountBeforeSendBackOsmosis,
      amountBeforeSendBackTerra,
      sendAmount,
      token,
      destination,
      origin,
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Settings                                  */
  /* -------------------------------------------------------------------------- */

  // Evaluates settings and ensures proper functionality.
  async evaluateSettings() {
    /* ---------------------------- Network Settings ---------------------------- */

    // Ensure the network settings button is visible and click.
    await this.selectSettings('Network Mainnet');

    // Change to Testnet and ensure TESTNET banner is visible.
    await this.selectSettings('Testnets', false);
    await this.expectText('TESTNET');

    // Change to Classic and ensure CLASSIC banner is visible.
    await this.selectSettings('Network Testnet');
    await this.selectSettings('Terra Classic', false);
    await this.expectText('CLASSIC');

    // Change back to Mainnet.
    await this.selectSettings('Network Classic');
    await this.selectSettings('Mainnets', false);

    /* ---------------------------- Language Settings --------------------------- */

    // Ensure the language settings button is visible and click.
    await this.selectSettings('Language English');

    // Change to Spanish and ensure Spanish translated receive text.
    await this.selectSettings('Español', false, true);
    await this.expectText('Reciba');

    // Change to Mandarin and ensure Mandarin translated buy text.
    await this.selectSettings('Idioma Español');
    await this.selectSettings('中文', false, true);
    await this.expectText('购买');

    // Change back to English.
    await this.selectSettings('语言 中文');
    await this.selectSettings('English', false, true);

    /* ---------------------------- Currency Settings --------------------------- */

    // Ensure the currency settings button is visible and click.
    await this.selectSettings('Currency USD');

    // Ensure search and select functionality.
    await this.userInput('JPY');
    await this.selectSettings('¥ - Japanese Yen', false, true);
    await this.expectText('¥ —');

    // Change back to USD.
    await this.selectSettings('Currency JPY');
    await this.userInput('USD');
    await this.selectSettings('$ - United States Dollar', false, true);
    await this.expectText('$ —');

    /* ----------------------------- Theme Settings ----------------------------- */

    // Ensure the theme settings button is visible and click.
    await this.selectSettings('Theme Dark');

    // Attempt to change to all available themes.
    for (const theme of ['Blossom', 'Light', 'Madness', 'Moon', 'Whale']) {
      await this.expectText(theme, true);
    }

    // Change back to Dark theme and close out of settings.
    await this.expectText('Dark', true, true);

    /* ---------------------------- Advanced Settings --------------------------- */

    // Ensure the advanced settings button is visible and click.
    await this.selectSettings('Advanced');

    // Click into the LUNA asset and ensure uluna is available for copy.
    await this.expectText('Developer Mode', true, true);
    await this.expectText(/^LUNA \d+$/, true, false, true);
    await this.expectText('uluna');
  }

  /* -------------------------------------------------------------------------- */
  /*                                Manage Wallet                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Opens manage wallet settings and selects desired option.
   *
   * @param {string} linkText The name or text available on the manage wallet link
   * to click.
   * @param {boolean} initialize Whether or not to open the manage wallet settings
   * from the main page.
   * @param {string} role The role of the component.
   */
  async selectManage(linkText, initialize = true, role = 'link') {
    if (initialize) {
      await this.expectButton('Test wallet 1', 'name');
      await this.expectButton(
        'Test wallet 1 terra1...6cw6qmfdnl9un23yxs',
        'name',
      );
    }

    await this.expectButton(linkText, 'name', role);
  }

  // Evaluates manage wallet options and ensures proper functionality.
  async evaluateManageWallet() {
    /* ------------------------------ Export Wallet ----------------------------- */

    // Ensure the Export wallet link is visible and click.
    await this.selectManage('Export wallet');

    // Ensure error upon incorrect password entry.
    await this.userInput('wrong password');
    await this.expectText('Incorrect password');

    // Ensure correct password entry results in QR code display.
    await this.userInput('Testtest123!');
    await this.userSubmit();
    await this.expectText('QR code', false, true, true);

    // Evaluate Private key functionality.
    await this.expectText('Private key', true);

    // Ensure correct password entry results in private key display.
    await this.userInput('Testtest123!');
    await this.userSubmit();
    await this.expectText('Private key', false, true, true);

    /* ----------------------------- Change Password ---------------------------- */

    // Ensure the Change password link is visible and click.
    await this.selectManage('Change password');

    // Ensure incorrect password error if wrong password entered.
    await this.userInput('wrong password', 'input[name="current"]');
    await this.expectText('Incorrect password');

    // Ensure short password error if not longer than 10 chars.
    await this.userInput('new', 'input[name="password"]');
    await this.expectText('Password must be longer than 10 characters');

    // Ensure password match error when new passwords mismatch.
    await this.userInput('newpassword', 'input[name="password"]');
    await this.userInput('newpass', 'input[name="confirm"]');
    await this.expectText('Password does not match');

    // Allow password change if all criteria pass.
    await this.userInput('Testtest123!', 'input[name="current"]');
    await this.userInput('newpassword', 'input[name="password"]');
    await this.userInput('newpassword', 'input[name="confirm"]');
    await this.userSubmit();
    await this.expectButton('Confirm', 'name');

    /* ------------------------------- Lock Wallet ------------------------------ */

    // Ensure the Lock wallet button is visible and click.
    await this.selectManage('Lock', true, 'button');

    // Expect submit to be disabled if user enters wrong password.
    await this.selectManage('Test wallet 1', false);
    await this.userInput('wrong password');
    await this.userSubmit(false);

    // Ensure user can unlock wallet with new password.
    await this.userInput('newpassword');
    await this.userSubmit();

    /* ------------------------------ Delete Wallet ----------------------------- */

    // Ensure the Delete wallet link is visible and click.
    await this.selectManage('Delete wallet');

    // Expect submit to be disabled upon wrong wallet name input.
    await this.userInput('Wrong name 1');
    await this.userSubmit(false);

    // Expect user to be able to delete wallet when correct wallet name inputted.
    await this.userInput('Test wallet 1');
    await this.userSubmit();
    await this.expectButton('Confirm', 'name');
    await this.expectText('Connect to Station');
  }

  /* -------------------------------------------------------------------------- */
  /*                                Manage Assets                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Opens asset management modal, clicks desired filter, and evaluates resulting
   * asset list.
   *
   * @param {string} filter The asset management filter to click.
   * @param {string} filteredAsset The asset which is expected to be filtered out
   * of the asset list after applying the filter.
   */
  async evaluateFilter(filter, filteredAsset) {
    // Evaluate checking and unchecking the filter.
    for (const action of ['check', 'uncheck']) {
      // Open the asset management modal.
      await this.expectButton('Manage', 'name');

      if (
        filter === 'Hide non-whitelisted' &&
        this.homePage.isVisible(`text='${filteredAsset}'`)
      ) {
        // Evaluate if Hide non-whitelisted filter filters specified asset.
        await this.expectText(filter, true, true);
        const nonWhitelistedToken = await this.homePage
          .getByText(filteredAsset)
          .first();
        if (action === 'check') {
          await expect(nonWhitelistedToken).toBeVisible();
        } else {
          await expect(nonWhitelistedToken).not.toBeVisible();
        }
      } else if (
        filter === 'Hide low-balance' &&
        this.homePage.isVisible(`text='${filteredAsset}'`)
      ) {
        // Evaluate if Hide low-balance filter filters specified asset.
        await this.expectText(filter, true, true);
        const lowBalanceToken = await this.homePage
          .getByText(filteredAsset)
          .first();
        if (action === 'check') {
          await expect(lowBalanceToken).toBeVisible();
        } else {
          await expect(lowBalanceToken).not.toBeVisible();
        }
      }
    }
  }

  /**
   * Opens asset management settings, clicks desired asset, and evaluates
   * resulting asset list.
   *
   * @param {string} asset The symbol of an asset unavailable in the active
   * wallet to include in the asset list.
   */
  async evaluateAsset(asset) {
    // Evaluate checking and unchecking the asset.
    for (const action of ['check', 'uncheck']) {
      // Open the asset management modal.
      await this.expectButton('Manage', 'name');

      // Click asset and close out of asset management modal.
      await this.userInput(asset);
      await this.expectButton(asset, 'asset');
      await this.expectButton('CloseIcon', 'id');

      // Evaluate if asset is properly added or removed from the asset list.
      const assetItem = await this.homePage.getByRole('article').filter({
        hasText: new RegExp(`^${asset}.*?${asset}$`),
      });
      if (action === 'check') {
        await expect(assetItem).toBeVisible();
      } else {
        await expect(assetItem).not.toBeVisible();
      }
    }
  }

  // Evaluates manage assets actions and ensures proper functionality.
  async evaluateManageAssets() {
    this.homePage.reload();
    /* --------------------------- Add / Remove Assets -------------------------- */
    const unavailableAssets = ['AKT', 'BNB', 'DOT'];
    // Evaluate selection of unavailable assets in manage assets.
    for (const unavailableAsset of unavailableAssets) {
      await this.evaluateAsset(unavailableAsset);
    }

    /* ------------------------------ Apply Filters ----------------------------- */

    // Evaluate the application of asset management filters.
    await this.evaluateFilter('Hide non-whitelisted', 'ATOM-OSMO LP');
    await this.evaluateFilter('Hide low-balance', 'axlUSDT');
  }
}

module.exports = HomePage;
