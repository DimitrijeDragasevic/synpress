/* eslint-disable ui-testing/no-disabled-tests */
describe('Station', () => {
  context('Test commands', () => {
    it('Go to the menage wallet screen from home screen and verify its form and elements', () => {
      cy.verifyManageWalletsForm().then(verified => {
        expect(verified).to.be.true;
      });
    });
  });
});
