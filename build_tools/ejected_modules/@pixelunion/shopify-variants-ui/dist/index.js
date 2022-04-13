class VariantSelection extends HTMLElement {
  static get observedAttributes() {
    return ['variant'];
  }

  constructor() {
    super();
    this._loaded = false;
    this._productFetcher = Promise.resolve(false);

    this._onMainElChange = event => {
      this.variant = event.currentTarget.value;
    };

    const mainInputEl = this.querySelector('input[data-variants]');
    this._mainEl = mainInputEl || this.querySelector('select[data-variants]');
  }

  set variant(value) {
    if (value) {
      this.setAttribute('variant', value);
    } else {
      this.removeAttribute('variant');
    }
  }

  get variant() {
    return this.getAttribute('variant');
  }

  connectedCallback() {
    this._productFetcher = this._fetchProduct();
    const mainInputEl = this.querySelector('input[data-variants]');
    this._mainEl = mainInputEl || this.querySelector('select[data-variants]');

    this._mainEl.addEventListener('change', this._onMainElChange);

    this.variant = this._mainEl.value;
  }

  disconnectedCallback() {
    this._mainEl.removeEventListener('change', this._onMainElChange);

    this._mainEl = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'variant':
        this._changeVariant(newValue);

        break;
    }
  }

  getProduct() {
    return this._loaded ? Promise.resolve(this._product) : this._productFetcher;
  }

  getVariant() {
    return this.getProduct().then(product => product ? product.variants.find(v => v.id.toString() === this.variant) || false : false).catch(() => false);
  }

  getState() {
    return this.getVariant().then(variant => variant ? 'selected' : this.getAttribute('variant'));
  }

  _changeVariant(value) {
    this._dispatchEvent(value).then(() => {
      this._mainEl.value = value;
    });
  }

  _fetchProduct() {
    return fetch(this.getAttribute('product-url')).then(response => response.json()).then(product => {
      this._product = product;
      return product;
    }).catch(() => {
      this._product = null;
    }).finally(() => {
      this._loaded = true;
    });
  }

  _dispatchEvent(value) {
    return this.getProduct().then(product => {
      const variant = product ? product.variants.find(v => v.id.toString() === value) || false : false;
      const state = variant ? 'selected' : value;
      const event = new CustomEvent('variant-change', {
        detail: {
          product,
          variant,
          state
        }
      });
      this.dispatchEvent(event);
    });
  }

}

const valueElementType = {
  select: 'option',
  radio: 'input[type="radio"]'
};

function setSelectedOptions(selectOptions, radioOptions, selectedOptions) {
  selectOptions.forEach(({
    option
  }) => {
    option.value = selectedOptions[parseInt(option.dataset.variantOptionIndex, 10)];
  });
  radioOptions.forEach(({
    values
  }) => {
    values.forEach(value => {
      value.checked = value.value === selectedOptions[parseInt(value.dataset.variantOptionValueIndex, 10)];
    });
  });
}

function getOptions(optionsEls) {
  const select = [];
  const radio = [];

  for (let i = 0; i < optionsEls.length; i++) {
    const optionEl = optionsEls[i];
    const wrappers = optionEl.matches('[data-variant-option-value-wrapper]') ? [optionEl] : Array.prototype.slice.call(optionEl.querySelectorAll('[data-variant-option-value-wrapper]'));
    const values = optionEl.matches('[data-variant-option-value]') ? [optionEl] : Array.prototype.slice.call(optionEl.querySelectorAll('[data-variant-option-value]'));
    if (!values.length) break;
    const option = {
      option: optionEl,
      wrappers,
      values
    };

    if (values[0].matches(valueElementType.select)) {
      select.push(option);
    } else if (values[0].matches(valueElementType.radio)) {
      radio.push(option);
    }
  }

  return {
    select,
    radio
  };
}

function getSelectedOptions(product, selectOptions, radioOptions) {
  const options = product.options.map(() => 'not-selected');
  selectOptions.forEach(({
    option
  }) => {
    if (option.value !== 'not-selected') {
      options[parseInt(option.dataset.variantOptionIndex, 10)] = option.value;
    }
  });
  radioOptions.forEach(({
    values
  }) => {
    values.forEach(value => {
      if (value.checked) {
        options[parseInt(value.dataset.variantOptionValueIndex, 10)] = value.value;
      }
    });
  });
  return options;
}

function getVariantFromSelectedOptions(variants, selectedOptions) {
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const isVariant = variant.options.every((option, index) => option === selectedOptions[index]);
    if (isVariant) return variant; // We found the variant
  }

  return false;
}

function _getVariant(variants, options) {
  return variants.find(variant => variant.options.every((option, index) => option === options[index]));
}

function _setOptionsMap(product, selectedOptions, optionsMap, option1, option2 = null, option3 = null) {
  const updatedOptionsMap = { ...optionsMap
  };
  const options = [option1, option2, option3].filter(option => !!option);

  const variant = _getVariant(product.variants, options);

  const variantOptionMatches = options.filter((option, index) => option === selectedOptions[index]).length;
  const isCurrentVariant = variantOptionMatches === product.options.length;
  const isNeighbor = variantOptionMatches === product.options.length - 1;

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (option) {
      let {
        setByCurrentVariant,
        setByNeighbor,
        accessible,
        available
      } = optionsMap[i][option];

      if (variant) {
        accessible = variant.available || accessible; // The current variant is always
        // the priority for option availability

        if (isCurrentVariant) {
          setByCurrentVariant = true;
          ({
            available
          } = variant);
        } else if (!setByCurrentVariant && isNeighbor) {
          // If the variant is a neighbor
          // And the option doesn't belong to the variant
          // Use its availability information for the option
          // If multiple neighbors exist, prefer true
          available = setByNeighbor ? available || variant.available : variant.available;
          setByNeighbor = true;
        }
      } else if (isCurrentVariant) {
        // Catch case where current variant doesn't exist
        // Ensure availability is false
        setByCurrentVariant = true;
        available = false;
      } else if (!setByCurrentVariant && isNeighbor) {
        // Catch case where neighbor doesn't exist
        // Ensure availability is false
        // If multiple neighbors exist, prefer true
        available = setByNeighbor ? available : false;
        setByNeighbor = true;
      } // If the option isn't set by either
      // the current variant or a neighbor
      // default to general accessibility


      if (!setByCurrentVariant && !setByNeighbor) {
        available = accessible;
      }

      updatedOptionsMap[i][option] = {
        setByCurrentVariant,
        setByNeighbor,
        accessible,
        available
      };
    }
  }

  return updatedOptionsMap;
}

function getOptionsAccessibility(product, selectedOptions) {
  let optionsMap = product.options.map(() => ({}));

  for (let i = 0; i < product.options.length; i++) {
    for (let j = 0; j < product.variants.length; j++) {
      const variant = product.variants[j];
      const option = variant.options[i];
      optionsMap[i][option] = {
        setByCurrentVariant: false,
        setByNeighbor: false,
        accessible: false,
        available: false
      };
    }
  }

  const option1Values = optionsMap.length >= 1 ? Object.keys(optionsMap[0]) : [];
  const option2Values = optionsMap.length >= 2 ? Object.keys(optionsMap[1]) : [];
  const option3Values = optionsMap.length >= 3 ? Object.keys(optionsMap[2]) : [];
  option1Values.forEach(option1Value => {
    option2Values.forEach(option2Value => {
      option3Values.forEach(option3Value => {
        optionsMap = _setOptionsMap(product, selectedOptions, optionsMap, option1Value, option2Value, option3Value);
      });

      if (!option3Values.length) {
        optionsMap = _setOptionsMap(product, selectedOptions, optionsMap, option1Value, option2Value);
      }
    });

    if (!option2Values.length) {
      optionsMap = _setOptionsMap(product, selectedOptions, optionsMap, option1Value);
    }
  });
  return optionsMap;
}

function updateOptions(product, selectOptions, radioOptions, selectedOptions, disableUnavailableOptions, removeUnavailableOptions) {
  const options = [...selectOptions, ...radioOptions];

  if (options.length === 0) {
    return;
  }

  const optionsAccessibility = getOptionsAccessibility(product, selectedOptions); // Iterate over each option type

  for (let i = 0; i < product.options.length; i++) {
    // Corresponding select dropdown, if it exists
    const optionValues = options.find(({
      option
    }) => {
      if (parseInt(option.dataset.variantOptionIndex, 10) === i) {
        return true;
      }

      return false;
    });

    if (optionValues) {
      const fragment = document.createDocumentFragment();
      const {
        option,
        wrappers,
        values
      } = optionValues;

      for (let j = values.length - 1; j >= 0; j--) {
        const wrapper = wrappers[j];
        const optionValue = values[j];
        const {
          value
        } = optionValue;
        const {
          available
        } = value in optionsAccessibility[i] ? optionsAccessibility[i][value] : false;
        const {
          accessible
        } = value in optionsAccessibility[i] ? optionsAccessibility[i][value] : false;
        const isChooseOption = value === 'not-selected'; // Option element to indicate unchosen option
        // Disable unavailable options

        optionValue.disabled = isChooseOption || disableUnavailableOptions && !accessible;
        optionValue.dataset.variantOptionAccessible = accessible;
        optionValue.dataset.variantOptionAvailable = available;

        if (!removeUnavailableOptions || accessible || isChooseOption) {
          fragment.insertBefore(wrapper, fragment.firstElementChild);
        }
      }

      option.innerHTML = '';
      option.appendChild(fragment);
      const chosenValue = values.find(value => value.selected || value.checked);
      option.dataset.variantOptionChosenValue = chosenValue && chosenValue.value !== 'not-selected' ? chosenValue.value : false;
    }
  }
}

class OptionsSelection extends HTMLElement {
  static get observedAttributes() {
    return ['variant-selection', 'disable-unavailable', 'remove-unavailable'];
  }

  static synchronize(mainOptionsSelection) {
    const mainVariantSelection = mainOptionsSelection.getVariantSelection(); // Fast return if we aren't associated with a variant selection

    if (!mainVariantSelection) return Promise.resolve(false);
    return mainOptionsSelection.getSelectedOptions().then(selectedOptions => {
      // Update all other options selects associated with the same variant ui
      const optionsSelections = document.querySelectorAll('options-selection');
      optionsSelections.forEach(optionsSelection => {
        if (optionsSelection !== mainOptionsSelection && optionsSelection.getVariantSelection() === mainVariantSelection) {
          optionsSelection.setSelectedOptions(selectedOptions);
        }
      });
    }).then(() => true);
  }

  constructor() {
    super();
    this.style.display = '';
    this._events = [];
    this._onChangeFn = this._onOptionChange.bind(this);
    this._optionsEls = this.querySelectorAll('[data-variant-option]');
    ({
      select: this._selectOptions,
      radio: this._radioOptions
    } = getOptions(this._optionsEls));

    this._associateVariantSelection(this.getAttribute('variant-selection'));
  }

  set variantSelection(value) {
    if (value) {
      this.setAttribute('variant-selection', value);
    } else {
      this.removeAttribute('variant-selection');
    }
  }

  get variantSelection() {
    return this.getAttribute('variant-selection');
  }

  connectedCallback() {
    this._optionsEls = this.querySelectorAll('[data-variant-option]');
    ({
      select: this._selectOptions,
      radio: this._radioOptions
    } = getOptions(this._optionsEls));

    this._associateVariantSelection(this.getAttribute('variant-selection'));

    this._selectOptions.forEach(({
      option
    }) => {
      option.addEventListener('change', this._onChangeFn);

      this._events.push({
        el: option,
        fn: this._onChangeFn
      });
    });

    this._radioOptions.forEach(({
      values
    }) => {
      values.forEach(value => {
        value.addEventListener('change', this._onChangeFn);

        this._events.push({
          el: value,
          fn: this._onChangeFn
        });
      });
    });

    this._onOptionChange();
  }

  disconnectedCallback() {
    this._resetOptions();

    this._events.forEach(({
      el,
      fn
    }) => el.removeEventListener('change', fn));

    this._events = [];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    switch (name) {
      case 'variant-selection':
        this._associateVariantSelection(newValue);

        break;

      case 'disable-unavailable':
      case 'remove-unavailable':
        this._updateOptions(this.hasAttribute('disable-unavailable'), this.hasAttribute('remove-unavailable'));

        break;
    }
  }

  getSelectedOptions() {
    if (!this._variantSelection) return Promise.resolve(null);
    return this._variantSelection.getProduct().then(product => {
      if (!product) return null;
      return getSelectedOptions(product, this._selectOptions, this._radioOptions);
    });
  }

  getVariantSelection() {
    return this._variantSelection;
  }

  setSelectedOptions(selectedOptions) {
    setSelectedOptions(this._selectOptions, this._radioOptions, selectedOptions);
    return this._updateOptions(this.hasAttribute('disable-unavailable'), this.hasAttribute('remove-unavailable'), selectedOptions);
  }

  _associateVariantSelection(id) {
    this._variantSelection = id ? document.getElementById(id) : this.closest('variant-selection');
  }

  _updateLabels() {
    // Update any labels
    for (let i = 0; i < this._optionsEls.length; i++) {
      const optionsEl = this._optionsEls[i];
      let optionsNameEl = null;
      let {
        parentElement
      } = optionsEl;

      while (parentElement && !optionsNameEl) {
        const tmpOptionsNameEl = parentElement.querySelector('[data-variant-option-name]');

        if (tmpOptionsNameEl) {
          optionsNameEl = tmpOptionsNameEl;
        }

        ({
          parentElement
        } = parentElement);
      }

      if (optionsNameEl) {
        optionsNameEl.dataset.variantOptionChosenValue = optionsEl.dataset.variantOptionChosenValue;

        if (optionsEl.dataset.variantOptionChosenValue !== 'false') {
          optionsNameEl.innerHTML = optionsNameEl.dataset.variantOptionName;
          const optionNameValueSpan = optionsNameEl.querySelector('span');

          if (optionNameValueSpan) {
            optionNameValueSpan.innerHTML = optionsEl.dataset.variantOptionChosenValue;
          }
        } else {
          optionsNameEl.innerHTML = optionsNameEl.dataset.variantOptionChooseName;
        }
      }
    }
  }

  _resetOptions() {
    return this._updateOptions(false, false);
  }

  _updateOptions(disableUnavailableOptions, removeUnavailableOptions, selectedOptions = null) {
    if (!this._variantSelection) return Promise.resolve(false);
    return this._variantSelection.getProduct().then(product => {
      updateOptions(product, this._selectOptions, this._radioOptions, selectedOptions || getSelectedOptions(product, this._selectOptions, this._radioOptions), disableUnavailableOptions, removeUnavailableOptions);

      this._updateLabels();
    }).then(() => true);
  }

  _updateVariantSelection(product, selectedOptions) {
    if (!this._variantSelection) return;
    const variant = getVariantFromSelectedOptions(product.variants, selectedOptions);
    const isNotSelected = selectedOptions.some(option => option === 'not-selected'); // Update master select

    if (variant) {
      this._variantSelection.variant = variant.id;
    } else {
      this._variantSelection.variant = isNotSelected ? 'not-selected' : 'unavailable';
    }
  }

  _onOptionChange() {
    if (!this._variantSelection) return;

    this._variantSelection.getProduct().then(product => {
      if (!product) return;
      const selectedOptions = getSelectedOptions(product, this._selectOptions, this._radioOptions);

      this._updateOptions(this.hasAttribute('disable-unavailable'), this.hasAttribute('remove-unavailable'), selectedOptions);

      this._updateVariantSelection(product, selectedOptions);

      OptionsSelection.synchronize(this);
    });
  }

}

if (!customElements.get('variant-selection')) {
  customElements.define('variant-selection', VariantSelection);
}

if (!customElements.get('options-selection')) {
  customElements.define('options-selection', OptionsSelection);
}
