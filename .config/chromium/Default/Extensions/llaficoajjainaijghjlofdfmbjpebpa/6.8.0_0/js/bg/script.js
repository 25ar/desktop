window.addEventListener( "load", function(){

  // set install time if need
  if( fvdSpeedDial.Prefs.get("sd.install_time") == null ){
    chrome.runtime.sendMessage({
      action: "first-install"
    });
    fvdSpeedDial.isFirstRunSession = true;
    fvdSpeedDial.Prefs.set("sd.install_time", new Date().getTime());

    fvdSpeedDial.Prefs.set( "widgets.opened", false ); // hide widget tab for new users
    fvdSpeedDial.Prefs.set( "sd.display_superfish", true );

    chrome.management.get("idgeoanibcknhniccgaoaiolihidecjn", function( app ){
      if( app ){
        // speed dial installed by app(maybe)
        return;
      }
      // open home window
      chrome.tabs.create({
        url: "http://fvdmedia.com/to/s/chrome_sp_wlc/",
        active: true
      });
    });


    fvdSpeedDial.Prefs.set( "display_themes_message", false );
    setTimeout( function(){
      fvdSpeedDial.Prefs.set( "display_themes_message", true );
    }, 2 * 60 * 1000 );
  }

  fvdSpeedDial.Localizer.localizeCurrentPage();
  fvdSpeedDial.Storage.MostVisited.init();

  fvdSpeedDial.Storage.connect( function(){
    // rebuild context menu
    fvdSpeedDial.ContextMenu.rebuild();
  } );

  fvdSpeedDial.Storage.addGroupsCallback( function(){
    // rebuild contextmenu for any db change
    fvdSpeedDial.ContextMenu.sheduleRebuild();
  } );

  fvdSpeedDial.Storage.addDialsCallback( function( message ){
    // rebuild contextmenu for any db change
    if( message.action == "remove" ){
      try{
        fvdSpeedDial.HiddenCaptureQueue.removeFromQueueById( message.data.id );
      }
      catch( ex ){

      }
    }
  } );

  // add groups change callback

  fvdSpeedDial.Storage.addGroupsCallback(function( data ){

    if( data.action == "remove" ){

      // check if groups is default group
      if( data.groupId == fvdSpeedDial.Prefs.get( "sd.default_group" ) ){
        fvdSpeedDial.Storage.groupsList(function( groups ){
          var group = groups[0];
          var newId = group.id;

          fvdSpeedDial.Prefs.set( "sd.default_group", newId )
        });
      }
      else{
        // rebuild active speeddial tab
        chrome.runtime.sendMessage( {
          action: "forceRebuild",
          resetActiveGroup: true,
          needDisplayType: "speeddial"
        } );
      }

    }

  });

  // prefs change callback
  function _prefChangeCallback( name, value ){
    if( ["sd.enable_top_sites", "sd.enable_most_visited", "sd.enable_recently_closed"].indexOf(name) != -1 ){

      var enableSpeedDial = _b(fvdSpeedDial.Prefs.get( "sd.enable_top_sites" ));
      var enableMostVisited = _b(fvdSpeedDial.Prefs.get( "sd.enable_most_visited" ));
      var enableRecentlyClosed = _b(fvdSpeedDial.Prefs.get( "sd.enable_recently_closed" ));

      var disabledItems = [];
      if( !enableSpeedDial ){
        disabledItems.push( "speeddial" );
      }
      if( !enableMostVisited ){
        disabledItems.push( "mostvisited" );
      }
      if( !enableRecentlyClosed ){
        disabledItems.push( "recentlyclosed" );
      }

      try{
        var type =  fvdSpeedDial.Utils.arrayDiff(["speeddial", "mostvisited", "recentlyclosed"], disabledItems);
        type = type[0];

        if( disabledItems.indexOf( fvdSpeedDial.Prefs.get("sd.display_type") ) != -1 ){
          // default display type is disabled
          fvdSpeedDial.Prefs.set("sd.display_type", type);
        }
        if( disabledItems.indexOf( fvdSpeedDial.Prefs.get("sd.last_selected_display_type") ) != -1 ){
          // last selected display type is disabled
          fvdSpeedDial.Prefs.set("sd.last_selected_display_type", type);
        }

      }
      catch( ex ){

      }

      // rebuild active newtab
      chrome.runtime.sendMessage( {
        action: "forceRebuild",
        needActiveTab: true
      } );

    }
    else if( name == "sd.scrolling" ){

      fvdSpeedDial.Prefs.set( "sd.recentlyclosed_columns", "auto" );
      fvdSpeedDial.Prefs.set( "sd.top_sites_columns", "auto" );

    }
    else if( name == "sd.display_popular_group" ){

      fvdSpeedDial.Utils.Async.chain([

        function( chainCallback ){
          if( 0 == fvdSpeedDial.Prefs.get( "sd.default_group" ) ){
            fvdSpeedDial.Storage.groupsList(function( groups ){
              var group = groups[0];
              var newId = group.id;

              fvdSpeedDial.Prefs.set( "sd.default_group", newId )

              chainCallback();
            });
          }
          else{
            chainCallback();
          }
        },

        function(){

          // rebuild active speeddial tab
          chrome.runtime.sendMessage( {
            action: "forceRebuild",
            resetActiveGroup: true,
            needDisplayType: "speeddial"
          } );

        }

      ]);

    }
  }

  // init browser action
  chrome.browserAction.onClicked.addListener(function(tab){

    if(tab._ignore){
      return;
    }

    var foundTabId = null;

    fvdSpeedDial.Utils.Async.chain([

      function( chainCallback ){

        chrome.tabs.query( {
          url: "chrome://newtab/"
        }, function( tabs ){

          if( tabs.length > 0 ){

            foundTabId = tabs[0].id;
            foundTabIndex = tabs[0].index;

          }

          chainCallback();

        } );

      },

      function( chainCallback ){

        chrome.tabs.query( {
          url: chrome.extension.getURL( "newtab.html" )
        }, function( tabs ){

          if( tabs.length > 0 ){

            foundTabId = tabs[0].id;

          }

          chainCallback();

        } );


      },

      function(){

        if( !foundTabId ){
          //fvdSpeedDial.Utils.Opener.activeTab( "newtab.html#force-display" );


          chrome.tabs.query( {
            active: true
          }, function( tabs ){

            chrome.tabs.create({
              url: "newtab.html#force-display",
              index: tabs[0].index
            }, function(){

              chrome.tabs.remove( tabs[0].id, function(){

              } );

            });

          } );

        }
        else{
          chrome.tabs.update( foundTabId, {
            active: true
          } );
        }

      }

    ]);


  });

  // force refresh tabs with speed dial

  var refreshUrls = [
    "dragon://newtab/", // Comodo dragon
    "chrome://newtab/"
  ];

  refreshUrls.forEach( function( url ){

    chrome.tabs.query( {
      url: url
    }, function( tabs ){

      for( var i = 0; i != tabs.length; i++ ){
        if(tabs[i].status == "loading") {
          // ignore loading new tabs, maybe is it speed dial loading?
          continue;
        }
        chrome.tabs.update(tabs[i].id, {
          url: chrome.extension.getURL( "newtab.html" )
        });

        /*
        chrome.tabs.reload( tabs[i].id, {
          bypassCache: true
        } );
        */
      }

    } );

  } );


  // adaptations
  if( ["custom", "list"].indexOf( fvdSpeedDial.Prefs.get("sd.thumbs_type") ) == -1 ){
    fvdSpeedDial.Prefs.set( "sd.custom_dial_size", fvdSpeedDial.SpeedDial._cellsSizes[ fvdSpeedDial.Prefs.get("sd.thumbs_type") ] );
    fvdSpeedDial.Prefs.set( "sd.thumbs_type", "custom" );
  }

  if( ["custom", "list"].indexOf( fvdSpeedDial.Prefs.get("sd.thumbs_type_most_visited") ) == -1 ){
    fvdSpeedDial.Prefs.set( "sd.thumbs_type_most_visited", "custom" );
  }



  // surfcanyon listener
  chrome.runtime.onMessage.addListener(function( message, sender, callback ){
    if( message && message.action == "isSurfCanyonEnabled" ){
      callback( _b( fvdSpeedDial.Prefs.get("surfcanyon.enabled") ) );
      return true;
    }
    else if(message.action == "deny:changed") {
      fvdSpeedDial.Storage.RecentlyClosed.checkDenyAll(function(){
        fvdSpeedDial.Storage.refreshDenyDials( function(){
          fvdSpeedDial.Storage.MostVisited.invalidateCache();
          chrome.runtime.sendMessage( {
            action: "forceRebuild",
            needActiveTab: true
          } );
        });
      });
    }
    else if(message.action == "pref:changed") {
      _prefChangeCallback(message.name, message.value);
    }
    else if(message.action == "sync:activitystatechanged") {
      _refreshSyncActivityState();
    }
  });

  // check sync activity state

  function _refreshSyncActivityState(){
    var active = fvdSpeedDial.Sync.isActive();

    fvdSpeedDial.Storage._markRemove = active;
  }

  _refreshSyncActivityState();

  // process auto update dials
  // check every minute
  setInterval(function() {
    fvdSpeedDial.Storage.getDialsToPreviewUpdate(function(dialsToUpdate) {
      dialsToUpdate.forEach(function(dial) {
        fvdSpeedDial.HiddenCaptureQueue.capture({
          saveImage: true,
          id: dial.id,
          url: dial.url,
          type: "speeddial"
        });
      });
    });
  }, 60000);

}, true );