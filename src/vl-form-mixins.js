import 'vl-ui-form-message';
import {html} from 'lit-element';
import {render} from 'lit-html';

class ConstraintViolations {
  constructor() {
    this.__violations = [];
  }

  isValid() {
    return this.__violations.length === 0;
  }

  isInvalid() {
    return this.__violations.length !== 0;
  }

  combine(other) {
    return violations(
        [...other.__violations, ...this.__violations]);
  }

  map(onViolation) {
    return this.__violations.map((v) => onViolation(v));
  }

  forEach(onViolation) {
    this.__violations.forEach((v) => onViolation(v));
  }

  get violations() {
    return this.__violations;
  }
}

export const violations = (messages) => {
  const cvs = new ConstraintViolations();
  cvs.__violations = Array.isArray(messages) ? messages : [messages];
  return cvs;
};

export const emptyViolations = () => {
  return new ConstraintViolations();
};

export const inputMixin = (base) => class extends base {
  constructor() {
    super();
  }

  static get properties() {
    return {
      label: {type: String},
      name: {type: String},
      annotation: {type: String},
      value: {type: Object},
      noSubmit: {type: Boolean},
      validator: {
        type: Object, hasChanged: () => false,
      },
    };
  }

  static _attributeNameForProperty(name, options) {
    return super._attributeNameForProperty(
        this.__camelCaseToDash(name), options);
  }

  static __camelCaseToDash(value) {
    return value.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
  };

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('data-form-input', true);
  }

  render() {
    return html`
      ${this.__renderLabel()}
      ${this.__renderAnnotation()}
      ${this.__renderInput()}
      ${this.__renderError()}
    `;
  }

  __renderAnnotation() {
    if (!this.annotation) {
      return html``;
    }
    return html`
      <p is="vl-form-annotation" data-vl-light>
        ${this.annotation}
      </p>`;
  }

  __renderLabel() {
    return html`
      <label is="vl-form-label" for="${this.name}" data-vl-block>
        ${this.label}
      </label>`;
  };

  __renderError() {
    return html`
      <p is="vl-form-validation-message" id="errorMessage"></p>
    `;
  }

  __renderInput() {
    throw new Error(
        'You have to implement the "__renderInput()" method.');
  }

  get __input() {
    throw new Error(
        'You have to implement the "getResource __input()" method.');
  }

  get __error() {
    return this.querySelector('#errorMessage');
  }

  async checkValidity() {
    return this.__validate(this.value);
  }

  focus() {
    this.__input.focus();
  }

  clear() {
    throw new Error(
        'You have to implement the "clear()" method.');
  }

  async __validate(inputValue) {
    const violations = await this.__validateInput(inputValue);
    if (violations.isValid()) {
      this.__updateInput(true);
      const newValue = this.__normalizeValue(inputValue);
      this.__dispatchChangeEvent(newValue, this.value);
      this.value = newValue;
      this.showErrors([]);
    } else {
      this.value = inputValue;
      this.__updateInput(false);
      this.showErrors(violations.violations);
    }
    return violations;
  }

  showErrors(errors) {
    this.__updateInput(this.__isValid(errors));
    render(html`${errors.map((em) => html`${em}<br/>`)}`, this.__error);
  }

  __dispatchChangeEvent(newValue, oldValue) {
    if (this._isChanged(newValue, oldValue)) {
      this.dispatchEvent(new CustomEvent('change', {detail: newValue}));
    }
  }

  _isChanged(newValue, oldValue) {
    return newValue !== oldValue;
  }

  __normalizeValue(value) {
    return value;
  }

  __isValid(errors) {
    return errors === null || errors.length === 0;
  }

  async __validateInput(inputValue) {
    if (this.validator) {
      return this.validator(inputValue);
    }
    return emptyViolations();
  }

  __updateInput(isValid) {
    if (isValid) {
      this.__input.removeAttribute('data-vl-error');
      this.__error.removeAttribute('data-vl-error');
    } else {
      this.__input.setAttribute('data-vl-error', '');
      this.__error.setAttribute('data-vl-error', '');
    }
  }
};

export const formMixin = (base) => class extends base {
  constructor() {
    super();
  }

  get form() {
    return this.querySelector('form');
  }

  set formData(formData) {
    this.formInputs.forEach((input) => {
      const value = formData[input.name];
      __setValue(input, value);
    });
  }

  putFormValue(name, value) {
    this.formInputs
        .filter((input) => input.name === name)
        .forEach((input) => this.__setValue(input, value));
  }

  __setValue(input, value) {
    try {
      input.value = value;
    } catch (error) {
      console.error(
          `failed setting input ${input.tagName} / ${input.id} with value ${value}`);
    }
  }

  async submitForm({valid, invalid, validator}) {
    const formData = this.formData;
    this.formInputs.forEach((input) => {
      if (input.noSubmit) {
        delete formData[input.name];
      }
    });
    const formViolations = this.__combineViolations(
        await this.checkFormValidity(),
        validator ? await validator(formData) : {});

    if (this.__isEmpty(formViolations)) {
      if (valid) {
        await valid(formData);
      }
      return;
    }

    this.bindErrors((name) => {
      return formViolations[name] ?
          formViolations[name] :
          emptyViolations();
    });
    if (invalid) {
      await invalid(formViolations);
    }
  }

  __combineViolations(left, right) {
    const combined = {};
    for (const key in left) {
      if (!left.hasOwnProperty(key)) {
        continue;
      }
      if (right[key] && left[key]) {
        combined[key] = left[key].combine(right[key]);
      }
    }
    return {...left, ...right, ...combined};
  }

  __isEmpty(errors) {
    return Object.entries(errors).length === 0;
  }

  bindErrors(resolveErrorFn) {
    let firstError = null;
    this.formInputs.forEach((input) => {
      const violations = resolveErrorFn(input.name);
      if (!firstError && violations.isInvalid()) {
        firstError = input;
      }
      input.showErrors(violations.violations);
    });
    if (firstError) {
      firstError.focus();
    }
  }

  putFieldError(name, errors) {
    this.formInputs
        .filter((input) => input.name === name)
        .forEach((input) => {
          input.showErrors(errors);
        });
  }

  async checkFormValidity() {
    const formViolations = {};
    for (const input of this.formInputs) {
      const inputViolations = await input.checkValidity();
      if (inputViolations.isInvalid()) {
        formViolations[input.name] = inputViolations;
      }
    }
    return formViolations;
  }

  get formData() {
    const formData = this.formInputs
        .map((input) => {
          return {
            [input.name]: this.__extractValue(input),
          };
        })
        .reduce((acc, el) => this.__reduceValues(acc, el), {propertyNames: []});

    delete formData.propertyNames;
    return formData;
  }

  get formInputs() {
    return Array.from(this.form.querySelectorAll('*[data-form-input]'));
  }

  clearFormInput(name) {
    this.formInputs
        .filter((input) => input.name === name)
        .forEach((input) => input.clear());
  }

  __extractValue(input) {
    if (input.hasAttribute('data-vl-switch')) {
      return input.checked;
    }
    if (input.checked) {
      return input._inputElement.value;
    }
    return input.value;
  }

  __reduceValues(acc, el) {
    for (const key in el) {
      if (el.hasOwnProperty(key) === false) {
        continue;
      }
      const value = el[key];
      this.__transformMultiValue(acc, key);
      if (value !== undefined) {
        this.__reduceValue(acc, key, value);
      }
    }
    return acc;
  }

  __reduceValue(acc, key, value) {
    if (Array.isArray(acc[key])) {
      acc[key] = [...acc[key], value];
    } else {
      acc[key] = value;
    }
  }

  __transformMultiValue(acc, key) {
    // the key is associated with multiple values, since we find it again,
    // therefore we change the value to an array if it isn't already..
    if (acc.propertyNames.includes(key)) {
      if (!Array.isArray(acc[key])) {
        acc[key] = acc[key] ? [acc[key]] : [];
      }
    } else {
      acc.propertyNames = [...acc.propertyNames, key];
    }
  }
};

