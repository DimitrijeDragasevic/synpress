/* eslint-disable ui-testing/no-disabled-tests */
describe('Station', () => {
    context('Test commands', () => {
        it('Test happy flow recover wallet from seed', () => {
            cy.recoverWalletFromSeed().then(recovered => {
                expect(recovered).to.be.true;
            });
        });
    });
  });
  