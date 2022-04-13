const valueElementType = {
  select: 'option',
  radio: 'input[type="radio"]',
};

function setSelectedOptions(selectOptions, radioOptions, selectedOptions) {
  selectOptions.forEach(({ option }) => {
    option.value = selectedOptions[parseInt(option.dataset.variantOptionIndex, 10)];
  });

  radioOptions.forEach(({ values }) => {
    values.forEach(value => {
      value.checked = (
        value.value === selectedOptions[parseInt(value.dataset.variantOptionValueIndex, 10)]
      );
    });
  });
}

function getOptions(optionsEls) {
  const select = [];
  const radio = [];

  for (let i = 0; i < optionsEls.length; i++) {
    const optionEl = optionsEls[i];
    const wrappers = optionEl.matches('[data-variant-option-value-wrapper]')
      ? [optionEl]
      : Array.prototype.slice.call(optionEl.querySelectorAll('[data-variant-option-value-wrapper]'));
    const values = optionEl.matches('[data-variant-option-value]')
      ? [optionEl]
      : Array.prototype.slice.call(optionEl.querySelectorAll('[data-variant-option-value]'));

    if (!values.length) break;

    const option = {
      option: optionEl,
      wrappers,
      values,
    };

    if (values[0].matches(valueElementType.select)) {
      select.push(option);
    } else if (values[0].matches(valueElementType.radio)) {
      radio.push(option);
    }
  }

  return {
    select,
    radio,
  };
}

function getSelectedOptions(product, selectOptions, radioOptions) {
  const options = product.options.map(() => 'not-selected');

  selectOptions.forEach(({ option }) => {
    if (option.value !== 'not-selected') {
      options[parseInt(option.dataset.variantOptionIndex, 10)] = option.value;
    }
  });

  radioOptions.forEach(({ values }) => {
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
  return variants
    .find(variant => variant.options.every((option, index) => option === options[index]));
}

function _setOptionsMap(
  product,
  selectedOptions,
  optionsMap,
  option1,
  option2 = null,
  option3 = null,
) {
  const updatedOptionsMap = { ...optionsMap };
  const options = [option1, option2, option3].filter(option => !!option);
  const variant = _getVariant(product.variants, options);
  const variantOptionMatches = options.filter(
    (option, index) => option === selectedOptions[index],
  ).length;
  const isCurrentVariant = variantOptionMatches === product.options.length;
  const isNeighbor = variantOptionMatches === product.options.length - 1;

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (option) {
      let {
        setByCurrentVariant,
        setByNeighbor,
        accessible,
        available,
      } = optionsMap[i][option];

      if (variant) {
        accessible = variant.available || accessible;

        // The current variant is always
        // the priority for option availability
        if (isCurrentVariant) {
          setByCurrentVariant = true;
          ({ available } = variant);
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
      }

      // If the option isn't set by either
      // the current variant or a neighbor
      // default to general accessibility
      if (!setByCurrentVariant && !setByNeighbor) {
        available = accessible;
      }

      updatedOptionsMap[i][option] = {
        setByCurrentVariant,
        setByNeighbor,
        accessible,
        available,
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
        available: false,
      };
    }
  }

  const option1Values = optionsMap.length >= 1 ? Object.keys(optionsMap[0]) : [];
  const option2Values = optionsMap.length >= 2 ? Object.keys(optionsMap[1]) : [];
  const option3Values = optionsMap.length >= 3 ? Object.keys(optionsMap[2]) : [];

  option1Values.forEach((option1Value => {
    option2Values.forEach((option2Value => {
      option3Values.forEach((option3Value => {
        optionsMap = _setOptionsMap(
          product,
          selectedOptions,
          optionsMap,
          option1Value,
          option2Value,
          option3Value,
        );
      }));

      if (!option3Values.length) {
        optionsMap = _setOptionsMap(
          product,
          selectedOptions,
          optionsMap,
          option1Value,
          option2Value,
        );
      }
    }));

    if (!option2Values.length) {
      optionsMap = _setOptionsMap(
        product,
        selectedOptions,
        optionsMap,
        option1Value,
      );
    }
  }));

  return optionsMap;
}

function updateOptions(
  product,
  selectOptions,
  radioOptions,
  selectedOptions,
  disableUnavailableOptions,
  removeUnavailableOptions,
) {
  const options = [...selectOptions, ...radioOptions];

  if (options.length === 0) {
    return;
  }

  const optionsAccessibility = getOptionsAccessibility(product, selectedOptions);

  // Iterate over each option type
  for (let i = 0; i < product.options.length; i++) {
    // Corresponding select dropdown, if it exists
    const optionValues = options.find(({ option }) => {
      if (parseInt(option.dataset.variantOptionIndex, 10) === i) {
        return true;
      }

      return false;
    });

    if (optionValues) {
      const fragment = document.createDocumentFragment();
      const { option, wrappers, values } = optionValues;

      for (let j = values.length - 1; j >= 0; j--) {
        const wrapper = wrappers[j];
        const optionValue = values[j];
        const { value } = optionValue;

        const { available } = value in optionsAccessibility[i]
          ? optionsAccessibility[i][value]
          : false;
        const { accessible } = value in optionsAccessibility[i]
          ? optionsAccessibility[i][value]
          : false;
        const isChooseOption = value === 'not-selected'; // Option element to indicate unchosen option

        // Disable unavailable options
        optionValue.disabled = (
          isChooseOption
          || (disableUnavailableOptions && !accessible)
        );
        optionValue.dataset.variantOptionAccessible = accessible;
        optionValue.dataset.variantOptionAvailable = available;

        if (!removeUnavailableOptions || (accessible || isChooseOption)) {
          fragment.insertBefore(wrapper, fragment.firstElementChild);
        }
      }

      option.innerHTML = '';
      option.appendChild(fragment);

      const chosenValue = values.find(value => value.selected || value.checked);

      option.dataset.variantOptionChosenValue = chosenValue && chosenValue.value !== 'not-selected'
        ? chosenValue.value
        : false;
    }
  }
}

export {
  updateOptions,
  setSelectedOptions,
  getOptions,
  getOptionsAccessibility,
  getSelectedOptions,
  getVariantFromSelectedOptions,
};
