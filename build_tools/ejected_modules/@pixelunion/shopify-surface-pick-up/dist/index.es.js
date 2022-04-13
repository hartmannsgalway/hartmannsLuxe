function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

var LOCAL_STORAGE_KEY = 'pxu-shopify-surface-pick-up';
var loadingClass = 'surface-pick-up--loading';

var isNotExpired = function isNotExpired(timestamp) {
  return timestamp + 1000 * 60 * 60 >= Date.now();
};

var removeTrailingSlash = function removeTrailingSlash(s) {
  return s.replace(/(.*)\/$/, '$1');
}; // Haversine Distance
// The haversine formula is an equation giving great-circle distances between
// two points on a sphere from their longitudes and latitudes


function calculateDistance(latitude1, longitude1, latitude2, longitude2, unitSystem) {
  var dtor = Math.PI / 180;
  var radius = unitSystem === 'metric' ? 6378.14 : 3959;
  var rlat1 = latitude1 * dtor;
  var rlong1 = longitude1 * dtor;
  var rlat2 = latitude2 * dtor;
  var rlong2 = longitude2 * dtor;
  var dlon = rlong1 - rlong2;
  var dlat = rlat1 - rlat2;
  var a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.pow(Math.sin(dlon / 2), 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
}

function getGeoLocation() {
  return _getGeoLocation.apply(this, arguments);
}

function _getGeoLocation() {
  _getGeoLocation = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              var options = {
                maximumAge: 3600000,
                // 1 hour
                timeout: 5000
              };

              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (_ref3) {
                  var coords = _ref3.coords;
                  return resolve(coords);
                }, reject, options);
              } else {
                reject();
              }
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getGeoLocation.apply(this, arguments);
}

function setLocation(_x) {
  return _setLocation.apply(this, arguments);
}

function _setLocation() {
  _setLocation = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref) {
    var latitude, longitude, newData;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            latitude = _ref.latitude, longitude = _ref.longitude;
            newData = {
              latitude: latitude,
              longitude: longitude,
              timestamp: Date.now()
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
            return _context2.abrupt("return", fetch('/localization.json', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                latitude: latitude,
                longitude: longitude
              })
            }).then(function () {
              return {
                latitude: latitude,
                longitude: longitude
              };
            }));

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _setLocation.apply(this, arguments);
}

function getLocation() {
  return _getLocation.apply(this, arguments);
}

function _getLocation() {
  _getLocation = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var requestLocation,
        cachedLocation,
        _args3 = arguments;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            requestLocation = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : false;
            cachedLocation = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

            if (!(cachedLocation && isNotExpired(cachedLocation.timestamp))) {
              _context3.next = 4;
              break;
            }

            return _context3.abrupt("return", cachedLocation);

          case 4:
            if (!requestLocation) {
              _context3.next = 6;
              break;
            }

            return _context3.abrupt("return", getGeoLocation().then(function (coords) {
              setLocation(coords); // We don't need to wait for this

              return coords;
            }));

          case 6:
            return _context3.abrupt("return", null);

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _getLocation.apply(this, arguments);
}

var SurfacePickUp = /*#__PURE__*/function () {
  function SurfacePickUp(el, options) {
    _classCallCheck(this, SurfacePickUp);

    this.el = el;
    this.options = _objectSpread2({
      root_url: window.Theme && window.Theme.routes && window.Theme.routes.root_url || ''
    }, options);
    this.options.root_url = removeTrailingSlash(this.options.root_url);
    this.callbacks = [];
    this.onBtnPress = null;
    this.latestVariantId = null;
  }

  _createClass(SurfacePickUp, [{
    key: "load",
    value: function load(variantId) {
      var _this = this;

      // If no variant is available, empty element and quick-return
      if (!variantId) {
        this.el.innerHTML = '';
        return Promise.resolve(true);
      } // Because Shopify doesn't expose any `pick_up_enabled` data on the shop object, we
      // don't know if the variant might be, or is definitely not available for pick up.
      // Until we know the shop has > 0 pick up locations, we want to avoid prompting the
      // user for location data (it's annoying, and only makes sense to do if we use it).
      //
      // Instead, we have to make an initial request, check and see if any pick up locations
      // were returned, then ask for the users location, then make another request to get the
      // location-aware pick up locations.
      //
      // As far as I can tell the pick up aware locations differ only in sort order - which
      // we could do on the front end - but we're following this approach to ensure future
      // compatibility with any changes Shopify makes (maybe disabling options based on
      // user location, or whatever else).
      //
      // Shopify has indicated they will look into adding pick_up_enabled data to the shop
      // object, which which case this method can be greatly simplifed into 2 simple cases.


      this.latestVariantId = variantId;
      this.el.classList.add(loadingClass);
      return this._getData(variantId).then(function (data) {
        return _this._injectData(data);
      });
    }
  }, {
    key: "onModalRequest",
    value: function onModalRequest(callback) {
      if (this.callbacks.indexOf(callback) >= 0) return;
      this.callbacks.push(callback);
    }
  }, {
    key: "offModalRequest",
    value: function offModalRequest(callback) {
      this.callbacks.splice(this.callbacks.indexOf(callback));
    }
  }, {
    key: "unload",
    value: function unload() {
      this.callbacks = [];
      this.el.innerHTML = '';
    }
  }, {
    key: "_getData",
    value: function _getData(variantId) {
      var _this2 = this;

      return new Promise(function (resolve) {
        var xhr = new XMLHttpRequest();
        var requestUrl = "".concat(_this2.options.root_url, "/variants/").concat(variantId, "/?section_id=surface-pick-up");
        xhr.open('GET', requestUrl, true);

        xhr.onload = function () {
          var el = xhr.response;
          var embed = el.querySelector('[data-html="surface-pick-up-embed"]');
          var itemsContainer = el.querySelector('[data-html="surface-pick-up-items"]');
          var items = itemsContainer.content.querySelectorAll('[data-surface-pick-up-item]');
          resolve({
            embed: embed,
            itemsContainer: itemsContainer,
            items: items,
            variantId: variantId
          });
        };

        xhr.onerror = function () {
          resolve({
            embed: {
              innerHTML: ''
            },
            itemsContainer: {
              innerHTML: ''
            },
            items: [],
            variantId: variantId
          });
        };

        xhr.responseType = 'document';
        xhr.send();
      });
    }
  }, {
    key: "_injectData",
    value: function _injectData(_ref2) {
      var _this3 = this;

      var embed = _ref2.embed,
          itemsContainer = _ref2.itemsContainer,
          items = _ref2.items,
          variantId = _ref2.variantId;

      if (variantId !== this.latestVariantId || items.length === 0) {
        this.el.innerHTML = '';
        this.el.classList.remove(loadingClass);
        return;
      }

      this.el.innerHTML = embed.innerHTML;
      this.el.classList.remove(loadingClass);
      var calculatedDistances = false;

      var calculateDistances = function calculateDistances() {
        if (calculatedDistances) return Promise.resolve();
        return getLocation(true).then(function (coords) {
          items.forEach(function (item) {
            var distanceEl = item.querySelector('[data-distance]');
            var distanceUnitEl = item.querySelector('[data-distance-unit]');
            var unitSystem = distanceUnitEl.dataset.distanceUnit;
            var itemLatitude = parseFloat(distanceEl.dataset.latitude);
            var itemLongitude = parseFloat(distanceEl.dataset.longitude);

            if (coords && isFinite(itemLatitude) && isFinite(itemLongitude)) {
              var distance = calculateDistance(coords.latitude, coords.longitude, itemLatitude, itemLongitude, unitSystem);
              distanceEl.innerHTML = distance.toFixed(1);
            } else {
              distanceEl.remove();
              distanceUnitEl.remove();
            }
          });
        })["catch"](function (e) {
          console.log(e);
          items.forEach(function (item) {
            var distanceEl = item.querySelector('[data-distance]');
            var distanceUnitEl = item.querySelector('[data-distance-unit]');
            distanceEl.remove();
            distanceUnitEl.remove();
          });
        })["finally"](function () {
          calculatedDistances = true;
        });
      };

      this.el.querySelector('[data-surface-pick-up-embed-modal-btn]').addEventListener('click', function () {
        calculateDistances().then(function () {
          return _this3.callbacks.forEach(function (callback) {
            return callback(itemsContainer.innerHTML);
          });
        });
      });
    }
  }]);

  return SurfacePickUp;
}();

export default SurfacePickUp;
