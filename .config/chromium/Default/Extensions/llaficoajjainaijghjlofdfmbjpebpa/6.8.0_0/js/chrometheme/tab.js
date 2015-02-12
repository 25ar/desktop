(function() {
  var ChromeThemeClient = function(){

    var _theme = null;

    function displayChangeBgWindow( themeId ){
      chrome.runtime.sendMessage({
        action: "chrometheme:getthemedata",
        themeId: themeId
      }, function(theme) {
        _theme = theme;
        fvdSpeedDial.SpeedDialMisc.showOptions( "offerAdjustBgToTheme", null, null, {
          top: 20,
          left: document.body.clientWidth/2 - document.getElementById("offerAdjustBgToTheme").offsetWidth / 2
        }, true );
        document.getElementById( "themeBackgroundAdjustPreview" ).setAttribute("src", theme.thumbUrl);
      });
    }

    function _onThemeBgAvailable( themeId ){

      displayChangeBgWindow( themeId );

    }

    this.setPrefsForCurrentAppliedTheme = function() {
      chrome.runtime.sendMessage("chrometheme:setprefsforcurrentappliedtheme");
    };

    chrome.runtime.onMessage.addListener(function(msg) {
      if(msg.action == "chrometheme:themebgavailable") {
        _onThemeBgAvailable(msg.themeId);
      }
    });

    window.addEventListener( "load", function(){
      var btnApply = document.getElementById( "applyThemeBg" );
      var btnCancel = document.getElementById( "cancelThemeBg" );
      var thumb = document.getElementById( "themeBackgroundAdjustPreview" );
      var thumbContainer = document.getElementById("themeBackgroundAdjustPreviewContainer");

      // set events
      if(btnApply) {
        btnApply.addEventListener( "click", function() {

          btnApply.setAttribute("hidden", true);
          btnCancel.setAttribute("hidden", true);
          thumbContainer.setAttribute( "loading", 1 );

          chrome.runtime.sendMessage({
            action: "chrometheme:usebg",
            theme: _theme
          }, function() {
            fvdSpeedDial.SpeedDial.refreshBackground();
            fvdSpeedDial.SpeedDialMisc.hideOptions();

            setTimeout(function(){
              thumbContainer.removeAttribute( "loading" );
              btnApply.removeAttribute( "hidden" );
              btnCancel.removeAttribute( "hidden" );
            }, 500);
          });
        } );
      }
      if(btnCancel) {
        btnCancel.addEventListener( "click", function(){
          chrome.runtime.sendMessage({
            action: "chrometheme:donotshowcurrentthemeoffer"
          });
          fvdSpeedDial.SpeedDialMisc.hideOptions();
        } );
      }
      if(btnApply && btnCancel) {
        chrome.runtime.sendMessage({
          action: "chrometheme:needofferthemebg"
        }, function(resp) {
          if( resp.need ) {
            setTimeout( function() {
              displayChangeBgWindow( resp.themeId );
            }, 3000 );
          }
        });
      }
    } );

  };
  fvdSpeedDial.ChromeThemeClient = new ChromeThemeClient();
})();