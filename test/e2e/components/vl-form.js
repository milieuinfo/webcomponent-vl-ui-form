const {VlElement} = require('vl-ui-core').Test;
const {By} = require('vl-ui-core').Test.Setup;
const {VlButton} = require('vl-ui-button').Test;

class VlForm extends VlElement {
  async submit() {
    const button = await this._getSubmitButton();
    await button.click();
  }

  async _getSubmitButton() {
    const element = await this.findElement(By.css('button[type="submit"]'));
    return new VlButton(this.driver, element);
  }
}

module.exports = VlForm;
