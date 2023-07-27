/* eslint-disable ui-testing/no-disabled-tests */
describe('Station', () => {
  context('Test commands', () => {
    it(`Setup Station with one wallet using recover with seed phrase option`, () => {
      cy.setupStation().then(setupFinished => {
        expect(setupFinished).to.be.true;
      });
    });
    it(`Evaluate Station settings functionality`, () => {
      cy.evaluateSettings().then(settingsEvaluated => {
        expect(settingsEvaluated).to.be.true;
      });
    });
    it(`Evaluate Station manage wallet functionality`, () => {
      cy.evaluateManageWallet().then(manageWalletEvaluated => {
        expect(manageWalletEvaluated).to.be.true;
      });
    });
    // it('Test happy flow recover wallet from seed', () => {
    //   cy.recoverWalletFromSeed().then(recovered => {
    //     expect(recovered).to.be.true;
    //   });
    // });
  });
});
