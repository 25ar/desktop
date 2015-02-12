fvdSpeedDial.Widgets.Builder = new function(){

	var self = this;

	const WIDGET_PANEL_MIN_HEIGHT = 260;
	const WIDGET_PANEL_MIN_PADDING_VERT = 15;
	const WIDGET_PANEL_OPEN_BUTTON_HEIGHT = 19;

	const WIDGET_MARGIN = 10;
	const WIDGET_PADDING_LEFT = 10;

	var WIDGET_PANEL_HEIGHT = null;

	function adjustWidgetPanelHeight( widgets ){
		WIDGET_PANEL_HEIGHT = WIDGET_PANEL_MIN_HEIGHT;

		widgets.forEach(function( widget ){

			if( widget.height + 2 * WIDGET_PANEL_MIN_PADDING_VERT > WIDGET_PANEL_HEIGHT ){
				WIDGET_PANEL_HEIGHT = widget.height + 2 * WIDGET_PANEL_MIN_PADDING_VERT;
			}

		});

		document.querySelector("#widgetsPanel .widgetsContainer").style.height = WIDGET_PANEL_HEIGHT + "px";

		document.getElementById("widgetsPanel").style.bottom = "-" + (WIDGET_PANEL_HEIGHT - WIDGET_PANEL_OPEN_BUTTON_HEIGHT) + "px";
	}

	function getWidgetMargins( params ){

		var data = params.data;

		if( !data.height ){
			return {};
		}

		var result = {};
		result.top = (WIDGET_PANEL_HEIGHT - data.height)/2;

		return result;

	}

	function getOrderedByPosition(){
		var widgets = _array( document.querySelectorAll("#widgetsPanel .widgetsContainer .widget") );

		// order by position
		widgets.sort( function( a, b ){
			return parseInt( a.getAttribute("position") ) - parseInt( b.getAttribute("position") );
		} );

		return widgets;
	}

	function refreshPositions( params ){

		params = params || {};

		var widgets = getOrderedByPosition();

		var left = WIDGET_PADDING_LEFT;

		for( var i = 0; i != widgets.length; i++ ){

			var w = widgets[i];

			// set margins
			var margins = getWidgetMargins( {
				data:{
					width: parseInt( w.getAttribute("_width") ),
					height: parseInt( w.getAttribute("_height") ),
				}
			} );

			if( margins.top ){
				w.style.marginTop = margins.top + "px";
			}

			if( margins.bottom ){
				w.style.marginBottom = margins.bottom + "px";
			}

			if( params.ignoreIds && params.ignoreIds.indexOf( w.getAttribute("id") ) != -1 ){

			}
			else{
				w.style.left = left + "px";
			}

			left += parseInt( w.getAttribute("_width") ) + WIDGET_MARGIN;

		}

	}

	function storeCurrentPositions(){

		var widgets = getOrderedByPosition();

		var positions = {};

		widgets.forEach(function( elem, index ){

			positions[ elem.getAttribute("id").replace("widget_", "") ] = index + 1;

		});

		fvdSpeedDial.Widgets.setAllWidgetPositions( positions );

	}

	this.getWidgetsPanelHeight = function(){

		return WIDGET_PANEL_HEIGHT;

	};

	this.getWidgetsTotalWidth = function(){
		var widgets = _array( document.querySelectorAll("#widgetsPanel .widgetsContainer .widget") );

		var w = 0;
		widgets.forEach(function( widget ){
			w += parseInt( widget.getAttribute("_width") ) + WIDGET_MARGIN;
		});

		w -= WIDGET_MARGIN;
		w += WIDGET_PADDING_LEFT;

		return w;
	};


	this.syncPositionsWithDb = function(){

		var widgets = _array( document.querySelectorAll("#widgetsPanel .widgetsContainer .widget") );

		fvdSpeedDial.Utils.Async.arrayProcess(widgets, function( el, next ) {
			fvdSpeedDial.Widgets.getPosition( el.getAttribute("id").replace("widget_", ""), function(pos) {
				el.setAttribute( "position", pos );
				next();
			} );
		}, function() {
			refreshPositions();
		});

	}

	this.buildWidgetElem = function( params ){

		var data = params.data;

		var elem = fvdSpeedDial.Templates.clone("prototype_widget");
		elem.removeAttribute( "id" );
		elem.setAttribute( "id", "widget_" + data.id )
		elem.setAttribute( "dd_class", "widget" );

		elem.setAttribute( "position", params.position );
		elem.setAttribute( "_width", data.width );
		elem.setAttribute( "_height", data.height );
		elem.querySelector("iframe").setAttribute( "src", "chrome-extension://" + data.id + data.path );

		if( data.width ){
			elem.style.width = data.width + "px";
		}

		if( data.height ){
			elem.style.height = data.height + "px";
		}


		elem.querySelector( ".buttons .close" ).addEventListener( "click", function(){
			fvdSpeedDial.Widgets.remove( data.id );
		}, false );

		var ddPlaceHolderPos = null;

		fvdSpeedDial.Utils.DD.create( {
			elem: elem,
			targets: "widget",
			alwaysPropatateDragOn: true,
			scrollingNotMean: true,
			//constantStyle: {
			//	marginTop: margins.top
			//},
			//usePlaceHolder: true,

			changePos: function( left, top, dd ){

				return {
					left: left,
					top: false
				};

			},

			callbackMouseDown: function(){
				ddPlaceHolderPos = parseInt( elem.getAttribute("position") );
			},

			callbackStart: function(){
				//appDiv.setAttribute("_swallowClick", 1)

				elem.setAttribute( "dragging", 1 );

				//that.appsPanel().setAttribute( "state", "scrolling" );
			},

			callbackEnd: function( params ){

				elem.removeAttribute( "dragging", 1 );
				refreshPositions();
				storeCurrentPositions();

			},

			callbackDragon: function( dragOnElem, extInfo ){

				var middlePos = extInfo.width/2;

				var currentPos = parseInt( elem.getAttribute( "position" ) );
				var dragOnPosition = parseInt( dragOnElem.getAttribute( "position" ) );

				var allowAction = false;

				if( extInfo.cursor.left > middlePos ){
					// insert after
					if( currentPos < dragOnPosition ){
						allowAction = true;
					}
				}
				else{
					// insert before
					if( currentPos > dragOnPosition ){
						allowAction = true;
					}
				}

				//console.log( "ON", dragOnElem, placeHolder );

				if( allowAction ){

					elem.setAttribute( "position", dragOnPosition );
					dragOnElem.setAttribute( "position", ddPlaceHolderPos );
					ddPlaceHolderPos = dragOnPosition;

					refreshPositions({
						ignoreIds: ["widget_" + data.id]
					});

				}

			},

			callbackDragleave: function( dragLeaveElem ){



			},
		} );



		return elem;

	}

	this.rebuildAll = function() {
		var container = document.querySelector("#widgetsPanel .widgetsContainer");
		var panel = document.getElementById("widgetsPanel");
		while( container.firstChild ){
			container.removeChild( container.firstChild );
		}

		fvdSpeedDial.Widgets.getAll(function(widgets) {
			if(!widgets.length){
				panel.setAttribute( "nowidgets", 1 );
			}
			else{
				panel.setAttribute( "nowidgets", 0 );
			}

			adjustWidgetPanelHeight( widgets );

			widgets.forEach( function( widget ){
				var position = widget.position;
				var elem = self.buildWidgetElem( {
					data: widget,
					position: position
				} );
				container.appendChild( elem );
			} );

			refreshPositions();
		});
	};

}();