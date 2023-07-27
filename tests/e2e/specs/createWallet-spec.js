describe('Station', () => {
    context('Test commands', () => {
      it(`Setup terraStation with one wallet using recover with seed phrase option`, () => {
        cy.setupStation().then(setupFinished => {
          expect(setupFinished).to.be.true;
        });
      });
      it('Testing creation of wallet option', () => {
        cy.verifyManageWalletsForm().then(verified => {
            expect(verified).to.be.true;
          });
        cy.createWallet('Test wallet 3');
      });
    });
  });
  