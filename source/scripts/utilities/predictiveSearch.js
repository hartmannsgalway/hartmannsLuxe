window.PXUTheme.predictiveSearch = {
  vars: {
    term: '',
    searchPath: window.PXUTheme.routes.search_url,
    displayTimer: ''
  },
  init: function() {

    this.unload();

    $('[data-show-search-trigger], [data-autocomplete-true] input').on('click touchstart', function(e) {
      if(!isScreenSizeLarge()) {
        e.stopPropagation();
        const formType = $(this).closest('form').find('[name="type"]').val();
        const position = $(document).scrollTop();
        window.PXUTheme.predictiveSearch.showMobileSearch(formType, position);
      }
    });

    // Focus state to display search results
    $('[data-autocomplete-true]').on('focus', function() {
      $(this).parents('[data-autocomplete-true]').find('.search__results-wrapper').show();
    });

    // Clicking outside makes the results disappear.
    $(document).on('click focusout', function(e) {
      if (window.PXUTheme.media_queries.large.matches) {
        var searchForm = $(e.target).parents('.search-form');

        if(searchForm.length === 0) {
          $('[data-autocomplete-true] .search__results-wrapper').hide().removeClass('results-found');
        }
      }
    });

    // Submit wildcard searches
    $("[data-autocomplete-true] form").on("submit", function(e) {
      e.preventDefault();
      const formValue = $(this).find('input[name="q"]').val();
      const cleanFormValue = encodeURI(formValue);
      let searchType = window.PXUTheme.theme_settings.search_option;

      if ($(this).find('[name="type"]').length > 0) {
        searchType = $(this).find('[name="type"]').val();
      }

      if (cleanFormValue == null) {
        window.location.href = window.PXUTheme.routes.search_url + '?type=' + searchType;
      } else {
        window.location.href = window.PXUTheme.predictiveSearch.vars.searchPath + '?type=' + searchType + '&q=' + cleanFormValue + '*';
      }
    });

    $('[data-autocomplete-true] form').each(function() {
      const $this = $(this);
      const input = $this.find('input[name="q"]');

      // Adding a list for showing search results.
      const resultWrapper = `
        <div class="search__results-wrapper">
          <h2 class="vertical-search__title">
            ${window.PXUTheme.translation.top_suggestions}
          </h2>
          <ul class="search__results"></ul>
        </div>
      `;

      $(resultWrapper).appendTo($this);

      input.attr('autocomplete', 'off').on('input', function() {
        clearTimeout(window.PXUTheme.predictiveSearch.vars.displayTimer);
        if ($(this).val().length > 3) {
          window.PXUTheme.predictiveSearch.vars.term = $(this).val();
          window.PXUTheme.predictiveSearch.getResults(window.PXUTheme.predictiveSearch.vars.term, $this);
        } else {
          $('[data-autocomplete-true] .search__results-wrapper').hide().removeClass('results-found');
        }
      });
    });
  },
  getResults: function(term, $this) {

    let searchType = window.PXUTheme.theme_settings.search_option;

    if ($this.find('[name="type"]').length > 0) {
      searchType = $this.find('[name="type"]').val();
    }

    jQuery.getJSON("/search/suggest.json", {
      "q": term,
      "resources": {
        "type": searchType,
        "limit": window.PXUTheme.theme_settings.search_to_display,
        "options": {
          "unavailable_products": "last",
          "fields": "title,body,variants.title,variants.sku,vendor,product_type,tag"
        }
      }
    }).done(function(response) {

      const suggestions = [
        response.resources.results.products,
        response.resources.results.pages,
        response.resources.results.articles
      ];

      let filteredResults = [];

      // Store results in array
      $.each(suggestions, function(index, suggestion) {
        if (suggestion !== undefined && suggestion.length > 0) { // Ensure suggestion exists
          filteredResults.push(suggestion)
        }
      })

      // Display results
      window.PXUTheme.predictiveSearch.vars.displayTimer = setTimeout(function(){
        window.PXUTheme.predictiveSearch.displayResults(filteredResults[0], $this);
      }, 500)

    });
  },
  displayResults: function(results, $this) {
    const $resultsWrapper = $this.find('.search__results-wrapper');
    const $resultsList = $this.find('.search__results');
    let searchType = window.PXUTheme.theme_settings.search_option;
    $resultsWrapper.show();
    $resultsList.empty();

    if ($this.find('[name="type"]').length > 0) {
      searchType = $this.find('[name="type"]').val();
    }

    if (results && results.length > 0) {

      $.each(results, function(index, result) {

        let link = $('<a tabindex="0"></a>').attr('href', result.url);
        if (window.PXUTheme.routes.root_url !== '/') {
          link = $('<a tabindex="0"></a>').attr('href', window.PXUTheme.routes.root_url + result.url);
        }

        // if result is a product
        if (result['price']) {


          function formatPrice(price) {
            if (Currency.display_format === 'money_with_currency_format') {
              return `<span class="money"> ${window.PXUTheme.currency.symbol}${price} ${window.PXUTheme.currency.iso_code} </span>`;
            } else {
              return `<span class="money"> ${window.PXUTheme.currency.symbol}${price} </span>`;
            }
          }

          let itemPrice;

          if (result.available === true) {
            if(result.compare_at_price_max > result.price_max || result.compare_at_price_min > result.price_min ) {
              itemPrice = `${formatPrice(result.price)} <span class="was-price">${formatPrice(result.compare_at_price_max)}</span>`;
            } else {
              if (result.price > 0) {
                if (result.price_min != result.price_max) {
                  itemPrice = `${window.PXUTheme.translation.from} ${formatPrice(result.price)}` ;
                } else {
                  itemPrice = `${formatPrice(result.price)}`;
                }
              } else {
                itemPrice = window.PXUTheme.theme_settings.free;
              }
            }
          } else {
            itemPrice = window.PXUTheme.translation.soldOut;
          }

          // If result has image
          if (result['image']) {
            link.append(`<div class="thumbnail"><img class="lazyload transition--${window.PXUTheme.theme_settings.image_loading_style}" src="${window.PXUTheme.addImageDimension(result['image'], '_300x')}" /></div>`);
          }

          link.append(`<div class="description"><strong>${result.title}</strong><br><span class="item-pricing price">${itemPrice}</span></div>`);

          // if result is an article
        } else if(result['summary_html']) {

          if(result.image != 'NULL') {
            link.append(`<div class="thumbnail"><img class="lazyload transition--${window.PXUTheme.theme_settings.image_loading_style}" src="${window.PXUTheme.addImageDimension(result['image'], '_300x')}" /></div>`);
          }
          link.append(`<div class="description"><strong>${result.title}</strong><br><span class="item-description">'${result.summary_html.replace(/(<([^>]+)>)/ig,"").slice(0, 25)}</span></div>`);

          // if result is a page
        } else if(result['published_at']) {

          link.append(`<div class="description"><strong>${result.title}</strong><br><span class="item-description">${result.body.replace(/(<([^>]+)>)/ig,"").slice(0, 25)}</span></div>`);

        }

        // Wrap link and append to list
        link.wrap('<li class="item-result"></li>');
        $resultsList.append(link.parent());

        if (window.PXUTheme.currencyConverter) {
          window.PXUTheme.currencyConverter.init();
        }
      });

      $resultsList.prepend(`<li class="all-results"><span class="see-all"><a href="${this.vars.searchPath}?type=${searchType}&q=${this.vars.term}*"> ${window.PXUTheme.translation.all_results} ${window.PXUTheme.icons.right_caret}</a></span></li>`);
      $resultsList.parents('.search__results-wrapper').addClass('results-found');

    } else {
      // if no results
      const noResults = `<li class="item-result"><span class="no-results">${window.PXUTheme.translation.no_results}</span></li>`;
      $resultsList.append(noResults);
      $resultsList.parents('.search__results-wrapper').removeClass('results-found');
    }

    if ($this.parents('.vertical-header__content').length && window.PXUTheme.jsHeader.header_layout === 'vertical') {
      window.PXUTheme.predictiveSearch.alignVerticalSearch();
    }

    $resultsList.show();
  },
  showMobileSearch: function(formType, position) {
    $('body').css('max-height', window.innerHeight);
    $('.mobile-search').fadeIn(200);

    if(/iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      $('.mobile-search input[data-q]').focus();
    } else {
      //Set delay to ensure focus triggers on android
      setTimeout(function() {
        $('.mobile-search input[data-q]').focus();
      }, 205);
    }

    document.body.style.position = 'fixed';
    document.body.style.top = '-' + position + 'px';
    $('.mobile-search').css('top', position)

    const searchHeight = window.innerHeight - 46; //Full screen height - form height
    $('.mobile-search .search__results-wrapper').css('max-height', searchHeight)

    if (formType) {
      $('.mobile-search [name="type"]').val(formType);
    } else {
      $('.mobile-search [name="type"]').val(window.PXUTheme.theme_settings.search_option);
    }

    $('.search-form .close-search').on('click touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.PXUTheme.predictiveSearch.hideMobileSearch(position);
      $('[data-autocomplete-true] .search__results-wrapper').hide().removeClass('results-found');
    });

    $('.search-form .submit-search').on('click touchstart', function(e) {
      $(this).parents('form').submit();
    });
  },
  hideMobileSearch: function(position) {
    $('body').css('max-height', 'none');

    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo(0, position);

    $('.mobile-search').fadeOut(200);
    $('.mobile-search [name="q"]').val('');

    $('body').off('focus', '.search-form .close-search');
    $('body').off('focus', '.search-form .submit-search');
  },
  alignVerticalSearch: function() {
    const $resultsList = $('.header--vertical .search__results');
    const headerWidth = $('.header--vertical').innerWidth();
    $resultsList.parents('.search__results-wrapper').css({
      'position': 'fixed',
      'left': headerWidth,
      'top': '0'
    });
  },
  unload: function() {
    $('body').off('focus', '[data-autocomplete-true] input');
    $('input[name="q"]').off();
    $('[data-dropdown-rel="search"], [data-autocomplete-true] input').off();
    $('.search__results-wrapper').remove();
  }
}
