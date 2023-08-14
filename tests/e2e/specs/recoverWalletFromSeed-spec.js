
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
    it('Evaluate manage assets functionality', () => {
      cy.evaluateManageAssets().then(manageAssetsEvaluated => {
        expect(manageAssetsEvaluated).to.be.true;
      });
    });
    it('Evaluate manage wallet functionality', () => {
      cy.evaluateManageWallet().then(manageWalletEvaluated => {
        expect(manageWalletEvaluated).to.be.true;
      });
      //this is added beacuse you delete the wallet at the end but test wallet 1 setup is required by most tests to be present :D
      cy.setupStation().then(setup =>{
        expect(setup).to.be.true;
      });
    });
    it('Test happy flow recover wallet from seed', () => {
      cy.recoverWalletFromSeed().then(recovered => {
        expect(recovered).to.be.true;
      });
    });
  });
});
