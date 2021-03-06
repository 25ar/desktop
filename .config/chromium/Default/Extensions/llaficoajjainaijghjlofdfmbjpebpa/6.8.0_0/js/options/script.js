window.addEventListener( "unload", function(){

  fvdSpeedDial.Options.destroy();

}, false );

window.addEventListener("load", function( event ){
  fvdSpeedDial.Localizer.localizeCurrentPage();

  fvdSpeedDial.Options.init();

  fvdSpeedDial.ContextMenus.init();

  var linkToSd = document.getElementById( "linkToSD" );

  setTimeout( function(){
    linkToSd.style.top = "-50px";
    linkToSD.addEventListener("webkitTransitionEnd", function(){

      setTimeout(function(){
        linkToSd.setAttribute( "blackshadow", "1" );
      }, 500);


    }, false);
  }, 1000 );


  // set events

  document.getElementById("linkToSD").addEventListener( "click", function(){
    document.location='newtab.html';
  }, false );

  document.getElementById("buttonBigSettings").addEventListener( "click", function(){
    fvdSpeedDial.Options.setType('global');
  }, false );

  document.getElementById("buttonBigSpeedDial").addEventListener( "click", function(){
    fvdSpeedDial.Options.setType('speeddial');
  }, false );

  document.getElementById("buttonBigMostVisited").addEventListener( "click", function(){
    fvdSpeedDial.Options.setType('mostvisited');
  }, false );

  document.getElementById("buttonBigRecentlyClosed").addEventListener( "click", function(){
    fvdSpeedDial.Options.setType('recentlyclosed');
  }, false );

  document.getElementById("buttonBigBackground").addEventListener( "click", function(){
    fvdSpeedDial.Options.setType('bg');
  }, false );

  document.getElementById("buttonBigSdFontColors").addEventListener( "click", function(){
    fvdSpeedDial.Options.setType('fonts');
  }, false );

  document.getElementById("buttonBigSdSync").addEventListener( "click", function(){
    fvdSpeedDial.Options.syncOptionsOpen();
  }, false );

  document.getElementById("buttonBigSdGetSatisfaction").addEventListener( "click", function(){
    fvdSpeedDial.Options.openGetSatisfactionSuggestions();
  }, false );

  document.getElementById("buttonBigSdDonate").addEventListener( "click", function( event ){
    fvdSpeedDial.Options.openDonateMessage(event);
  }, false );

  document.getElementById("buttonBigSdPowerOff").addEventListener( "click", function( event ){
    fvdSpeedDial.Options.setType('poweroff');
  }, false );

  try{
    document.getElementById("buttonBigSdWidgets").addEventListener( "click", function( event ){
      fvdSpeedDial.Options.setType('widgets');
    }, false );
  }
  catch( ex ){

  }

  document.getElementById("settingsContent").addEventListener( "scroll", function( event ){
    document.getElementById("settingsContent").scrollLeft = 0;
  }, false );


  document.getElementById("importExport_export").addEventListener( "click", function( event ){
    if( !fvdSpeedDial.Options.dontAllowIfLocked() ){
      return;
    }
    fvdSpeedDial.Dialogs.importExport({type:'export'});
  }, false );

  document.getElementById("importExport_import").addEventListener( "click", function( event ){
    if( !fvdSpeedDial.Options.dontAllowIfLocked() ){
      return;
    }
    fvdSpeedDial.Dialogs.importExport({type:'import'});
  }, false );

  document.getElementById("sdButtonManageDeny").addEventListener( "click", function( event ){
    if( !fvdSpeedDial.Options.dontAllowIfLocked() ){
      return;
    }
    fvdSpeedDial.Dialogs.manageDeny();
  }, false );

  document.getElementById("displayPlusCellsHelp").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("displayPlusCellsHelp"), '/images/help/display_plus_cells.png', event);
  }, false );

  document.getElementById("displayQuickMenuHelp").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("displayQuickMenuHelp"), '/images/help/show_clicks_and_quick_menu.png', event);
  }, false );

  document.getElementById("displayShowInContextMenuHelp").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("displayShowInContextMenuHelp"), '/images/help/display_in_context_menu.png', event);
  }, false );


  document.getElementById("displayDialBackgroundHelp").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("displayDialBackgroundHelp"), '/images/help/hide_background.png', event)
  }, false );

  document.getElementById("buttonManageGroups").addEventListener( "click", function( event ){
    if( !fvdSpeedDial.Options.dontAllowIfLocked() ){
      return;
    }
    fvdSpeedDial.Dialogs.manageGroups({callback:function(result){ if(result){ fvdSpeedDial.Options.rebuildGroupsList() } }});
  }, false );

  document.getElementById("buttonResetSDClicks").addEventListener( "click", function( event ){
    fvdSpeedDial.Dialogs.confirm(_("options_confirm_reset_clicks_title"), _("options_confirm_reset_clicks_text"), function(res) {
      if(res) {
        fvdSpeedDial.Storage.resetAllDialsClicks(function() {
          fvdSpeedDial.Dialogs.alert(_("options_success_reset_clicks_title"), _("options_success_reset_clicks_text"));
        });
      }
    });
  }, false );

  document.getElementById("bg_color").addEventListener( "change", function( event ){
    fvdSpeedDial.Options.refreshBg();
    document.getElementById('bg_useColor').checked = true;
  }, false );

  document.getElementById("bg_imageType").addEventListener( "change", function( event ){
    fvdSpeedDial.Options.refreshBgViewType();
  }, false );

  document.getElementById("backgroundUploadButton").addEventListener( "click", function( event ){
    document.getElementById("backgroundUploadButton").getElementsByTagName('input')[0].click();
  }, false );

  document.getElementById("uploadBackgroundFile").addEventListener( "change", function( event ){
    fvdSpeedDial.Options.selectLocalBackground();
  }, false );

  document.getElementById("btnLoadAndPreview").addEventListener( "click", function( event ){
    fvdSpeedDial.Options.bgLoadAndPreview();
  }, false );



  document.getElementById("backgroundButtonRestoreDefault").addEventListener( "click", function( event ){
    fvdSpeedDial.Options.bgRestoreDefault();
  }, false );

  document.getElementById("helpListElemColor").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("helpListElemColor"), '/images/help/text_list_elem_color.png', event)
  }, false );

  document.getElementById("helpShowUrlTitleColor").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("helpShowUrlTitleColor"), '/images/help/text_list_show_url_title_color.png', event);
  }, false );

  document.getElementById("helpTextListLinkColor").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("helpTextListLinkColor"), '/images/help/text_list_link_color.png', event);
  }, false );

  document.getElementById("helpTextOtherkColor").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(document.getElementById("helpTextOtherkColor"), '/images/help/text_other_color.png', event);
  }, false );


  document.getElementById("helpListFvdSpeedDial").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(event.target, '/images/help/fvd_speed_dial_tooltip.png', event)
  }, false );

  document.getElementById("helpListFvdSync").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(event.target, '/images/help/fvd_eversync_tooltip.png', event)
  }, false );

  document.getElementById("helpListEverHelper").addEventListener( "click", function( event ){
    fvdSpeedDial.ToolTip.displayImage(event.target, '/images/help/fvd_everhelper_tooltip.png', event)
  }, false );


  document.getElementById("fontsButtonRestoreDefault").addEventListener( "click", function( event ){
    fvdSpeedDial.Options.fontsRestoreDefaults();
  }, false );

  document.getElementById("applyChangesButton").addEventListener( "click", function( event ){
    if( !fvdSpeedDial.Options.dontAllowIfLocked() ){
      return;
    }
    fvdSpeedDial.Options.applyChanges();
  }, false );

  document.getElementById("buttonCloseButton").addEventListener( "click", function( event ){
    fvdSpeedDial.Options.close();
  }, false );

  document.getElementById("installThemesForChrome").addEventListener( "click", function( event ){
    chrome.tabs.create({
      url: "http://fvdmedia.com/to/s/chrome_thm/",
      active: true
    });
  }, false );

  document.getElementById("setAuthoPreview_setPreview").addEventListener( "click", function( event ){
    fvdSpeedDial.Options.setAutoPreviewGlobally();
  }, false );

  // fix number fields limit
  var numberInputs = document.querySelectorAll( "input[type=\"number\"]" );

  for( var i = 0; i != numberInputs.length; i++ ){
    var numberInput = numberInputs[i];
    (function( numberInput ){

      numberInput.addEventListener( "input", function(){

        var max = parseInt( numberInput.getAttribute( "max" ) );
        var min = parseInt( numberInput.getAttribute( "min" ) );

        if( !isNaN(max) && numberInput.value > max ){
          numberInput.value = max;
        }
        else if( !isNaN(max) && numberInput.value < min ){
          numberInput.value = min;
        }

        if( isNaN( numberInput.value ) || numberInput.value === "" ){
          numberInput.value = 1;
        }

        fvdSpeedDial.Options._changeOption( numberInput );

      }, false );

    })( numberInput );
  }

}, false);
