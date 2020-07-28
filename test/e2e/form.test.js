const {assert, driver, By} = require('vl-ui-core').Test.Setup;
const VlFormPage = require('./pages/vl-form.page');
const {VlInputField} = require('vl-ui-input-field').Test;

describe('vl-form', async () => {
  const vlFormPage = new VlFormPage(driver);

  before(() => {
    return vlFormPage.load();
  });

  it('Als gebruiker kan ik een formulier submitten zonder dat de URL aangepast wordt', async () => {
    const form = await vlFormPage.getForm();
    const nameInput = await new VlInputField(driver, await form.findElement(By.css('#name')));
    const surnameInput = await new VlInputField(driver, await form.findElement(By.css('#surname')));
    await nameInput.setValue('Jos');
    await surnameInput.setValue('Bosmans');
    await form.submit();
    const url = await driver.getCurrentUrl();
    assert.isTrue(url.endsWith('?no-header=true&no-footer=true'));
  });
});
