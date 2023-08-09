describe('Station', () => {
    context('Test commands', () => {
      it('Test import from private key opetion on station wallet', () => {
        cy.createMultiSigWallet().then(verified => {
          expect(verified).to.be.true;
        });
      });
    });
  });