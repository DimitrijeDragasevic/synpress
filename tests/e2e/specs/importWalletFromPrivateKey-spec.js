describe('Station', () => {
  context('Test commands', () => {
    it('Test import from private key opetion on station wallet', () => {
      cy.verifyManageWalletsForm().then(verified => {
        expect(verified).to.be.true;
      });
      cy.importWalletFromPrivateKey().then(verified => {
        expect(verified).to.be.true;
      });
    });
    it('Test import from private key option on station wallet with invalid key', () => {
      cy.importWalletFromPrivateKeyInvalidKey().then(verified => {
        expect(verified).to.be.true;
      });
    });
    it('Test import from private key option on station wallet with wrong password', () => {
      cy.importWalletFromPrivateKeyWrongPassword().then(verified => {
        expect(verified).to.be.true;
      });
    });
  });
});