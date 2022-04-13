window.PXUTheme.loadScript = function (name, url, callback) {
  if (window.PXUTheme.theme[name]) {
    callback;
  } else {
    $.ajax({
      url: url,
      dataType: 'script',
      success: callback,
      async: false
    });
  }
}
