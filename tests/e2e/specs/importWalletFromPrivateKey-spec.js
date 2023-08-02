describe('Station', () => {
    context('Test commands', () => {
      it('Test import from private key opetion on station wallet', () => {
        cy.verifyManageWalletsForm().then(verified => {
          expect(verified).to.be.true;
        });
        cy.importWalletFromPrivateKey();
      });
    });
  });