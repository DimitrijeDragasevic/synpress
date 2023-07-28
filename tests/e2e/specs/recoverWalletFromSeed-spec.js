/* eslint-disable ui-testing/no-disabled-tests */
describe('Station', () => {
  context('Test commands', () => {
    it(`Evaluate Station settings functionality`, () => {
      cy.evaluateSettings().then(settingsEvaluated => {
        expect(settingsEvaluated).to.be.true;
      });
    });
    it(`Evaluate Station manage wallet functionality`, () => {
      cy.evaluateManageWallet().then(manageWalletEvaluated => {
        expect(manageWalletEvaluated).to.be.true;
      });
      //this is added beacuse you delete the wallet at the end but test wallet 1 setup is required by most tests to be present :D
      cy.setupStation();
    });
    it(`Evaluate Station manage assets functionality`, () => {
      cy.evaluateManageAssets().then(manageAssetsEvaluated => {
        expect(manageAssetsEvaluated).to.be.true;
      });
    });
    it('Test happy flow recover wallet from seed', () => {
      cy.recoverWalletFromSeed().then(recovered => {
        expect(recovered).to.be.true;
      });
    });
  });
});
