describe('Station', () => {
  context('Test commands', () => {
    it('Testing creation of wallet option', () => {
      cy.verifyManageWalletsForm().then(verified => {
        expect(verified).to.be.true;
      });
      cy.createWallet('Test wallet 3');
    });
  });
});
