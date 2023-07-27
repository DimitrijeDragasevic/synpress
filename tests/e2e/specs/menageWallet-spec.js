/* eslint-disable ui-testing/no-disabled-tests */
describe('Station', () => {
    context('Test commands', () => {
      it(`Setup station with one wallet using recover with seed phrase option`, () => {
        cy.setupStation().then(setupFinished => {
          expect(setupFinished).to.be.true;
        });
      });
      it('Go to the menage wallet screen from home screen and verify its form and elements', () => {
        cy.verifyManageWalletsForm().then(verified => {
            expect(verified).to.be.true;
          });
      });
    });
  });
  