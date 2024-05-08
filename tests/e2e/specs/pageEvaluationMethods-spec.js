/* eslint-disable ui-testing/no-disabled-tests */
describe('Station', () => {
  context('Test commands', () => {
    it('Evaluate main page', () => {
      cy.evaluateMainPage().then(mainPageEvaluated => {
        expect(mainPageEvaluated).to.be.true;
      });
    });
    it('Evaluate settings functionality', () => {
      cy.evaluateSettings().then(settingsEvaluated => {
        expect(settingsEvaluated).to.be.true;
      });
    });
    it('Evaluate send functionality', () => {
      cy.evaluateSend().then(sendEvaluated => {
        expect(sendEvaluated).to.be.true;
      });
    });
    it('Evaluate manage assets functionality', () => {
      cy.evaluateManageAssets().then(manageAssetsEvaluated => {
        expect(manageAssetsEvaluated).to.be.true;
      });
    });
    it('Evaluate manage wallet functionality', () => {
      cy.evaluateManageWallet().then(manageWalletEvaluated => {
        expect(manageWalletEvaluated).to.be.true;
      });
    });
  });
});
