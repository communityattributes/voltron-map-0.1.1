//= require voltron

Voltron.addModule('Map', function(){
  'use strict';

  var _maps = {},
      _markers = {},
      _windows = {},
      _initialized = false;

  var _loader = $.Deferred();

  var _config = {
    libraries: ['places'],
    key: Voltron.getConfig('map/key')
  };

  var Map = (function(options){

    var _id = $.now(),
        _map = null,
        _last = null;

    return {
      initialize: function(){
        Voltron('Map/onApiLoad').done($.proxy(function(){
          // default options are defined here rather than up above because the `google` object
          // does not exist until after the api loads, and our default center requires it
          var _defaults = { bind: null, map: {
              zoom: 17,
              center: new google.maps.LatLng(0, 0),
              disableDefaultUI: true
            }
          };

          options = $.extend(true, _defaults, options);

          this.getMap();
          this.enable();
        }, this));
        $(options.bind).data('map', this);
        return this;
      },

      getId: function(){
        return _id;
      },

      getContainer: function(){
        return $(options.bind);
      },

      getMap: function(){
        if(_map == null){
          _map = new google.maps.Map(this.getContainer().get(0), options.map);
          this.addEventsFor('Map', _map);
        }
        return _map;
      },

      fitToMarkers: function(){
        var bounds = new google.maps.LatLngBounds();
        $.each(_markers, function(index, marker){
          bounds.extend(marker.getPosition());
        });
        this.getMap().fitBounds(bounds);
        return this;
      },

      /**
       * Open an info window at the defined position (LatLng object, Array of lat/lng, address)
       * by default the window will not be visible. It is assumed that the developer will call `.open()`
       * on the returned infowindow object. Opening the window requires the google map object as the first
       * argument. Example (where <map> is an instance of a map object as returned by `Voltron('Map/new')`
       * and <marker> is optionally a marker object created from `addMarker` that the info window should appear above):
       *
       * var infoWin = <map>.addInfoWindow('123 Fake St', 'Hello World', { InfoWindowOption: 'value' });
       * infoWin.open(<map>.getMap(), <marker>);
       *
       * @see https://developers.google.com/maps/documentation/javascript/infowindows
       */
      addInfoWindow: function(position, content, opts){
        if(typeof content == jQuery) content = content.get(0);

        var infoOptions = $.extend({ content: content, position: new google.maps.LatLng(0, 0) }, opts);
        var infoWindow = new google.maps.InfoWindow(infoOptions);

        this.getPosition(position).done(function(location){
          infoWindow.setPosition(location);
          _windows[location.lat().toString() + location.lng().toString()] = infoWindow;
        });

        this.addEventsFor('InfoWindow', infoWindow);

        return infoWindow;
      },

      removeInfoWindow: function(place){
        this.getPosition(place).done(function(location){
          if(_windows[location.lat().toString() + location.lng().toString()]){
              _windows[location.lat().toString() + location.lng().toString()].setMap(null);
              delete _windows[location.lat().toString() + location.lng().toString()];
            }
        });
        return this;
      },

      // See: https://developers.google.com/maps/documentation/javascript/markers#introduction
      addMarker: function(place, opts){
        if(!place) place = this.getMap().getCenter();

        var markerOptions = $.extend(true, { position: new google.maps.LatLng(0, 0) }, opts);
        var marker = new google.maps.Marker(markerOptions);

        this.getPosition(place).done(function(location){
          marker.setPosition(location);
          marker.setMap(this.getMap());
          _markers[location.lat().toString() + location.lng().toString()] = marker;
        });

        this.addEventsFor('Marker', marker);

        return marker;
      },

      removeMarker: function(marker){
        this.getPosition(marker).done(function(location){
          if(_markers[location.lat().toString() + location.lng().toString()]){
              _markers[location.lat().toString() + location.lng().toString()].setMap(null);
              delete _markers[location.lat().toString() + location.lng().toString()];
            }
        });
        return this;
      },

      setZoom: function(zoom){
        this.getMap().setZoom(zoom);
        return this;
      },

      setCenter: function(place){
        if(typeof place == 'string'){
          Voltron('Map/getLocation', { address: place }, this).done(function(places){
            this.getMap().setCenter(Voltron('Map/getLatLong', places[0]));
          });
        }else{
          this.getMap().setCenter(Voltron('Map/getLatLong', place));
        }
        return this;
      },

      getPosition: function(place){
        var dfr = $.Deferred();
        var self = this;

        if(typeof place == 'string'){
          Voltron('Map/getLocation', { address: place }, this).done(function(places){
            dfr.resolveWith(self, [places[0].geometry.location]);
          });
          return dfr.promise();
        }else{
          return dfr.resolveWith(self, [Voltron('Map/getLatLong', place)]);
        }
      },

      onEventTriggered: function(event){
        return $.proxy(function(){
          this.getContainer().trigger(event, arguments);
        }, this);
      },

      addEventsFor: function(type, obj){
        if($.isArray(google.maps[type].events)){
          $.each(google.maps[type].events, $.proxy(function(index, evt){
            google.maps.event.addListener(obj, evt, this.onEventTriggered([type.toLowerCase(), evt].join(':')));
          }, this));
        }
        return this;
      },

      enable: function(previous){
        if(_last !== null && previous !== false){
          this.setCenter(_last.coordinate).setZoom(_last.zoom);
          this.getMap().setOptions(_last.options);
        }
        $.each(_markers, $.proxy(function(index, marker){
          marker.setMap(this.getMap());
        }, this));
        $.each(_windows, $.proxy(function(index, win){
          win.setMap(this.getMap());
        }, this));
        this.getContainer().removeClass('map-disabled');
        return this;
      },

      disable: function(){
        _last = {
          coordinate: this.getMap().getCenter(),
          zoom: this.getMap().getZoom(),
          options: {
            draggable: this.getMap().get('draggable'),
            zoomControl: this.getMap().get('zoomControl'),
            scrollwheel: this.getMap().get('scrollwheel'),
            disableDoubleClickZoom: this.getMap().get('disableDoubleClickZoom')
          }
        };
        $.each(_markers, function(index, marker){
          marker.setMap(null);
        });
        $.each(_windows, function(index, win){
          win.setMap(null);
        });
        this.setCenter([0, 0]).setZoom(1);
        this.getMap().setOptions({ draggable: false, zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true });
        this.getContainer().addClass('map-disabled');
        return this;
      }
    };
  });

  return {
    initialize: function(){
      if(!_initialized){
        this.addJsApi();
        Voltron('Dispatch/addEventWatcher', 'place_changed', 'place');
        this.addMapEvents();
      }
    },

    setConfig: function(options){
      _config = $.extend(_config, options);
      return this;
    },

    addJsApi: function(){
      var url = 'https://maps.googleapis.com/maps/api/js?callback=onVoltronMapApiLoad&key=' + _config.key + '&libraries=' + $.makeArray(_config.libraries).join(',');
      var api = document.createElement('script');
      api.setAttribute('type', 'text/javascript');
      api.setAttribute('async', 'async');
      api.setAttribute('defer', 'defer');
      api.setAttribute('src', url);
      document.getElementsByTagName('head')[0].appendChild(api);
      return this;
    },

    addMapEvents: function(){
      this.onApiLoad().done(function(){
        google.maps.Map.events = ['bounds_changed', 'center_changed', 'click', 'dblclick', 'drag', 'dragend', 'dragstart', 'heading_changed', 'idle', 'maptypeid_changed', 'mousemove', 'mouseout', 'mouseover', 'projection_changed', 'resize', 'rightclick', 'tilesloaded', 'tilt_changed', 'zoom_changed'];
        google.maps.Marker.events = ['animation_changed', 'click', 'clickable_changed', 'cursor_changed', 'dblclick', 'drag', 'dragend', 'draggable_changed', 'dragstart', 'flat_changed', 'icon_changed', 'mousedown', 'mouseout', 'mouseover', 'mouseup', 'position_changed', 'rightclick', 'shape_changed', 'title_changed', 'visible_changed', 'zindex_changed'];
        google.maps.InfoWindow.events = ['closeclick', 'content_changed', 'domready', 'position_changed', 'zindex_changed'];
      });
    },

    // See: https://developers.google.com/maps/documentation/javascript/places-autocomplete
    addAutocomplete: function(element){
      this.onApiLoad().done($.proxy(function(){
        $(element).each(function(){
          var self = $(this);
          var autocomplete = new google.maps.places.Autocomplete(self.get(0));
          autocomplete.addListener('place_changed', function(){
            var place = autocomplete.getPlace();
            place.components = Voltron('Map/getAddressComponents', place.address_components);
            self.trigger('place_changed', place);
          });
        });
      }, this));
    },

    getLatLong: function(input){
      if(input && input.geometry){
        return input.geometry.location;
      }else if(input && input.position){
        return input.position;
      }else if($.isArray(input) && input.length == 2){
        return new google.maps.LatLng(input[0], input[1]);
      }else if($.isPlainObject(input) && input.lat && input.lng){
        return new google.maps.LatLng(input.lat, input.lng);
      }else if(typeof input.lat == 'function' && typeof input.lng == 'function'){
        return input;
      }
      return new google.maps.LatLng(0, 0);
    },

    getAddress: function(input){
      var dfr = $.Deferred();

      if(typeof input == 'string'){
        Voltron('Map/getLocation', { address: input }, this).done(function(places){
          dfr.resolveWith(this, [this.getAddressComponents(places[0].address_components)]);
        });
      }else if(input.address_components){
        dfr.resolveWith(this, [this.getAddressComponents(input.address_components)]);
      }else{
        Voltron.debug('error', 'Argument passed to Map/getAddress was not a string or an object with an %o key.', 'address_components');
        return dfr.rejectWith(this);
      }
      return dfr.promise();
    },

    getAddressComponents: function(components){
      var address = {};
      if($.isArray(components)){
        $.each(components, function(index, component){
          address[component.types[0]] = {
            long: component.long_name || '',
            short: component.short_name || ''
          };
        });

        address['street'] = [address.street_number.long, address.route.long].join(' ');
        address['city'] = address.locality.long;
        address['region'] = address.administrative_area_level_1.short;
        address['postcode'] = [address.postal_code.long, (address.postal_code_suffix ? address.postal_code_suffix.long : null)].compact().join('-');
        address['country'] = address.country.short;
      }
      return address;
    },

    // See: https://developers.google.com/maps/documentation/javascript/geocoding
    getLocation: function(search, context){
      if(!context) context = Voltron.getModule('Map');
      if(typeof search == 'string') search = { address: search };
      var dfr = $.Deferred();
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(search, function(results, status){
        if(status == google.maps.GeocoderStatus.OK){
          dfr.resolveWith(context, [results]);
        }else if(status == google.maps.GeocoderStatus.ZERO_RESULTS){
          Voltron.debug('info', 'Call to Map/getLocation yielded no results.');
          dfr.rejectWith(context);
        }else if(status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
          Voltron.debug('warn', 'Call to Map/getLocation triggered an %o error. Please check your project in Google to ensure you have enough queries.', 'over query limit');
          dfr.rejectWith(context);
        }else if(status == google.maps.GeocoderStatus.INVALID_REQUEST){
          Voltron.debug('warn', 'Call to Map/getLocation returned an invalid request. Provided search parameters were: %o', search);
          dfr.rejectWith(context);
        }else if(status == google.maps.GeocoderStatus.REQUEST_DENIED){
          Voltron.debug('error', 'Call to Map/getLocation resulted in a %o response.', 'request denied');
          dfr.rejectWith(context);
        }else{
          Voltron.debug('error', 'Call to Map/getLocation an unknown error. Status returned was %o', status);
          dfr.rejectWith(context);
        }
      });
      return dfr.promise();
    },

    new: function(options){
      var map = new Map(options);
      _maps[map.getId()] = map.initialize();
      return map;
    },

    onApiLoad: function(){
      return _loader.promise();
    },

    onApiLoaded: function(){
      _loader.resolve();
      return this;
    }
  };
}, true);

window.onVoltronMapApiLoad = function(){
  Voltron('Map/onApiLoaded');
};