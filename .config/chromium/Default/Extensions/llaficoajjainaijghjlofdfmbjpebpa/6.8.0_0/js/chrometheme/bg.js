(function() {
  var ChromeTheme = function() {
    var self = this;
    var LS_PREFIX = "chrometheme_";
    var themesConfig = null;

    // fires events:
    // chrometheme:themebgavailable

    function loadThemesConfig( callback ){

      fvdSpeedDial.Utils.getUrlContent( chrome.extension.getURL( "data/themes.json" ), function( content ){

        themesConfig = JSON.parse( content );

        if( callback ){
          callback();
        }

      } );

    }

    function _set( key, value ){
      localStorage[ LS_PREFIX + key ] = value;
    }

    function _get( key ){
      return localStorage[ LS_PREFIX + key ];
    }

    function restoreDefault(){

      var currentSdTheme = fvdSpeedDial.Prefs.get("sd.display_mode");

      var url = fvdSpeedDial.Prefs._themeDefaults[currentSdTheme]["sd.background_url"];

      function _end(){

        for( var k in fvdSpeedDial.Prefs._themeDefaults[currentSdTheme] ){
          fvdSpeedDial.Prefs.set( k, fvdSpeedDial.Prefs._themeDefaults[currentSdTheme][k] );
        }

        _set( "last_offered_theme_id", "" );
        _set( "current_bg_theme_id", "" );

      }

      if( url ){

        fvdSpeedDial.Utils.imageUrlToDataUrl( url, function( du ){

          fvdSpeedDial.Storage.setMisc( "sd.background", du, function(){
            _end();
          });

        } );

      }
      else{
        _end();
      }

    }

    function currentThemeId( callback ){
      if( _get( "last_installed_theme" ) ){
        return callback( _get( "last_installed_theme" ) );
      }

      chrome.management.getAll( function( exts ){

        var themeId = null;

        for( var i = 0; i != exts.length; i++ ){

          var ext = exts[i];

          if( ext.type == "theme" ){
            themeId = ext.id;
          }

        }

        callback( themeId );

      } );
    }

    function getThemeData( themeId ){
      for( var i = 0; i != themesConfig.length; i++ ){
        if( themesConfig[i].id == themeId ){
          return themesConfig[i];
        }
      }
      return null;
    }

    this.useThemeBg = function( theme, callback ) {

      fvdSpeedDial.Utils.imageUrlToDataUrl( theme.bgUrl, function( du ){

        self.doNotShowCurrentThemeOffer();

        fvdSpeedDial.Storage.setMisc( "sd.background", du, function(){
          fvdSpeedDial.Prefs.set( "sd.background_url", "<customFile>" );
          fvdSpeedDial.Prefs.set( "sd.background_url_type", "fill" );

          _set( "current_bg_theme_id", theme.id );

          if( callback ){

            self.setPrefsForCurrentAppliedTheme();

            callback();
          }
        });

      } );

    };

    this.setPrefsForCurrentAppliedTheme = function(){

      var currentAppliedThemeId = _get( "current_bg_theme_id" );

      if( currentAppliedThemeId ){
        var theme = self.getThemeData( currentAppliedThemeId );

        if( theme.prefs ){
          for( var k in theme.prefs ){
            fvdSpeedDial.Prefs.set( k, theme.prefs[k] );
          }
        }
      }

    };

    this.getThemeData = function( themeId ){
      var data = getThemeData( themeId );

      data.bgUrl = this.getThemeBgUrl( themeId );
      data.thumbUrl = "http://fvdspeeddial.com/themes/" + themeId + "/thumb.png";

      return data;
    };

    this.getThemeBgUrl = function( themeId ){

      var data = getThemeData( themeId );

      var url = "http://fvdspeeddial.com/themes/" + themeId;

      var bgFilePath = "";

      if( typeof data.bgFilePath == "string" ){
        bgFilePath = data.bgFilePath;
      }
      else{

        var screenWidth = window.screen.width;

        var minDelta = 999999999;
        var minDeltaValue = "";
        var selectedWidth = 0;
        var backgrounds = data.bgFilePath;
        var w;
        var widths = [];
        for( w in backgrounds ){
          widths.push( parseInt(w, 10) );
        }

        widths.sort();

        for( w in backgrounds ){
          var delta = Math.abs( screenWidth - w );
          if( delta === 0 ){
            minDelta = delta;
            minDeltaValue = backgrounds[w];
            selectedWidth = w;
            break;
          }

          if( delta < minDelta ){
            minDelta = delta;
            minDeltaValue = backgrounds[w];
            selectedWidth = w;
          }
        }

        if( minDelta !== 0 && selectedWidth < screenWidth ){
          for( var i = 0; i != widths.length; i++ ){
            w = widths[i];
            if( w > selectedWidth ){
              selectedWidth = w;
              minDeltaValue = backgrounds[w];
              break;
            }
          }
        }

        bgFilePath = minDeltaValue;

      }

      if( bgFilePath ){
        url += bgFilePath;
      }
      else{
        url += "/bg.jpg";
      }

      return url;

    };

    this.needOfferThemeBg = function( callback ){

      currentThemeId( function( themeId ){

        if( !themeId ){
          return callback( false );
        }

        if( _get("last_offered_theme_id") != themeId ){

          if( getThemeData( themeId ) ){
            callback( true, themeId );
          }
          else{
            callback( false );
          }

        }
        else{
          callback( false );
        }
      } );

    };

    // interface
    this.doNotShowCurrentThemeOffer = function(){

      currentThemeId(function( themeId ){
        _set("last_offered_theme_id", themeId);
      });

    };

    window.addEventListener( "load", function(){

      loadThemesConfig(function(){


      });

    } );

    // process specific messages
    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
      if(msg.action == "chrometheme:needofferthemebg") {
        fvdSpeedDial.ChromeTheme.needOfferThemeBg(function(need, themeId) {
          sendResponse({
            need: need,
            themeId: themeId
          });
        });
        return true;
      }
      else if(msg.action == "chrometheme:getthemedata") {
        var data = fvdSpeedDial.ChromeTheme.getThemeData(msg.themeId);
        sendResponse(data);
        return true;
      }
      else if(msg.action == "chrometheme:usebg") {
        fvdSpeedDial.ChromeTheme.useThemeBg(msg.theme, function() {
          sendResponse();
        });
        return true;
      }
      else if(msg.action == "chrometheme:donotshowcurrentthemeoffer") {
        fvdSpeedDial.ChromeTheme.doNotShowCurrentThemeOffer();
      }
      else if(msg.action == "chrometheme:setprefsforcurrentappliedtheme") {
        fvdSpeedDial.ChromeTheme.setPrefsForCurrentAppliedTheme();
      }
    });

    chrome.management.onInstalled.addListener(function( ext ){

      if( ext.type == "theme" ){

        _set( "last_installed_theme", ext.id );

        loadThemesConfig(function(){

          _set("last_offered_theme_id", "");

          self.needOfferThemeBg( function( need, themeId ){

            if( need ){
              chrome.runtime.sendMessage({
                action: "chrometheme:themebgavailable",
                themeId: themeId
              });
            }

          } );

        });

      }

    });

    chrome.management.onUninstalled.addListener(function( id ){

      _set( "last_installed_theme", "" );

      if( _get( "current_bg_theme_id" ) == id ){
        restoreDefault();
      }

    });

  };

  fvdSpeedDial.ChromeTheme = new ChromeTheme();
})();