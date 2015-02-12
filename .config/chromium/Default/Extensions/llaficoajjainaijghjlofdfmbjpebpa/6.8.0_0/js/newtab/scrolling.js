/* Serve horizontal and vertical scrolling types for thumbs modes */

fvdSpeedDial.SpeedDial.Scrolling = new function(){

	var effectiveMode = null;
	var self = this;

	function refresh( params ){

		params = params || {};

		document.getElementById( "cellsContainer" ).style.height = "";

	}

	function prefListener( key, value ){

		if( key == "sd.scrolling" || key == "sd.display_mode" ){

			var sdContent = document.getElementById( "speedDialContent" );
			sdContent.style.opacity = 0;

			setTimeout( function(){

				fvdSpeedDial.SpeedDial.sheduleRebuild();
				refresh();

				setTimeout( function(){
					sdContent.style.opacity = 1;
				}, 500 );

			}, 200 );

		}

	}

	this.activeScrollingType = function(){
		if( fvdSpeedDial.SpeedDial.currentThumbsMode() == "list" ){
			return "vertical";
		}
		if( fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" ){
			return "vertical";
		}
		return fvdSpeedDial.Prefs.get("sd.scrolling");
	};

	this.refresh = function(){
		refresh.apply( window, arguments );
	};
	document.addEventListener( "DOMContentLoaded", function(){
		refresh();
		document.addEventListener( "mousewheel", function( event ){
			document.body.scrollLeft -= event.wheelDelta * 5;
		}, false );
	}, false );

	chrome.runtime.onMessage.addListener(function(msg) {
		if(msg.action == "pref:changed") {
			prefListener(msg.name, msg.value);
		}
	});

}();
