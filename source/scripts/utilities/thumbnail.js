class ProductCard {
  enableSwatches() {
    if (window.isScreenSizeLarge()) {
      $('body').on('mouseenter', '.swatch span', ({ currentTarget }) => {
        if (
          $(currentTarget)
            .data('image')
            .indexOf('no-image') === -1
        ) {
          $(currentTarget)
            .parents('.thumbnail')
            .find('.product__imageContainer img:not(.secondary)')
            .attr('src', $(currentTarget).data('image'));
          $(currentTarget)
            .parents('.thumbnail')
            .find('.product__imageContainer img:not(.secondary)')
            .attr('srcset', $(currentTarget).data('image'));
        }
      });
    }
  }

  showVariantImage() {
    if (window.isScreenSizeLarge()) {
      $('body').on('mouseenter', '.has-secondary-image-swap', ({ currentTarget }) => {
        const $thumbnailImage = $(currentTarget).find('.product-image__wrapper img');
        const $thumbnailVideo = $(currentTarget).find('.product-image__wrapper .video-on-hover');

        if ($thumbnailImage) {
          $thumbnailImage.toggleClass('swap--visible');
        }

        if ($thumbnailVideo) {
          $thumbnailVideo.toggleClass('swap--visible');
          window.PXUTheme.video.enableVideoOnHover($(currentTarget));
        }
      });

      $('body').on('mouseleave', '.has-secondary-image-swap', ({ currentTarget }) => {
        const $thumbnailImage = $(currentTarget).find('.product-image__wrapper img');
        const $thumbnailVideo = $(currentTarget).find('.product-image__wrapper .video-on-hover');

        if ($thumbnailImage) {
          $thumbnailImage.toggleClass('swap--visible');
        }

        if ($thumbnailVideo) {
          $thumbnailVideo.toggleClass('swap--visible');
          window.PXUTheme.video.disableVideoOnHover($(currentTarget));
        }
      });
    }
  }

  showQuickShop() {
    // EVENT - click on quick-shop
    $('body').on('click', '.js-quick-shop-link', e => {
      e.preventDefault();

      const $currentTarget = $(e.currentTarget);

      window.PXUTheme.jsProductClass
        .load($currentTarget.data('url'))
        .then(({ html }) => {

          $('.js-quick-shop').html(html.content);
          $('.js-quick-shop .js-product_section').addClass('quickshop');

          if (!$('.fancybox-active').length) {
            $.fancybox.open($('.js-quick-shop'), {
              baseClass: `quick-shop__lightbox product-${$currentTarget.data('id')}`,
              hash: false,
              infobar: false,
              toolbar: false,
              loop: true,
              smallBtn: true,
              touch: false,
              video: {
                autoStart: false,
              },
              mobile: {
                preventCaptionOverlap: false,
                toolbar: true,
              },
              afterShow: (_e, instance) => {
                // Use unique identifier for the product gallery
                const { src } = instance;
                const $quickshop = $(src).find('.quick-shop');

                window.PXUTheme.jsProduct.init($('.js-quick-shop'));
                $quickshop.addClass('quick-shop--loaded');
                $quickshop.addClass('content-loaded');

                if ($('.quickshop .tabs').length > 0) {
                  window.PXUTheme.tabs.enableTabs();
                }
              },
              beforeClose: (_e, instance) => {
                // Use unique identifier for the product gallery
                const { src } = instance;
                const $quickshop = $(src).find('.quick-shop');

                $quickshop.removeClass('quick-shop--loaded');
                $quickshop.removeClass('content-loaded');
              },
            });
          }
        }).catch(error => console.error(e));
    });
  }
}

window.PXUTheme.thumbnail = new ProductCard();
