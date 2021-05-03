const {assert, getDriver, By} = require('vl-ui-core').Test.Setup;
const VlFormPage = require('./pages/vl-form.page');
const {VlInputField} = require('vl-ui-input-field').Test;

describe('vl-form', async () => {
  let driver;
  let vlFormPage;

  before(() => {
    driver = getDriver();
    vlFormPage = new VlFormPage(driver);
    return vlFormPage.load();
  });

  it('WCAG', async () => {
    await assert.eventually.isFalse(vlFormPage.hasWcagIssues());
  });

  it('als gebruiker kan ik een formulier submitten zonder dat de URL aangepast wordt', async () => {
    const form = await vlFormPage.getForm();
    const emailInput = await new VlInputField(driver, await form.findElement(By.css('#email')));
    const nameInput = await new VlInputField(driver, await form.findElement(By.css('#name')));
    const surnameInput = await new VlInputField(driver, await form.findElement(By.css('#surname')));
    await emailInput.setValue('jos.bosmans@vlaanderen.be');
    await nameInput.setValue('Jos');
    await surnameInput.setValue('Bosmans');
    await form.submit();
    const url = await driver.getCurrentUrl();
    assert.isTrue(url.endsWith('?no-header=true&no-footer=true'));
  });
});
