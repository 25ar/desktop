(function(){


  var SpeedDial = function(){

  };

  SpeedDial.prototype = new EventEmitter();

  SpeedDial.prototype = {
    _displayType: null, // (speeddial, mostvisited, recentlyclosed)

    // currently opened group in this speeddial tab
    _nowOpenedGroup: null,
    
    _cellsSizes: {
      "big": 260,
      "medium": 210,
      "small": 150
    },

    _mostVisitedIntervals: [ "all_time", "month", "week" ],

    _displayModesList: ["speeddial", "mostvisited", "recentlyclosed"],

    _topLineHeight: 3,

    _dialBodyPadding: 5, // 5px - is padding in dial body
    _cellsSizeRatio: 1.6,
    _cellsMarginX: 20,

    _cellsMarginY: {
      "standard_speeddial": 70,
      "fancy_speeddial": 30,

      "standard_mostvisited": 70,
      "fancy_mostvisited": 50
    },

    _groupElemMaxWidth: 150,
    _groupElemMargin: 5,
    _groupElemXPadding: 6,
    _groupElemLetterWidth: 6,

    _listElemMarginX: 15,
    _listElemMarginY: 15,
    _listElemSize:{ // for recentlyclosed and speeddial
      height: 15,
      width: 522
    },
    _listElemSizeMostVisited:{ // for mostvisited
      height: 29,
      width: 522
    },

    _needRebuild: false, // sign to need rebuild all dials list
    _needRebuildGroupsList: false, // sign to need rebuild groups listing
    _needCSSRefresh: false,
    _needBackgroundRefresh: false,

    _rebuildCheckerIntervalInst: null,

    _cellsRebuildCallback: null,

    _firstRebuildDone: false,

    justAddedId: null,

    fancySpecialDecrementCount: 0, // this value used for fixing fancy dials list

    // some events
    onBuildCompleted: new EventEmitter(),

    cellsMarginY: function(){

      return this._cellsMarginY[ fvdSpeedDial.Prefs.get( "sd.display_mode" ) + "_" + this.currentDisplayType() ];

    },

    has3D: function(){

      var has = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());

      if( !has ){
        return false;
      }

      if( document.getElementById("test3d").offsetLeft == 0 ){
        return false;
      }

      return true;

    },

    refreshEnableMirrors: function(){

      var sdContent = document.getElementById( "speedDialContent" );
      if( _b( fvdSpeedDial.Prefs.get( "sd.display_mirror" ) ) ){
        sdContent.setAttribute( "enablemirrors", "1" );
      }
      else{
        sdContent.setAttribute( "enablemirrors", "0" );
      }

    },

    init: function(){

      var that = this;
      this.refreshEnableMirrors();

      if( !_b( fvdSpeedDial.Prefs.get("sd.fancy_size_adjusted") ) ){

        if( fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" ){
          fvdSpeedDial.CSS._updateThemeActions( "fancy" );
        }

        var min = this.getMinCellWidth();
        var max = this.getMaxCellWidth();

        var v = max;

        var minCols = fvdSpeedDial.Prefs.get( "sd.fancy_init_min_columns" );

        while( v >= min ){

          fvdSpeedDial.Prefs.set( "sd.custom_dial_size_fancy", v );

          //console.log( v, minCols );

          if( fvdSpeedDial.SpeedDial.cellsInRowMax( "auto", "fancy" ).cols >= minCols ){
            break;
          }

          v--;

        }

        fvdSpeedDial.Prefs.set("sd.fancy_size_adjusted", true);

      }


      // init css adjuster
      fvdSpeedDial.CSS.stylesheets.push( document.styleSheets[0] );

      // immedately actions
      // refresh current type expand state
      this.refreshExpandState();
      // refresh background
      this.refreshBackground();
      // refresh CSS
      this.refreshCSS();

      // start need rebuild checker interval
      this._rebuildCheckerIntervalInst = setInterval( this._needRebuildChecker, 100 );


      window.addEventListener("resize", function( event ){
        that.sheduleRebuild();
        that.sheduleRebuildGroupsList();
      }, true);

      // init drag and drop
      this.DragAndDrop.init();

      setTimeout(function(){
        fvdSpeedDial.ContextMenus.setGlobalMenu( that.currentDisplayType() );
      }, 0);

      // full rebuild when tab activated
      chrome.tabs.onActivated.addListener(function( info ){
        chrome.tabs.getCurrent( function( tab ){
          if( tab.id == info.tabId ) {
            that.sheduleFullRebuild();
          }
        } );
      });

      if( _b(fvdSpeedDial.Prefs.get( "sd.first_dial_page_open" )) ){
        setTimeout( function(){
          fvdSpeedDial.Apps.display();
        }, 0 );
        fvdSpeedDial.Prefs.set( "sd.first_dial_page_open", false );
      }

      this.correctPerspectiveOrigin();

      document.addEventListener("scroll", function(){

        that.correctPerspectiveOrigin();

      }, false);

      document.getElementById( "cbNotDisplayCollapsedWithPowerOff" ).addEventListener("click", function(){

        setTimeout(function(){

          fvdSpeedDial.Prefs.set( "collapsed_message.with_poweroff.display", false );

        }, 0);

      }, false);

      document.getElementById( "cbNotDisplayCollapsedWithoutPowerOff" ).addEventListener("click", function(){

        setTimeout(function(){

          fvdSpeedDial.Prefs.set( "collapsed_message.without_poweroff.display", false );

        }, 0);

      }, false);

      document.querySelector( "#searchBar .rightMenu .showHide" ).addEventListener("click", function(){
        that.toggleExpand();
      }, false);

      document.querySelector( "#speedDialCollapsedContent .aboutPowerOff" ).addEventListener("click", function(){
        window.open( chrome.extension.getURL( "/options.html#poweroff" ) );
      }, false);

      this.refreshCollapsedMessages();

      // foce show group
      var forceShowGroupId = fvdSpeedDial.Utils.getQueryValue( "show_group_id" );

      if( forceShowGroupId ){
        that.setCurrentGroupId( forceShowGroupId );
      }

      // clear hash
      document.location.hash = "#";

      // message listener

      chrome.runtime.onMessage.addListener( function( message ){

        switch( message.action ){
          case "syncStartNotification":
            document.getElementById( "buttonSync" ).setAttribute( "sync", 1 );
          break;
          case "syncEndNotification":
            document.getElementById( "buttonSync" ).removeAttribute( "sync" );
          break;
          case "pref:changed":
            that._prefsListener(message.name, message.value);
          break;
          case "forceRebuild":
            fvdSpeedDial.Utils.Async.chain([
              function(next) {
                if( message.needDisplayType ){
                  if( message.needDisplayType != fvdSpeedDial.SpeedDial.currentDisplayType() ){
                    return;
                  }
                }
                if(!message.needActiveTab) {
                  return next();
                }
                fvdSpeedDial.Utils.isActiveTab(function(active) {
                  if(!active) {
                    return;
                  }
                  next();
                });
              },
              function() {
                fvdSpeedDial.SpeedDial.sheduleFullRebuild();
              }
            ]);
          break;
          case "foundRecentlyClosed":
            fvdSpeedDial.Utils.Async.chain([
              function(next) {
                if(!message.needActiveTab) {
                  return;
                }
                fvdSpeedDial.Utils.isActiveTab(function(active) {
                  if(!active) {
                    return;
                  }
                  next();
                });
              },
              function() {
                if( fvdSpeedDial.SpeedDial.currentDisplayType() == "recentlyclosed" ){
                  fvdSpeedDial.SpeedDial.sheduleFullRebuild();
                }
                else{
                  // else rebuild only misc content
                  fvdSpeedDial.SpeedDialMisc.sheduleRebuild();
                }
              }
            ]);
          break;
        }

      } );

    },

    refreshCollapsedMessages: function(){

      if( !_b( fvdSpeedDial.Prefs.get( "collapsed_message.with_poweroff.display" ) ) ){
        document.querySelector( "#speedDialCollapsedContent .collapsedMessagePoweroffDisabled" ).style.display = "none";
      }

      if( !_b( fvdSpeedDial.Prefs.get( "collapsed_message.without_poweroff.display" ) ) ){
        document.querySelector( "#speedDialCollapsedContent .collapsedMessagePoweroffEnabled" ).style.display = "none";
      }

    },

    getMaxCellWidth: function(){
      var max = 0;
      for( var k in this._cellsSizes ){
        var size = this._cellsSizes[k];
        if( size > max ){
          max = size;
        }
      }

      return max;
    },

    getMinCellWidth: function(){
      var min = 9999;
      for( var k in this._cellsSizes ){
        var size = this._cellsSizes[k];
        if( size < min ){
          min = size;
        }
      }

      return min;
    },

    openSizeSetup: function(){

      window.open( chrome.extension.getURL( "/options.html#setup-custom-size" ) );

    },


    dialRemoveAnimate: function( dialId ){

      var cell = document.getElementById( "dialCell_"+dialId );
      if( cell ){
        var that = this;
        cell.addEventListener( "webkitTransitionEnd", function( event ){
          that.sheduleFullRebuild();
        }, true );

        cell.style.opacity = 0;
        cell.style.webkitTransform = "scale(0.5)";
      }

    },

    dialMoveToGroup: function( dialId, groupId ){

      fvdSpeedDial.Storage.moveDial( dialId, groupId, function( result ){
        if( result.result ){

          fvdSpeedDial.Sync.addDataToSync( {
            category: "dials",
            data: dialId,
            translate: "dial"
          } );

          if( fvdSpeedDial.SpeedDial.currentGroupId() == 0 ){
            fvdSpeedDial.SpeedDial.sheduleFullRebuild();
          }
          else{
            fvdSpeedDial.SpeedDial.dialRemoveAnimate( dialId );
          }

          fvdSpeedDial.Storage.dialGlobalId( dialId, function( dialGlobalId ){

            fvdSpeedDial.Sync.removeSyncData( {
              category: ["deleteDials"],
              data: dialGlobalId
            } );

          });

        }
      } );

    },

    setListViewType: function(){

      var selectedElem = document.querySelector( "[name=listViewType]:checked" );
      var type = null;
      if( selectedElem ){
        type = selectedElem.value;
        fvdSpeedDial.Prefs.set( "sd.list_view_type", type );
      }
      else{
        selectedElem = document.querySelector( "[name=listViewType][value="+fvdSpeedDial.Prefs.get("sd.list_view_type")+"]" );
        selectedElem.checked = true;
        type = selectedElem.value;
      }

      var elements = document.getElementsByClassName( "newtabListElem" );

      var altType = null;
      if( type == "url" ){
        altType = "title";
      }
      else{
        altType = "url";
      }

      for( var i = 0; i != elements.length; i++ ){
        var elem = elements[i];
        var textNode = elem.getElementsByClassName("text")[0];
        textNode.textContent = elem.getAttribute( "_"+type );
        elem.setAttribute( "title", elem.getAttribute( "_"+altType ) );
      }

    },

    refreshSpeedDialWrapperHeight: function(){

      var wrapper = document.getElementById( "speedDialWrapper" );

      wrapper.style.height = "";

      var currentHeight = wrapper.offsetHeight;

      //var topHeight = document.getElementById( "speedDialTop" ).offsetHeight;
      var bodyHeight = document.body.offsetHeight;

      var speedDialHeight = bodyHeight - this._topLineHeight;

      // height that not calcs, it's height of panels that overdraw speed dial content, such as widgets panel
      var extraHeight = 0;
      if( wrapper.hasAttribute("extraheight") ){
        extraHeight = parseInt( wrapper.getAttribute("extraheight") );
      }

      if( currentHeight > speedDialHeight ){
        // no do anything
        wrapper.style.height = currentHeight + 20 - extraHeight + "px";
      }
      else{
        wrapper.style.height = speedDialHeight - extraHeight + "px";
      }

    },

    correctPerspectiveOrigin: function(){

      var originValue = 100;

      originValue += document.body.scrollTop;

      document.getElementById( "cellsContainer" ).style.webkitPerspectiveOrigin = "50% "+originValue+"px";

    },

    correctPerspective: function( params ){

      params = params || {};
      if( !params._correctAttempt ){
        params._correctAttempt = 1;
      }

      if( params._correctAttempt > 10 ){
        return;
      }

      params._correctAttempt++;

      //experimental

      if( !this.getExpandState() ){
        // do not correct for collapsed speed dial
        return;
      }

      var that = this;

      var pers = 600;

      var fixedPerspective = false;

      if( fvdSpeedDial.Prefs.get("sd.display_mode") != "fancy" ){
        fixedPerspective = true;
      }
      else if( this.currentDisplayType() == "mostvisited" ){
      //  fixedPerspective = true;
      }
      else if( this._currentSettingsColumnsCount() != "auto" ){

        var maxCols = that.cellsInRowMax( "auto", null, {
          objects: document.getElementById("cellsContainer").childNodes.length
        } ).cols;

        if( maxCols != this._currentSettingsColumnsCount() ){
          fixedPerspective = true;
        }

      }


      if( fixedPerspective ){
        document.getElementById("cellsContainer").style.webkitPerspective = pers + "px";
        return;
      }

      var iter = 0;

      var that = this;

      var els = document.querySelectorAll(".newtabCell[row='0']");

      var viewPortWidth = that._viewportWidth();

      console.log( viewPortWidth, els.length, that.cellsInRowMax( "auto", null, {
        objects: document.getElementById("cellsContainer").childNodes.length
      } ).cols );

      var el = els[els.length - 1];
      var firstEl = els[0];
      var rect = el.getBoundingClientRect();

      if( rect.right == 0 ){
        // wait for rendering
        setTimeout(function(){
          that.correctPerspective( params );
        }, 0);
        return;
      }

      var lastValueWhenInBorders = 0;
      var alreadyCheckedPers = {};
      var cellsContainer = document.getElementById("cellsContainer");

      while( true ){
        iter++;

        if( iter > 100 || alreadyCheckedPers[pers] > 5 ){
          if( lastValueWhenInBorders ){
            cellsContainer.style.webkitPerspective = lastValueWhenInBorders + "px";
          }
          break;
        }

        if( !alreadyCheckedPers[pers] ){
          alreadyCheckedPers[pers] = 0;
        }
        alreadyCheckedPers[pers]++;

        // correct perspective
        var delta = 20;
        var width = 0;

        var el = els[els.length - 1];

        var rect = el.getBoundingClientRect();

        var normWDelta = 25;
        var wDelta = viewPortWidth - rect.right;

        if( wDelta < normWDelta && wDelta > 0 ){
          break;
        }

        var inBorders = false;

        if( wDelta < 0 ){
          pers += delta;
        }
        else{
          if( firstEl.getBoundingClientRect().left > normWDelta ){
            inBorders = true;
            lastValueWhenInBorders = pers;
          }

          pers -= delta;
        }


        // check side dials max scale
        if( inBorders && rect.width/el.offsetWidth > fvdSpeedDial.Config.FANCY_SIDE_DIALS_MAX_SCALE ){
          break;
        }

        cellsContainer.style.webkitPerspective = pers + "px";

      }

    },

    rebuildCells: function( params ) {
      params = params || {};

      if( !params.doNotZeroFancySpecialDecrementCount ){
        this.fancySpecialDecrementCount = 0;
      }

      var speedDialContent = document.getElementById("speedDialContent");
      speedDialContent.setAttribute("style", fvdSpeedDial.Prefs.get( "sd.display_mode" ));

      // collapse if need
      this.refreshExpandState({
        ifcollapsed: true
      });

      var displayType = this.currentDisplayType();
      var thumbsMode =  this.currentThumbsMode();
      var cellSize = this._currentCellSize();

      document.body.setAttribute( "thumbsmode", thumbsMode );

      var activeScrollingType = fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType();

      // first select need container
      var listContainer = this._listContainer();
      var cellsContainer = this._cellsContainer();

      var container = null;
      var containerId = null;

      //var tmpContainer = document.createElement( "div" );

      var tmpContainer = null;

      // hide containers

      if( this.currentThumbsMode() == "list" ){
        container = listContainer;
        tmpContainer = container.cloneNode( true );
      }
      else{
        container = cellsContainer;
        tmpContainer = container.cloneNode( true );
      }

      // clear container
      while( tmpContainer.firstChild ){
        tmpContainer.removeChild( tmpContainer.firstChild );
      }

      containerId = container.getAttribute("id");

      var that = this;


      var finishBuildCallback = function( params ){

        document.body.setAttribute( "scrollingtype", activeScrollingType );

        if (that.currentThumbsMode() != "list") {

          var containerSize = that._dialsAreaSize({
            objects: tmpContainer.childNodes.length
          });

          if( containerSize.width ){
            tmpContainer.style.width = containerSize.width + "px";
          }

        }

        if( that._cellsRebuildCallback ) {
          that._cellsRebuildCallback();
        }

        if( displayType == "recentlyclosed" ){
          document.getElementById( "groupsWidthSetter" ).setAttribute( "hidden", true );
        }
        else{
          document.getElementById( "groupsWidthSetter" ).removeAttribute( "hidden" );
        }

        if( thumbsMode == "list" ){
          cellsContainer.setAttribute( "hidden", true );
          document.getElementById("listContainerParent").removeAttribute("hidden");
        }
        else{
          listContainer.setAttribute( "hidden", true );
          document.getElementById("listContainerParent").setAttribute("hidden", true);
        }

        // magick
        container.parentNode.replaceChild( tmpContainer, container );
        tmpContainer.removeAttribute("hidden");

        setTimeout( function(){
          that.refreshExpandState();
        }, 0 );

        if( thumbsMode == "list" ){
          // hide all list view menus
          var listViewMenus = document.getElementsByClassName( "listViewMenu" );

          for( var i = 0; i != listViewMenus.length; i++ ){
            listViewMenus[i].setAttribute( "hidden", true );
          }

          document.getElementById( "listNoItemsToDisplay" ).setAttribute("hidden", true);
          if( params ){
            if(params.noitems){
              document.getElementById( "listNoItemsToDisplay" ).removeAttribute("hidden");
              document.getElementById("listViewTypeSelector").setAttribute("hidden", true);
              return;
            }
          }

          document.getElementById("listViewTypeSelector").removeAttribute("hidden");

          //if( displayType == "speeddial" ){
          var listContainerParent = document.getElementById("listContainerParent");
          var size = that.Builder.listViewContainerSize( tmpContainer, countInRow );

          tmpContainer.style.height = size.height + "px";
          tmpContainer.style.width = size.width + "px";

          if( size.width != 0 ){
            listContainerParent.style.width = size.width + "px";
          }

          //}

          that.setListViewType();

          var neededMenu = document.getElementById( displayType+"ListViewMenu" );
          neededMenu.removeAttribute( "hidden" );
        }
        else{
          document.getElementById("listViewTypeSelector").setAttribute("hidden", true);

          // correct perspective
          that.correctPerspective();

          if( fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "vertical" ){
            tmpContainer.style.height = fvdSpeedDial.SpeedDial.Builder.cellsContainerHeight( tmpContainer.childNodes.length, that.cellsInRowMax(null, null, {
              objects: tmpContainer.childNodes.length
            }).cols, cellSize ) + "px";
          }
        }

        // set height of speeddial wrapper
        //that.refreshSpeedDialWrapperHeight();

        if( fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" && !that.has3D() ){

          if( _b( fvdSpeedDial.Prefs.get("sd.no3d_first") ) ){
            fvdSpeedDial.Prefs.set("sd.no3d_first", false);
            return fvdSpeedDial.Prefs.set("sd.display_mode", "standard");
          }


          document.getElementById("cellsContainer").setAttribute( "hidden", true );
          document.getElementById("listContainer").setAttribute( "hidden", true );

          document.getElementById("no3dmessage").removeAttribute("hidden");

        }
        else{
          document.getElementById("no3dmessage").setAttribute("hidden", true);
        }

        that.Builder.refreshLastRow();

        that.onBuildCompleted.callListeners();

      };

      if( thumbsMode == "list" ){
        tmpContainer.style.height = "";
      }
      else{

      }

      var countInRow = null;

      var gridParams = this.cellsInRowMax();

      countInRow = gridParams.cols;

      //console.log( "REBUILD ", countInRow );

      if( this.currentDisplayType() == "speeddial" ){
        var groupId = this.currentGroupId();
        var order = null;
        var limit = null;
        if(parseInt(groupId, 10) === 0) {
          order = "`clicks` DESC";
          limit = fvdSpeedDial.Prefs.get( "sd.all_groups_limit_dials" );
        }
        if( this.currentThumbsMode() != "list" ){

          var displayDialBg = fvdSpeedDial.Prefs.get( "sd.display_dial_background" );
          fvdSpeedDial.Storage.listDials( order, groupId, limit, function( data ) {
            gridParams = that.cellsInRowMax( null, null, {
              objects: data.length
            } );

            if( fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "horizontal" && !gridParams.rows ){
              activeScrollingType = "vertical";
            }

            countInRow = gridParams.cols;

            if( gridParams.rows ){
              countInRow = Math.ceil( data.length / gridParams.rows );

              if( _b(fvdSpeedDial.Prefs.get( "sd.display_plus_cells" )) ){
                countInRow++;
              }
            }

            var i = 0;

            var countRowsFilled = Math.ceil( data.length / countInRow );

            tmpContainer.setAttribute( "rows", countRowsFilled );

            var lastRow = [];

            var plusCellsCount = countRowsFilled * countInRow - data.length;

            for( ; i != data.length; i++ ){

              data[i].displayDialBg = displayDialBg;

              var cell = that.Builder.cell( data[i], i, countInRow, displayType, thumbsMode, cellSize, countRowsFilled );

              if( plusCellsCount != 0 && cell.getAttribute("row") == countRowsFilled - 1 ){
                lastRow.push( cell );
              }

              var needAnimateAppear = false;

              if( data[i].id == that.justAddedId ){
                // need to animate dial appearing
                //cell.style.webkitTransform += " scale(0)";
                cell.style.opacity = 0;
                that.justAddedId = null;

                needAnimateAppear = true;
              }

              tmpContainer.appendChild( cell );

              if( needAnimateAppear ){
                (function( cell ){
                  setTimeout(function(){
                    cell.style.webkitTransform = cell.style.webkitTransform.replace( "scale(0)", "" );
                    cell.style.opacity = "";

                    // scroll to new dial if this is not visible
                    fvdSpeedDial.Utils.scrollToElem( cell );
                  }, 0);
                })( cell );

              }
            }

            if( _b(fvdSpeedDial.Prefs.get( "sd.display_plus_cells" )) ){
              // add plus cells

              if( plusCellsCount == 0 ){
                plusCellsCount = countInRow;
              }


              for( var j = 0; j != plusCellsCount; j++, i++ ){
                var cell = that.Builder.plusCell( i, countInRow, cellSize, countRowsFilled );
                cell.setAttribute("id", "plus_cell_" + j);
                tmpContainer.appendChild( cell );
                lastRow.push( cell );
              }
            }

            //var mirrorNodes = that.Builder.makeMirrorsList( lastRow, containerSize.width );

            /*
            mirrorNodes.forEach(function( mirrorNode ){
              tmpContainer.appendChild( mirrorNode );
            });
            */

            //tmpContainer.appendChild( mirrorNodes );

            finishBuildCallback();

          } );

        }
        else{

          fvdSpeedDial.Storage.listDials( order, groupId, limit, function( data ){

            var countInCol = that.Builder.listElemCountInCol( countInRow, data.length );

            for( var i = 0; i != data.length; i++ ){
              var elem = that.Builder.listElem( i, countInCol, data[i], displayType );
              tmpContainer.appendChild( elem );
            }

            finishBuildCallback();

          });

        }
      }
      else if( this.currentDisplayType() == "mostvisited" ){

        var interval = this.currentGroupId();
        if (this.currentThumbsMode() != "list") {

          fvdSpeedDial.Storage.MostVisited.getData( {
            interval: interval,
            type: "host",
            count: fvdSpeedDial.Prefs.get( "sd.max_most_visited_records" )
          }, function( data ){

            if( gridParams.rows ){
              countInRow = Math.ceil( data.length / gridParams.rows );
            }

            for( var i = 0; i != data.length; i++ ){

              var row = data[i];

              (function( i ){
                fvdSpeedDial.Storage.MostVisited.extendData( row, function( mvData ){

                  var cell = that.Builder.cell( mvData, i, countInRow, displayType, thumbsMode, cellSize );
                  tmpContainer.appendChild( cell );

                  if( i == data.length - 1 ){
                    finishBuildCallback();
                  }

                } );
              })( i );

            }
            if(!data.length){
              finishBuildCallback();
            }
          });
        }
        else{

          fvdSpeedDial.Storage.MostVisited.getData( {
            interval: interval,
            type: "host",
            count: fvdSpeedDial.Prefs.get( "sd.max_most_visited_records" )
          }, function( data ) {

            var countInCol = that.Builder.listElemCountInCol( countInRow, data.length );

            for( var i = 0; i != data.length; i++ ){

              var row = data[i];

              (function( i ){
                fvdSpeedDial.Storage.MostVisited.extendData( row, function( mvData ){
                  var cell = that.Builder.listElem( i, countInCol, mvData, displayType );
                  console.log(cell.getAttribute("row"), cell);
                  tmpContainer.appendChild( cell );

                  if( i == data.length - 1 ){
                    finishBuildCallback();
                  }

                } );
              })( i );

            }
            if(!data.length){
              finishBuildCallback( {
                noitems: true
              } );
            }
          } );

        }



      }
      else if( this.currentDisplayType() == "recentlyclosed" ){

        fvdSpeedDial.Storage.RecentlyClosed.getData({
          count: fvdSpeedDial.Prefs.get( "sd.max_recently_closed_records" )
        }, function( data ){
          var countInCol = that.Builder.listElemCountInCol( countInRow, data.length );
          for( var i = 0; i != data.length; i++ ){
            var row = data[i];

            var cell = that.Builder.listElem( i, countInCol, data[i], displayType );
            tmpContainer.appendChild( cell );
          }
          finishBuildCallback({
            noitems: data.length == 0
          });
        });
      }



    },

    removeGroup: function( groupId, callback, params ){

      var removeFromBase = function(){

        fvdSpeedDial.Utils.Async.chain( [

          function( chainCallback ){

            fvdSpeedDial.Sync.addDataToSync({
              category: "deleteGroups",
              data: groupId,
              translate: "group"
            }, function(){

              fvdSpeedDial.Storage.groupDelete( groupId, function(){

                chainCallback();

              } );

            } );

          },

          function( chainCallback ){

            // first remove all dials in group
            fvdSpeedDial.Storage.listDials( null, groupId, null, function( dials ){

              fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, apCallback ){

                fvdSpeedDial.Storage.deleteDial( dial.id );

                apCallback();

              }, function(){

                if( callback ){
                  callback( true );
                }

              } );



            } );

          }


        ] );


      };

      fvdSpeedDial.Storage.groupsCount(function(countGroups){

        if (countGroups == 1) {
          fvdSpeedDial.Dialogs.alert(_("dlg_alert_cannot_remove_group_title"), _("dlg_alert_cannot_remove_group_text"));
          if( callback ){
            callback( false );
          }
        }
        else {
          fvdSpeedDial.Storage.getGroup(groupId, function(group){
            if (group != null) {

              if ( group.count_dials == 0 || (params && params.noConfirmIfHaveDials) ) {
                removeFromBase();
                if( callback ){
                  callback( true );
                }
              }
              else {
                fvdSpeedDial.Dialogs.confirm(_("dlg_confirm_remove_group_title"), _("dlg_confirm_remove_group_text").replace("%count%", group.count_dials), function(result){

                  if (result) {
                    removeFromBase();
                  }
                  if( callback ){
                    callback( result );
                  }

                });
              }

            }
          });
        }

      });
    },

    currentGroupId: function() {
      if( this.currentDisplayType() == "speeddial" ){
        if(this._nowOpenedGroup !== null) {
          return this._nowOpenedGroup;
        }
        var id = fvdSpeedDial.Prefs.get( "sd.default_group" );
        // if -1 get last opened group
        if( id == -1 ){
          id = fvdSpeedDial.Prefs.get("sd.last_opened_group");
        }
        this._nowOpenedGroup = id;
        return id;
      }
      else if( this.currentDisplayType() == "mostvisited" ){
        return fvdSpeedDial.Prefs.get( "sd.most_visited_interval" );
      }
      else{
        return null;
      }
    },

    setCurrentGroupId: function( id ) {
      if( this.currentDisplayType() == "speeddial" ){
        if( this.currentGroupId() == id ){
          return;
        }
        this._nowOpenedGroup = id;
        fvdSpeedDial.Prefs.set("sd.last_opened_group", id);
      }
      else if( this.currentDisplayType() == "mostvisited" ){
        if( this.currentGroupId() == id ){
          return;
        }
        fvdSpeedDial.Prefs.set( "sd.most_visited_interval", id );
      }
      else{
        return;
      }

      this.sheduleRebuild();
      this.sheduleRebuildGroupsList();
    },

    setCurrentThumbsMode: function( mode ){

      switch( this.currentDisplayType() ){
        case "speeddial":
          fvdSpeedDial.Prefs.set( "sd.thumbs_type", mode );
        break;
        case "mostvisited":
          fvdSpeedDial.Prefs.set( "sd.thumbs_type_most_visited", mode );
        break;
      }

    },

    currentThumbsMode: function(){
      switch( this.currentDisplayType() ){
        case "speeddial":
          return fvdSpeedDial.Prefs.get("sd.thumbs_type");
        break;
        case "mostvisited":
          return fvdSpeedDial.Prefs.get("sd.thumbs_type_most_visited");
        break;
        case "recentlyclosed":
          // always list
          return "list";
        break;
      }
    },

    cirlceDisplayType: function( direction ){
      direction = direction || 1;

      var list = this._displayModesList.slice();

      if( !_b( fvdSpeedDial.Prefs.get( "sd.enable_top_sites" ) ) ){
        var index = list.indexOf( "speeddial" );
        list.splice( index, 1 );
      }
      if( !_b( fvdSpeedDial.Prefs.get( "sd.enable_recently_closed" ) ) ){
        var index = list.indexOf( "recentlyclosed" );
        list.splice( index, 1 );
      }
      if( !_b( fvdSpeedDial.Prefs.get( "sd.enable_most_visited" ) ) ){
        var index = list.indexOf( "mostvisited" );
        list.splice( index, 1 );
      }


      var mode = this.currentDisplayType();
      var modeIndex = list.indexOf( mode );
      var nextModeIndex = modeIndex + direction;
      if( nextModeIndex >= list.length ){
        nextModeIndex = 0;
      }
      else if( nextModeIndex < 0 ){
        nextModeIndex = list.length - 1;
      }

      var nextMode = list[nextModeIndex];

      this.setCurrentDisplayType( nextMode );
    },

    setCurrentDisplayType: function( type ){
      this._displayType = type;
      fvdSpeedDial.Prefs.set( "sd.last_selected_display_type", type );

      fvdSpeedDial.ContextMenus.setGlobalMenu( type );



      this.sheduleFullRebuild();
      this.refreshShowHideButton();
    },

    currentDisplayType: function(){
      if( this._displayType == null ){

        if( fvdSpeedDial.Prefs.get( "sd.display_type" ) == "last_selected" ){
          this._displayType = fvdSpeedDial.Prefs.get( "sd.last_selected_display_type" );
        }
        else{
          this._displayType = fvdSpeedDial.Prefs.get( "sd.display_type" );
        }

      }

      return this._displayType;
    },

    cellsInRowMax: function( settingsColumnsCount, displayMode, additional ){
      displayMode = displayMode || fvdSpeedDial.Prefs.get( "sd.display_mode" );

      additional = additional || {};
      if( typeof additional.objects == "undefined" ){
        additional.objects = -1;
      }
      else if( typeof additional.objects == "function" ){
        additional.objects = additional.objects();
      }

      settingsColumnsCount = settingsColumnsCount || this._currentSettingsColumnsCount();

      var countRows = null;

      if( this.currentThumbsMode() == "list" ){

        if( settingsColumnsCount != "auto" ){
          var autoCount = this.cellsInRowMax( "auto" ).cols;

          if( settingsColumnsCount > autoCount ){
            settingsColumnsCount = autoCount;
          }

          return {
            cols: settingsColumnsCount
          };
        }

        var documentWidth = this._viewportWidth();

        var count = Math.floor( documentWidth / (this._listElemSize.width + this._listElemMarginX) );

        if( count <= 0 ){
          count = 1;
        }

        return {
          cols: count
        };

      }
      else{

        if( settingsColumnsCount != "auto" ){

          if( fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "horizontal" ){
            return {
              rows: settingsColumnsCount
            }
          }
          else{
            return {
              cols: settingsColumnsCount
            }
          }

        }

        var documentWidth = this._viewportWidth();

        var sdWrapper = document.getElementById( "speedDialWrapper" );

        var documentHeight = this._viewportHeightForHorizScroll();

        // reduce height of overdraw panels
        if( sdWrapper.hasAttribute("extraheight") ){
          documentHeight -= parseInt( sdWrapper.getAttribute("extraheight") );
        }

        var cellSize = this._currentCellSize();

        var cellsMarginY = this.cellsMarginY();

        var effectiveCellSize = cellSize.height;

        //if( _b( fvdSpeedDial.Prefs.get( "sd.show_urls_under_dials" ) ) ){
          effectiveCellSize += 34;
        //}

        //if( _b( fvdSpeedDial.Prefs.get( "sd.show_icons_and_titles_above_dials" ) ) ){
          effectiveCellSize += 21;
        //}

        countRows = Math.floor( documentHeight / (effectiveCellSize + this._cellsMarginX) );

        var count = Math.floor( documentWidth / (cellSize.width + this._cellsMarginX) );

        if( displayMode == "fancy" ){
          count--;

          if( this.fancySpecialDecrementCount ){
            count -= this.fancySpecialDecrementCount;
          }
        }

        if( count <= 0 ){
          count = 1;
        }

        if (fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "horizontal") {

          if( additional.objects >= 0 ){

            if( countRows * count > additional.objects ){
              // work as with vertical mode
              countRows = null;
            }

          }

        }
        else{
          countRows = null;
        }


      }

      var result = {
        cols: count,
        rows: countRows
      };

      // fixing fancy mode displaying if number of cols more than count displaying dials
      if( displayMode == "fancy" && !_b( fvdSpeedDial.Prefs.get("sd.display_plus_cells") ) && result.cols && additional.objects >= 0 ){

        if( result.cols > additional.objects ){
          result.cols = additional.objects;
        }

      }


      return result;
    },

    sheduleRebuild: function(){
      this._needRebuild = true;
    },

    sheduleFullRebuild: function( params ){
      fvdSpeedDial.SpeedDialMisc.sheduleRebuild();
      this.sheduleRebuildGroupsList();
      this.sheduleRebuild();
    },

    // type = (speeddial, mostvisited)
    makeThumb: function( dialId, url, type, delay, saveImage ){
      if( typeof saveImage == "undefined" ){
        saveImage = true;
      }
      var that = this;
      chrome.tabs.getSelected(null, function(tab) {
        fvdSpeedDial.ThumbMaker.screenTab({
          tabId: tab.id,
          type: type,
          dialId: dialId,
          width: that.getMaxCellWidth(),
          url: url,
          delay: delay,
          saveImage: saveImage
        });
        chrome.tabs.update( tab.id, {
          url: url
        } );
      });
    },

    openAllDialsInGrop: function( groupId ){

      var that = this;

      // open all dials in group in background tab
      fvdSpeedDial.Storage.listDials( null, groupId, null, function( dials ){
        try{
          for( var i = 0; i != dials.length; i++ ){
            fvdSpeedDial.Utils.Opener.backgroundTab( dials[i].url );
            that.addDialClick( dials[i].id );
          }
        }
        catch( ex ){

        }
      });

    },

    refreshAllDialsInGroup: function( groupId ){
      var that = this;

      if( groupId == 0 ){

        fvdSpeedDial.Storage.listDials( "", groupId, fvdSpeedDial.Prefs.get("sd.all_groups_limit_dials"),
          function( dials ){

          var ids = [];

          dials.forEach(function( dial ){
            ids.push( dial.id );
          });

          fvdSpeedDial.Storage.resetAutoDialsForGroup( {
            ids: ids
          }, function(){

            that.sheduleRebuild();

          } );

        } );

      }
      else{
        fvdSpeedDial.Storage.resetAutoDialsForGroup( {
          groupId: groupId
        }, function(){

          that.sheduleRebuild();

        } );
      }

    },

    addDialClick: function( dialId ){

      var that = this;

      fvdSpeedDial.Storage.getDial( dialId, function( data ){
        if( !data ){
          return false;
        }

        var newClicks = data.clicks + 1;
        fvdSpeedDial.Storage.updateDial( dialId, {
          clicks: newClicks
        }, function(){
          try{
            var cell = that._getSpeedDialCellById( dialId );
            var clicksCount = cell.getElementsByClassName("clicksCount")[0];
            clicksCount.textContent = newClicks;
          }
          catch( ex ){

          }
        } );
      } );

    },


    /* Groups */


    sheduleRebuildGroupsList: function(){
      this._needRebuildGroupsList = true;
    },

    Groups: {
      rebuildGroupsList: function(){
        // for speed dial we build groups list with add button
        // for most visited we build three options: all time, last month, last week
        // for recently closed build nothing
        var that = fvdSpeedDial.SpeedDial;
        var isAdditionalListOpened = false;
        try{
          if( document.getElementsByClassName( "additionalGroupsList" )[0].getAttribute("active") == 1 ){
            isAdditionalListOpened = true;
          }
        }
        catch( ex ){
        }

        document.getElementById("speedDialGroupsWrapper").setAttribute( "type", that.currentDisplayType() );

        var groupsBox = document.getElementById( "groupsBox" );

        var tmpContainer = groupsBox.cloneNode( true );
        // remove childs
        while( tmpContainer.firstChild ){
          tmpContainer.removeChild( tmpContainer.firstChild );
        }

        if( that.currentDisplayType() == "speeddial" ){

          var countInPopularGroup = 0;

          fvdSpeedDial.Utils.Async.chain( [

            function( chainCallback ){

              if (_b(fvdSpeedDial.Prefs.get("sd.display_popular_group"))) {

                fvdSpeedDial.Storage.countDials( {
                  uniqueUrl: true
                }, function( count ){

                  countInPopularGroup = Math.min( fvdSpeedDial.Prefs.get( "sd.all_groups_limit_dials" ), count );

                  chainCallback();

                });

              }
              else{
                chainCallback();
              }

            },

            function(){

              fvdSpeedDial.Storage.groupsList(function( groups ){
                // check if current group found
                var currentGroupId = fvdSpeedDial.SpeedDial.currentGroupId();
                var groupFound = false;
                for(var i = 0; i != groups.length; i++) {
                  if(groups[i].id == currentGroupId) {
                    groupFound = true;
                    break;
                  }
                }
                if(currentGroupId == 0) {
                  // popular group always exists
                  groupFound = true;
                }
                if(!groupFound) {
                  // group not found, try to set first group in list to current
                  if(!groups.length) {
                    // do nothing
                    return;
                  }
                  fvdSpeedDial.SpeedDial.setCurrentGroupId(groups[0].id);
                  // and rebuild dial with new group
                  fvdSpeedDial.SpeedDial.sheduleFullRebuild();
                  return;
                }

                // first add popular group if need
                if( _b(fvdSpeedDial.Prefs.get( "sd.display_popular_group" )) ){

                  var item = fvdSpeedDial.SpeedDial.Builder.Groups.item( _("newtab_popular_group_title") + " (" + countInPopularGroup + ")", 0 );
                  // add context menu
                  fvdSpeedDial.ContextMenus.assignToElem( item, "speeddialGroup" );

                  tmpContainer.appendChild( item );

                }

                var groupsBoxMaxWidth = that._viewportWidth() - 430;

                var groupsActiveWidth = 0;
                var maxGroupsInMainList = 0;

                if( _b(fvdSpeedDial.Prefs.get( "sd.display_popular_group" )) ){
                  groupsActiveWidth += that._groupElemXPadding * 2 + that._groupElemLetterWidth * item.textContent.length + that._groupElemMargin;
                }

                for( var i = 0; i != groups.length; i++ ){
                  var groupSize = (groups[i].name + "("+groups[i].count_dials+")").length * that._groupElemLetterWidth + that._groupElemXPadding * 2 +  + that._groupElemMargin;
                  if( groupSize > that._groupElemMaxWidth ){
                    groupSize = that._groupElemMaxWidth;
                  }
                  groupsActiveWidth += groupSize;

                  if( groupsActiveWidth >= groupsBoxMaxWidth ){
                    break;
                  }

                  maxGroupsInMainList++;
                }

                //console.log(groupsBoxMaxWidth, groupsActiveWidth);

                var groupsInMainListCount = maxGroupsInMainList;

                var groupsInMainList = groups.splice( 0, groupsInMainListCount );
                var groupsInAdditionalList = groups;

                for( var i = 0; i != groupsInMainList.length; i++ ){
                  item = fvdSpeedDial.SpeedDial.Builder.Groups.item( groupsInMainList[i].name, groupsInMainList[i].id, groupsInMainList[i].count_dials );
                  fvdSpeedDial.ContextMenus.assignToElem( item, "speeddialGroup" );
                  tmpContainer.appendChild( item );
                }

                if( groupsInAdditionalList.length > 0 ){
                  // add button for open additional groups list
                  var additionalGroupsButton = fvdSpeedDial.SpeedDial.Builder.Groups.additionalGroupsButton();
                  tmpContainer.appendChild( additionalGroupsButton );

                  var additionalList = fvdSpeedDial.SpeedDial.Builder.Groups.additionalList( groupsInAdditionalList );
                  additionalList.setAttribute( "active", 0 );

                  tmpContainer.appendChild( additionalList );
                }

                // add group add item
                item = document.createElement( "div" );
                item.setAttribute( "class", "group add" );
                var image = document.createElement( "div" );
                image.setAttribute( "class", "image" );
                item.appendChild( image );

                item.addEventListener( "click", function( event ){
                  fvdSpeedDial.Dialogs.addGroup();
                }, true );

                tmpContainer.appendChild( item );

                groupsBox.parentNode.replaceChild( tmpContainer, groupsBox );

                if( isAdditionalListOpened ){
                  that.Groups.displayAdditionalList({
                    disableAnimation: true
                  });
                }

              });

              setTimeout( function(){
                fvdSpeedDial.ContextMenus.rebuildSpeedDialCellMenu();
              }, 0 );

              try{
                var currentGroupId = that.currentGroupId();
                var item = document.getElementById( "group_select_"+currentGroupId );
                document.getElementById( "groupsBoxContainer" ).scrollLeft = item.offsetLeft;
              }
              catch( ex ){

              }

            }


          ] );

        }
        else if( that.currentDisplayType() == "mostvisited" ){

          for( var i = 0; i != that._mostVisitedIntervals.length; i++ ){
            var interval = that._mostVisitedIntervals[i];

            var item = fvdSpeedDial.SpeedDial.Builder.Groups.item( _( "newtab_mostvisited_interval_" + interval ), interval );

            tmpContainer.appendChild( item );
          }

          groupsBox.parentNode.replaceChild( tmpContainer, groupsBox );

        }
        else{
          groupsBox.parentNode.replaceChild( tmpContainer, groupsBox );
        }



      },


      displayAdditionalList: function( params ){

        params = params || {};

        var that = this;
        try{
          var listElem = document.getElementsByClassName( "additionalGroupsList" )[0];

          if( listElem.getAttribute("active") == 1 ){
            this.closeAdditionalList();
            return;
          }

          var btn = document.getElementsByClassName( "additionalGroupsButton" )[0];

          var pos = fvdSpeedDial.Utils.getOffset( btn );
          listElem.style.left = pos.left + "px";

          if( params.disableAnimation ){
            listElem.setAttribute("disableanim", 1);
            setTimeout(function(){
              listElem.removeAttribute("disableanim");
            }, 500);
          }

          listElem.setAttribute( "active", 1 );

          document.addEventListener( "click", that.closeAdditionalList, false );
        }
        catch( ex ){

        }

      },

      closeAdditionalList: function(){
        try{
          var listElem = document.getElementsByClassName( "additionalGroupsList" )[0];
          listElem.setAttribute( "active", 0 );
          document.removeEventListener( "click", fvdSpeedDial.SpeedDial.Groups.closeAdditionalList );
        }
        catch( ex ){

        }
      }
    },

    /* Mostvisited related */

    syncMostVisited: function(){
      fvdSpeedDial.Storage.MostVisited.invalidateCache( true );
      if( this.currentDisplayType() == "mostvisited" ){
        this.sheduleFullRebuild();
      }
    },

    mostVisitedRestoreRemoved: function(){
      var that = this;
      fvdSpeedDial.Storage.MostVisited.restoreRemoved(function(){
        if( that.currentDisplayType() == "mostvisited" ){
          that.sheduleFullRebuild();
        }
      });

    },

    openAllCurrentMostVisitedLinks: function(){
      fvdSpeedDial.Storage.MostVisited.getData( {
        interval: fvdSpeedDial.SpeedDial.currentGroupId(),
        count: fvdSpeedDial.Prefs.get( "sd.max_most_visited_records" )
      }, function( data ){

        for( var i = 0; i != data.length; i++ ){
          fvdSpeedDial.Utils.Opener.backgroundTab( data[i].url );
        }

      });
    },

    removeAllCurrentMostVisitedLinks: function(){

      fvdSpeedDial.Dialogs.confirm( _("dlg_confirm_remove_links_all_title"), _("dlg_confirm_remove_links_all_text"), function( r ){

        if( r ){

          fvdSpeedDial.Storage.MostVisited.getData( {
            interval: fvdSpeedDial.SpeedDial.currentGroupId(),
            count: fvdSpeedDial.Prefs.get( "sd.max_most_visited_records" )
          }, function( data ){

            for( var i = 0; i != data.length; i++ ){
              (function(i){
                fvdSpeedDial.Storage.MostVisited.deleteId( data[i].id, function( result ){

                  if( i == data.length - 1 ){
                    fvdSpeedDial.SpeedDial.sheduleFullRebuild();
                  }

                } );
              })(i);
            }
          });

        }

      } );



    },

    // recently closed related

    openAllCurrentRecentlyClosedLinks: function(){
      fvdSpeedDial.Storage.RecentlyClosed.getData( {
        count: fvdSpeedDial.Prefs.get( "sd.max_recently_closed_records" )
      }, function( data ){

        for( var i = 0; i != data.length; i++ ){
          fvdSpeedDial.Utils.Opener.backgroundTab( data[i].url );
        }

      } );
    },

    removeAllCurrentRecentlyClosedLinks: function(){
      fvdSpeedDial.Dialogs.confirm( _("dlg_confirm_remove_links_all_title"), _("dlg_confirm_remove_links_all_text"), function(r){
        if( r ){
          fvdSpeedDial.Storage.RecentlyClosed.removeAll(function(){
            fvdSpeedDial.SpeedDial.sheduleFullRebuild();
          });
        }
      } );
    },

    /* something misc */

    wrapperDblClick: function( event ){

      // need collapse/expand current display type
      this.toggleExpand();

    },

    getExpandState: function(){

      var currentState = _b(fvdSpeedDial.Prefs.get( "sd."+this.currentDisplayType()+"_expanded" ));

      if( fvdSpeedDial.PowerOffClient.isHidden() ){
        return false;
      }

      return currentState;

    },

    toggleExpand: function(){

      if( fvdSpeedDial.PowerOffClient.isHidden() ){
        return;
      }

      var newVal = !_b(fvdSpeedDial.Prefs.get( "sd."+fvdSpeedDial.SpeedDial.currentDisplayType(  )+"_expanded" ));
      fvdSpeedDial.Prefs.set( "sd."+fvdSpeedDial.SpeedDial.currentDisplayType(  )+"_expanded", newVal );

    },

    refreshShowHideButton: function(){

      var b = document.querySelector( "#searchBar .rightMenu .showHide" );

      if( this.getExpandState() ){
        b.setAttribute( "active", "1" );
      }
      else{
        b.setAttribute( "active", "0" );
      }

    },

    refreshExpandState: function(args){

      var currentState = this.getExpandState();

      if( args ){
        if( args.ifcollapsed ){
          if(currentState){
            return;
          }
        }
      }

      var wrapper = document.getElementById( "speedDialWrapper" );
      wrapper.setAttribute( "expanded", currentState ? 1 : 0 );
      var that = this;

      if( !currentState ){

        var collapsedContainer = document.querySelector( "#speedDialCollapsedContent" );

        if( fvdSpeedDial.PowerOffClient.isHidden() ){
          collapsedContainer.setAttribute( "type", "poweroff" );
        }
        else if( fvdSpeedDial.PowerOff.isEnabled() ){
          collapsedContainer.setAttribute( "type", "poweroffmessage" );
        }
        else{
          collapsedContainer.setAttribute( "type", "simple" );
        }

      }

      that.refreshSpeedDialWrapperHeight();

      that.refreshShowHideButton();

    },

    refreshBackground: function(){

      fvdSpeedDial.Storage.getMisc( "sd.background", function( imageUrl ){
        var bgData = {
          color: fvdSpeedDial.Prefs.get( "sd.background_color" ),
          useColor: _b(fvdSpeedDial.Prefs.get( "sd.background_color_enabled" )),
          imageUrl:  imageUrl + "?" + Math.random(),
          //imageUrl: fvdSpeedDial.Prefs.get( "sd.background_url" ), // load original location, coz chrome crashes on large images in data URI
          imageType:  fvdSpeedDial.Prefs.get( "sd.background_url_type" )
        };

        var bgContainer = document.documentElement; //document.getElementById("speedDialWrapper");

        fvdSpeedDial.Background.setToElem( bgData, bgContainer );
      } );



    },

    refreshCSS: function(){
      fvdSpeedDial.CSS.refresh();
    },

    sheduleCSSRefresh: function(){
      var that = this;
      this._needCSSRefresh = true;

      setTimeout(function(){
        if( that._needCSSRefresh ){
          that.refreshCSS();
        }
      }, 100);
    },

    sheduleBackgroundRefresh: function(){
      var that = this;
      this._needBackgroundRefresh = true;

      setTimeout(function(){
        if( that._needBackgroundRefresh ){
          that.refreshBackground();
        }
      }, 100);
    },

    // interval callback function
    _needRebuildChecker: function(){
      if( fvdSpeedDial.SpeedDial._needRebuildGroupsList ){
        fvdSpeedDial.SpeedDial._needRebuildGroupsList = false;
        fvdSpeedDial.SpeedDial.Groups.rebuildGroupsList();
      }

      if( fvdSpeedDial.SpeedDial._needRebuild ){
        fvdSpeedDial.SpeedDial._needRebuild = false;
        fvdSpeedDial.SpeedDial.rebuildCells();
      }
    },


    _getSpeedDialCellById: function( dialId ){

      return document.getElementById( "dialCell_" + dialId );

    },

    _viewportWidth: function(){
      var maxRightScrollbarWidth = 20;

      //return document.body.clientWidth;

      return window.innerWidth - maxRightScrollbarWidth;
    },

    _viewportHeightForHorizScroll: function(){

      return window.innerHeight - document.getElementById( "cellsContainer" ).getBoundingClientRect().top;

    },

    _viewportHeight: function(){
      return document.body.scrollHeight;
    },

    _prefsListener: function( name, value ){

      if( "sd.thumbs_type" == name ||
        "sd.top_sites_columns" == name ){

        if( name == "sd.thumbs_type" ){
          // need check top sites columns value, if it large than auto value, set it it to auto value
          /*
          var autoColumnsCount = fvdSpeedDial.SpeedDial.cellsInRowMax( "auto" );
          if( fvdSpeedDial.Prefs.get( "sd.top_sites_columns" ) > autoColumnsCount ){
            fvdSpeedDial.Prefs.set( "sd.top_sites_columns", autoColumnsCount );
          }
          */
          fvdSpeedDial.Prefs.set( "sd.top_sites_columns", "auto" );

        }

        if( fvdSpeedDial.SpeedDial.currentDisplayType() == "speeddial" ){
          fvdSpeedDial.SpeedDial.sheduleRebuild();
        }
      }
      else if( "sd.all_groups_limit_dials" == name ){
        if( fvdSpeedDial.SpeedDial.currentDisplayType() == "speeddial" ){
          if( fvdSpeedDial.SpeedDial.currentGroupId() == 0 ){
            fvdSpeedDial.SpeedDial.sheduleRebuild();
          }
        }
      }
      else if( "sd.thumbs_type_most_visited" == name ||
        "sd.most_visited_columns" == name ||
        "sd.max_most_visited_records" == name ){
        if( fvdSpeedDial.SpeedDial.currentDisplayType() == "mostvisited" ){
          fvdSpeedDial.SpeedDial.sheduleRebuild();
        }

        if( name == "sd.thumbs_type_most_visited"  ){
          fvdSpeedDial.Prefs.set( "sd.most_visited_columns", "auto" );
        }
      }
      else if( "sd.max_recently_closed_records" == name ||
           "sd.recentlyclosed_columns" == name ){
        if( fvdSpeedDial.SpeedDial.currentDisplayType() == "recentlyclosed" ){
          fvdSpeedDial.SpeedDial.sheduleRebuild();
        }
      }
      else if( name == "sd.search_bar_expanded" ){
        // need resize wrapper
        fvdSpeedDial.SpeedDial.refreshSpeedDialWrapperHeight();
      }
      else if( [ "sd.enable_top_sites", "sd.enable_most_visited", "sd.enable_recently_closed" ].indexOf( name ) != -1 ){
        fvdSpeedDial.SpeedDial._displayType = null;
      }
      else if( ["sd.speeddial_expanded", "sd.mostvisited_expanded", "sd.recentlyclosed_expanded"].indexOf( name ) != -1 ){

        var displayType = name.replace( "sd.", "" ).replace("_expanded", "");

        if( displayType == fvdSpeedDial.SpeedDial.currentDisplayType() ){
          fvdSpeedDial.SpeedDial.refreshExpandState();
        }

        if( value && fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" ){
          // if expand speed dial in fancy mode, to restore 3D, need to rebuild(maybe webkit bug?)
          fvdSpeedDial.SpeedDial.sheduleRebuild();
        }

      }
      else if( name.indexOf("sd.text.") == 0 ||
        ["sd.show_urls_under_dials", "sd.dials_opacity", "sd.show_icons_and_titles_above_dials",
         "sd.display_dial_background", "sd.display_quick_menu_and_clicks"].indexOf(name) != -1 ){
        // css changes
        fvdSpeedDial.SpeedDial.sheduleCSSRefresh();
      }
      else if( name.indexOf("sd.background") == 0 ){
        fvdSpeedDial.SpeedDial.sheduleBackgroundRefresh();
      }
      else if( name == "collapsed_message.with_poweroff.display" ||
           name == "collapsed_message.without_poweroff.display" ){
        fvdSpeedDial.SpeedDial.refreshCollapsedMessages();
      }
      else if( name == "sd.display_mirror" ){
        fvdSpeedDial.SpeedDial.refreshEnableMirrors();
      }

    },

    _getDialIdByCell: function( cell ){
      return cell.getAttribute("id").replace( "dialCell_", "" );
    },

    _getGroupByItem: function( item ){
      return item.getAttribute("id").replace( "group_select_", "" );
    },

    _dialsAreaSize: function( params ){

      if( typeof params.objects == "undefined" ){
        params.objects = document.getElementById("cellsContainer").childNodes.length;
      }

      var cellSize = this._currentCellSize();
      var cellsInRow = this.cellsInRowMax(null, null, params).cols;

      var areaWidth = cellSize.width * cellsInRow + (cellsInRow - 1) * this._cellsMarginX;

      return {
        width: areaWidth
      }

    },

    _currentSettingsColumnsCount: function(){
      switch( this.currentDisplayType() ){
        case "speeddial":
          return fvdSpeedDial.Prefs.get("sd.top_sites_columns");
        break;
        case "mostvisited":
          return fvdSpeedDial.Prefs.get("sd.most_visited_columns");
        break;
        case "recentlyclosed":
          return fvdSpeedDial.Prefs.get("sd.recentlyclosed_columns");
        break;
      }
    },

    _currentListElemSize: function(){
      if( this.currentDisplayType() == "mostvisited" ){
        return  this._listElemSizeMostVisited;
      }
      else{
        return  this._listElemSize;
      }
    },

    _currentCellSize: function(){
      var size = null;
      var that = this;
      /*
      if( this.currentThumbsMode() == "custom" ){
      */

      if( fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" ){
        size = parseInt( fvdSpeedDial.Prefs.get( "sd.custom_dial_size_fancy" ) );
      }
      else{
        size = parseInt( fvdSpeedDial.Prefs.get( "sd.custom_dial_size" ) );
      }

      /*
      }
      else{
        size = this._cellsSizes[ this.currentThumbsMode() ];
      }
      */


      return {
        width: size,
        height: Math.round( size / that._cellsSizeRatio )
      };
    },

    _listContainer: function(){
      return document.getElementById( "listContainer" );
    },

    _cellsContainer: function(){
      return document.getElementById( "cellsContainer" );
    }


  };

  fvdSpeedDial.SpeedDial = new SpeedDial();

})();
