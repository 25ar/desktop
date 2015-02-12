(function(){

	const FANCY_BACKGROUND_URL = fvdSpeedDial.Prefs._themeDefaults["fancy"]["sd.background_url"]; //"http://shiftwallpapers.com/wp-content/uploads/2012/01/Simple-black-and-white-liniar-background-hd-wallpaper.jpg";

	var CSS = function(){



	};

	CSS.prototype = {
		stylesheets: [],

		getFancyBackgroundUrl: function(){

			return FANCY_BACKGROUND_URL;

		},

		setTheme: function( name ){

			document.getElementById( "themeCSS" ).setAttribute("href", "/styles/newtab/themes/" + name + ".css");

		},

		refreshTheme: function(){
			try{
				this.setTheme( fvdSpeedDial.Prefs.get( "sd.display_mode" ) );
			}
			catch( ex ){

			}
		},

		refresh: function(){


			// get colors from settings
			var classesColors = {
				".newtabCell .head": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.cell_title.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.cell_title.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.cell_title.bolder")),
					"display": _b( fvdSpeedDial.Prefs.get("sd.show_icons_and_titles_above_dials") ) ? "block" : "none"
				},
				".newtabCell .footer": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.cell_url.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.cell_url.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.cell_url.bolder")),
					"display": _b( fvdSpeedDial.Prefs.get("sd.show_urls_under_dials") ) ? "block" : "none"
				},
				".newtabListElem .text": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.list_elem.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.list_elem.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.list_elem.bolder"))
				},

				"#listViewTypeSelector": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.list_show_url_title.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.list_show_url_title.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.list_show_url_title.bolder"))
				},

				".link":{
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.list_link.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.list_link.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.list_link.bolder"))
				},
				".textother": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.other.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.other.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.other.bolder"))
				},
				".newtabCell": {
					"opacity": fvdSpeedDial.Prefs.get("sd.dials_opacity")/100
				},
				".newtabListElem":{
					"opacity": fvdSpeedDial.Prefs.get("sd.dials_opacity")/100
				},
				"#groupsBox > div":{
					"opacity": fvdSpeedDial.Prefs.get("sd.dials_opacity")/100
				}
			};



			if( !_b( fvdSpeedDial.Prefs.get("sd.display_dial_background") ) ){
				classesColors[".newtabCell .body .screenParent"] = {
					"box-shadow": "none !important"
					//"background": "none !important",
				};
				if(!_b( fvdSpeedDial.Prefs.get("sd.display_dial_borders") )) {
          classesColors[".newtabCell .body .screenParent"]["border"] = "none !important";
				}
				else {
          classesColors[".newtabCell .body .screenParent"]["border-width"] = "1px !important";
				}
				classesColors[".newtabCell[type=\"plus\"] .body .preview-image"] = {
          "background": "none !important",
          //"background": "none !important",
        };
				classesColors["#speedDialContent .newtabCell .body"] = {
					"background": "none !important",
				};
				classesColors[".newtabCell .menuOverlay .text"] = {
					"margin-right": "5px",
					"margin-left": "5px",
					"margin-bottom": "5px",
				};
				classesColors[".newtabCell .speedDialIcons"] = {
					"margin-right": "5px !important"
				};

				classesColors[".newtabCell .imgShadow"] = {
					"display": "none"
				};

				classesColors[".newtabCell .menuOverlay"] = {
					"background-color": "rgba( 62, 125, 179, 0.6 ) !important"
				};
				/*
				classesColors[".newtabCell .mostVisitedMenu"] = {
					"background-color": "rgba( 62, 125, 179, 0.6 )",
					"position": "absolute",
					"top": "19px",
					"padding-top": "3px"
				};
				*/
				classesColors["#speedDialContent[style=\"standard\"] .newtabCell[type=\"mostvisited\"] .menuOverlay"] = {
          "left": "-3px",
          "right": "-3px !important",
          "width": "auto",
          "bottom": "7px",
				};
				classesColors[".newtabCell .mostVisitedMenu > .views"] = {
					"margin-left": "3px"
				};
				classesColors[".newtabCell .mostVisitedMenu > .ingroup"] = {
					"margin-right": "3px"
				};

			}

			if( !_b( fvdSpeedDial.Prefs.get("sd.display_quick_menu_and_clicks" ) ) ){
				classesColors[".newtabCell .speedDialIcons"] = {
					"display": "none"
				};
				classesColors[".newtabCell .text"] = {
					"display": "none"
				};
			}


			for( var si = 0; si != this.stylesheets.length; si++ ){
				var stylesheet = this.stylesheets[si];

				while( stylesheet.cssRules.length > 0 ){
					stylesheet.deleteRule(0);
				}


				for( var selector in classesColors ) {
					stylesheet.addRule( selector, "", 0 );
					var rule = stylesheet.cssRules[0];
					var properties = classesColors[selector];
					for( var properyName in properties ){
						var value = properties[properyName];
						var important = null;
						try{
							if( value.indexOf("!important") != -1 ){
								important = "important";
								value = value.replace( "!important", "" );
							}
						}
						catch( ex ) {
						}
						rule.style.setProperty( properyName, value, important );
					}
				}

			}

			this.refreshTheme();

		},

		_color: function( c ){
			return "#"+c;
		},

		_size: function( s ){
			return s+"px";
		},

		_fontWeight: function( bolder ){
			if( _b(bolder) ){
				return "bold";
			}
			return "normal";
		},

		_updateThemeActions: function( value ){

			var fancyDefaults = fvdSpeedDial.Prefs._themeDefaults["fancy"];
			var standardDefaults = fvdSpeedDial.Prefs._themeDefaults["standard"];

			var prefsToRestore = [
				"sd.text.cell_title.color",
				"sd.text.list_elem.color",
				"sd.text.list_show_url_title.color",
				"sd.text.list_link.color",
				"sd.text.other.color"
			];

			if( value == "standard" ){

				if( fvdSpeedDial.Prefs.get("sd.background_color") == "000000" && _b( fvdSpeedDial.Prefs.get( "sd.background_color_enabled" ) ) ||
					fvdSpeedDial.Prefs.get("sd.background_url") == FANCY_BACKGROUND_URL && fvdSpeedDial.Prefs.get("sd.background_url_type") != "noimage" ){

					if( fvdSpeedDial.Prefs.get("sd.background_url") == FANCY_BACKGROUND_URL ){
						fvdSpeedDial.Prefs.sSet("sd.background_url_type", "noimage");
					}

					fvdSpeedDial.Prefs.sSet("sd.background_color_enabled", true);
					fvdSpeedDial.Prefs.sSet("sd.background_color", "FFFFFF");

					prefsToRestore.forEach(function( pref ){

						if( fvdSpeedDial.Prefs.get(pref) == fancyDefaults[pref] ){
							fvdSpeedDial.Prefs.set( pref, standardDefaults[pref] );
						}

					});

				}


				if( !_b( fvdSpeedDial.Prefs.get("sd.display_quick_menu_and_clicks") ) ) {
					fvdSpeedDial.Prefs.sSet( "sd.display_quick_menu_and_clicks", true );
				}

				if( !_b( fvdSpeedDial.Prefs.get("sd.show_urls_under_dials") ) ){
					fvdSpeedDial.Prefs.sSet( "sd.show_urls_under_dials", true );
				}

				if( !_b( fvdSpeedDial.Prefs.get("sd.show_icons_and_titles_above_dials") ) ){
					fvdSpeedDial.Prefs.sSet( "sd.show_icons_and_titles_above_dials", true );
				}


			}
			else if( value == "fancy" ){

				fvdSpeedDial.Prefs.sSet( "sd.top_sites_columns", "auto" );
				//fvdSpeedDial.Prefs.set( "sd.thumbs_type", "medium" );
				fvdSpeedDial.Prefs.sSet( "sd.most_visited_columns", "auto" );

				// set fonts

				prefsToRestore.forEach(function( pref ){

					if( fvdSpeedDial.Prefs.get(pref) == standardDefaults[pref] ){
						fvdSpeedDial.Prefs.set( pref, fancyDefaults[pref] );
					}

				});

				// in fancy mode plus cells always display
				if( !_b( fvdSpeedDial.Prefs.get("sd.display_plus_cells") ) ){
					fvdSpeedDial.Prefs.sSet( "sd.display_plus_cells", true );
				}

				if( _b( fvdSpeedDial.Prefs.get("sd.display_quick_menu_and_clicks") ) ) {
					fvdSpeedDial.Prefs.sSet( "sd.display_quick_menu_and_clicks", false );
				}

				if( _b( fvdSpeedDial.Prefs.get("sd.show_urls_under_dials") ) ){
					fvdSpeedDial.Prefs.sSet( "sd.show_urls_under_dials", false );
				}

				if( _b( fvdSpeedDial.Prefs.get("sd.show_icons_and_titles_above_dials") ) ){
					fvdSpeedDial.Prefs.sSet( "sd.show_icons_and_titles_above_dials", false );
				}


				if( fvdSpeedDial.Prefs.get("sd.background_url_type") == "noimage" ){

					var bgUrl = FANCY_BACKGROUND_URL;

					fvdSpeedDial.Utils.imageUrlToDataUrl( bgUrl, function( dataUrl ){

						if( !dataUrl ){
							dataUrl = "";
						}

						fvdSpeedDial.Prefs.set( "sd.background_url", bgUrl );

						fvdSpeedDial.Storage.setMisc( "sd.background", dataUrl, function(){

							fvdSpeedDial.Prefs.set("sd.background_url_type", "fill");

							fvdSpeedDial.SpeedDial.refreshBackground();

						} );

					} );

				}

			}

			fvdSpeedDial.ChromeThemeClient.setPrefsForCurrentAppliedTheme();

		}

	};

	this.CSS = new CSS();

	function prefListener( name, value ){
		if( name == "sd.display_mode" ){

			setTimeout( function(){

				fvdSpeedDial.Prefs.set( "sd.top_sites_columns", "auto" );
				fvdSpeedDial.Prefs.set( "sd.most_visited_columns", "auto" );

				fvdSpeedDial.CSS._updateThemeActions( value );
				fvdSpeedDial.CSS.refresh();
				fvdSpeedDial.CSS.refreshTheme();
				fvdSpeedDial.SpeedDial.sheduleRebuild();
				fvdSpeedDial.SpeedDial.refreshBackground();

			}, 0 );
		}
	}

	chrome.runtime.onMessage.addListener(function(msg) {
		if(msg.action == "pref:changed") {
			prefListener(msg.name, msg.value);
		}
	});

}).apply(fvdSpeedDial);
