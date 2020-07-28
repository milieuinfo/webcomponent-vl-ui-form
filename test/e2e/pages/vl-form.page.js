const VlForm = require('../components/vl-form');
const {Page, Config} = require('vl-ui-core').Test;

class VlFormPage extends Page {
  async getForm() {
    return this._getForm('form');
  }

  async load() {
    await super.load(Config.baseUrl + '/demo/vl-form.html');
  }

  async _getForm(selector) {
    return new VlForm(this.driver, selector);
  }
}

module.exports = VlFormPage;
