function _b( v ){
	if( typeof v == "boolean" ){
		return v;
	}

	if( v == "true" ){
		return true;
	}

	return false;
}

function _isb( v ){
	if( typeof v == "boolean" ){
		return true;
	}

	if( v == "true" || v == "false" ){
		return true;
	}

	return false;
}

function _r( v ){

	if( _isb( v ) ){
		return _b(v);
	}
	return v;

}

function _array( list ){

	var result = [];

	for( var i = 0; i != list.length; i++ ){
		result.push( list[i] );
	}

	return result;

}

Element.prototype.insertAfter = function( newElem, targetElem ){

	if( this.lastChild == targetElem ){
		this.appendChild( newElem );
	}
	else{
		this.insertBefore( newElem, targetElem.nextSibling );
	}

};

function EventEmitter(){
	var callbacks = [];

	this.addListener = function( listener ){

		callbacks.push( listener );

	};

	this.removeListener = function( listener ){

		var index = callbacks.indexOf( listener );

		if( index != -1 ){
			callbacks.splice( index, 1 );
		}

	};

	this.callListeners = function(){

		var args = arguments;

		var toRemove = [];

		callbacks.forEach(function( callback ){

			try{
				callback.apply( window, args );
			}
			catch( ex ){
				toRemove.push( callback );
			}

		});

		toRemove.forEach(function( callback ){

			var index = callbacks.indexOf( callback );
			if( index > -1 ){
				callbacks.splice( index, 1 );
			}

		});
	};
};


// extends


(function(){

	var Utils = function(){

	};

	Utils.prototype = {

		_isVersionChanged: false,

		isActiveTab: function(cb) {
			chrome.tabs.getCurrent(function( tab ){
				if( tab ){
					cb(tab.active);
				}
			});
		},

		getRandomInt: function(min, max) {
		    return Math.floor(Math.random() * (max - min + 1)) + min;
		},

		clone: function( obj ){
			return JSON.parse( JSON.stringify( obj ) );
		},

		shuffle: function(inputArr) {
      var valArr = [],
        k = '',
        i = 0,
        strictForIn = false,
        populateArr = [];

      for (k in inputArr) { // Get key and value arrays
        if (inputArr.hasOwnProperty(k)) {
          valArr.push(inputArr[k]);
          if (strictForIn) {
            delete inputArr[k];
          }
        }
      }
      valArr.sort(function() {
        return 0.5 - Math.random();
      });

      // BEGIN REDUNDANT
      this.php_js = this.php_js || {};
      this.php_js.ini = this.php_js.ini || {};
      // END REDUNDANT
      strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
        .ini['phpjs.strictForIn'].local_value !== 'off';
      populateArr = strictForIn ? inputArr : populateArr;

      for (i = 0; i < valArr.length; i++) { // Repopulate the old array
        populateArr[i] = valArr[i];
      }

      return strictForIn || populateArr;
		},

		getUserCountry: function(cb) {
		  var xhr = new XMLHttpRequest();
		  xhr.open("GET", "http://everhelper.me/spec/country.php");
		  xhr.onload = function() {
		    cb(xhr.responseText);
		  };
		  xhr.send(null);
		},

		hasEqualElements: function (a, b){

			for( var i = 0; i != a.length; i++ ){
				if( b.indexOf( a[i] ) != -1 ){
					return true;
				}
			}

			return false;

		},

		validateText: function( type, text ){
			switch( type ){
				case "email":
	    	  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					return re.test( text );
				break;
			}
		},

		getQueryValue: function( variable ){

			var query = window.location.hash.substring(1);
			var vars = query.split('&');
			for (var i = 0; i < vars.length; i++) {
			    var pair = vars[i].split('=');
			    if (decodeURIComponent(pair[0]) == variable) {
			        return decodeURIComponent(pair[1]);
			    }
			}

			return null;

		},

		arrayDiff: function( a1, a2 ){
			return a1.filter(function(i) {return !(a2.indexOf(i) > -1);});
		},

		urlToCompareForm: function( url ){
			url = url.toLowerCase();
			url = url.replace( /https?:\/\//i, "" );
			url = url.replace( /^www\./i, "" );
			url = url.replace( /\/+$/i, "" );

			return url;
		},

		isValidUrl: function( url ){

			if( url.indexOf( "file:///" ) === 0 ){
			 	return true;
			}

			try{
				var parsed = this.parseUrl( url );
				if( !parsed.host ){
					return false;
				}

				/*
				if( parsed.host.indexOf(".") == -1 ){
					return false;
				}
				*/

				if( parsed.host.length < 2 ){
					return false;
				}

				return true;
			}
			catch( ex ){
				return false;
			}
		},

		getMainDomain: function(domain) {
		  var parts = domain.split("."),
		      result = "",
		      countParts = parts.length;
		  if(parts.length > 1) {
		    result = parts[countParts-2]+"."+parts[countParts-1];
		  }
		  else {
		    result = parts[countParts-1];
		  }
		  return result;
		},

		isIdenticalUrls: function( url1, url2 ){
			url1 = this.urlToCompareForm( url1 );
			url2 = this.urlToCompareForm( url2 );

			return url1 == url2;
		},

		isIdenticalHosts: function( host1, host2, params ){
		  params = params || {};
		  if(params.ignoreSubDomains) {
		    host1 = this.getMainDomain(host1);
		    host2 = this.getMainDomain(host2);
		  }
			host1 = this.urlToCompareForm( host1 );
			host2 = this.urlToCompareForm( host2 );

			return host1 == host2;
		},

		buildUrlFromParsed: function( parsed ){

			var url = parsed.scheme + "://";

			if( parsed.user && parsed.pass ){
				url += parsed.user + ":" + parsed.pass + "@";
			}
			else if( parsed.user ){
				url += parsed.user + "@";
			}

			url += parsed.host;

			if( parsed.path ){
				url += parsed.path;
			}

			if( parsed.query ){
				url += "?" + parsed.query;
			}

			if( parsed.fragment ){
				url += "#" + parsed.query;
			}

			return url;

		},

    typeToExt: function(type) {
      switch(type) {
        case "image/png":
          return "png";
        break;
        case "image/jpeg":
          return "jpg";
        break;
        case "image/gif":
          return "gif";
        break;
      }
    },

		b64toBlob: function(b64Data, contentType, sliceSize) {
			contentType = contentType || '';
			sliceSize = sliceSize || 512;

			var byteCharacters = atob(b64Data);
			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);
			}

			var blob = new Blob(byteArrays, {type: contentType});
			return blob;
		},

		dataURIToBlob: function(url) {
      url = url.replace(/^data:/, "");
      var tmp = url.split(";"),
          contentType = tmp[0];
      url = tmp[1].split(",")[1];
      console.log(contentType);
      return this.b64toBlob(url, contentType);
		},

		parseUrl: function(str, component){

        // Parse a URL and return its components
        //
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/parse_url
        // +      original by: Steven Levithan (http://blog.stevenlevithan.com)
        // + reimplemented by: Brett Zamir (http://brett-zamir.me)
        // + input by: Lorenzo Pisani
        // + input by: Tony
        // + improved by: Brett Zamir (http://brett-zamir.me)
        // %          note: Based on http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
        // %          note: blog post at http://blog.stevenlevithan.com/archives/parseuri
        // %          note: demo at http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
        // %          note: Does not replace invalid characters with '_' as in PHP, nor does it return false with
        // %          note: a seriously malformed URL.
        // %          note: Besides function name, is essentially the same as parseUri as well as our allowing
        // %          note: an extra slash after the scheme/protocol (to allow file:/// as in PHP)
        // *     example 1: parse_url('http://username:password@hostname/path?arg=value#anchor');
        // *     returns 1: {scheme: 'http', host: 'hostname', user: 'username', pass: 'password', path: '/path', query: 'arg=value', fragment: 'anchor'}
		    var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'], ini = (this.php_js && this.php_js.ini) ||
		    {}, mode = (ini['phpjs.parse_url.mode'] &&
		    ini['phpjs.parse_url.mode'].local_value) ||
		    'php', parser = {
		        php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
		    };

		    var m = parser[mode].exec(str), uri = {}, i = 14;
		    while (i--) {
		        if (m[i]) {
		            uri[key[i]] = m[i];
		        }
		    }

		    if (component) {
		        return uri[component.replace('PHP_URL_', '').toLowerCase()];
		    }
		    if (mode !== 'php') {
		        var name = (ini['phpjs.parse_url.queryKey'] &&
		        ini['phpjs.parse_url.queryKey'].local_value) ||
		        'queryKey';
		        parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
		        uri[name] = {};
		        uri[key[12]].replace(parser, function($0, $1, $2){
		            if ($1) {
		                uri[name][$1] = $2;
		            }
		        });
		    }
		    delete uri.source;
		    return uri;
		},

		isVisibleElem: function( elem ){

			var viewportHeight = window.innerHeight;
			var currentTopStart = document.body.scrollTop;
			var currentTopEnd = currentTopStart + viewportHeight;

			var elemOffset = this.getOffset( elem );

			if( elemOffset.top > currentTopStart && elemOffset.top + elem.offsetHeight < currentTopEnd ){
				return true;
			}

			return false;

		},

		isVersionChanged: function(){

			var app = chrome.app.getDetails();

			if( fvdSpeedDial.Prefs.get( "last_run_version" ) != app.version ){
				this._isVersionChanged = true;
				fvdSpeedDial.Prefs.set( "last_run_version", app.version );
			}

			return this._isVersionChanged;

		},

		scrollToElem: function( elem ){

			var viewportHeight = window.innerHeight;
			var currentTopStart = document.body.scrollTop;
			var currentTopEnd = currentTopStart + viewportHeight;

			var elemOffset = this.getOffset( elem );

			if( elemOffset.top > currentTopStart && elemOffset.top + elem.offsetHeight < currentTopEnd ){
				return; // no need scroll
			}

			var scrollAmount = 0;
			if( elemOffset.top < currentTopStart ){
				scrollAmount = elemOffset.top;
			}
			else{
				scrollAmount = elemOffset.top + elem.offsetHeight - viewportHeight;
			}

			document.body.scrollTop = scrollAmount;

		},

		getOffset: function( obj ) {
			var curleft = curtop = 0;
			if (obj.offsetParent) {
				do {
					curleft += obj.offsetLeft;
					curtop += obj.offsetTop;
				}
				while(obj = obj.offsetParent);
			}



			return {
				"left": curleft,
				"top": curtop
			};
		},

		isChildOf: function( elem, parent ){

			while( true ){

				if( elem == parent ){
					return true;
				}

				if( elem.parentNode ){
					elem = elem.parentNode;
				}
				else{
					return false;
				}

			}

		},

		copyToClipboard: function( text ){
			var clipboardholder = document.createElement("textarea");
			clipboardholder.style.width = "0px";
			clipboardholder.style.height = "0px";
			clipboardholder.style.opacity = 0;
			document.body.appendChild(clipboardholder);
			clipboardholder.value = text;
			clipboardholder.select();
			document.execCommand("Copy");
			document.body.removeChild(clipboardholder);
		},

		ucfirst: function( str ){
			var firstLetter = str.slice(0,1);
			return firstLetter.toUpperCase() + str.substring(1);
		},

		cropLength: function( str, len ){
			if( str.length <= len ){
				return str;
			}

			return str.substring(0, len) + "...";
		},

		setScreenPreview: function( elem, screen, nocache ){
      if(typeof screen == "string" && screen.indexOf("filesystem:") === 0) {
        if(nocache) {
          screen += "?" + nocache;
        }
      }
      elem.style.background = "";
			elem.style.background = "url("+screen+")";
			//elem.style.backgroundSize = "contain";
			elem.style.backgroundSize = "100%";
			elem.style.backgroundPosition = "top left";
			elem.style.backgroundRepeat = "no-repeat";
		},

		removeScreenPreview: function( elem ){
      if(elem) {
        elem.style.background = "";
        elem.style.backgroundSize = "";
        elem.style.backgroundPosition = "";
        elem.style.backgroundRepeat = "";
      }
		},

		setUrlPreview: function( elemParams, picParams, nocache ){
      if(typeof picParams.url == "string" && picParams.url.indexOf("filesystem:") === 0) {
        if(nocache) {
          picParams.url += "?" + nocache;
        }
      }
			this.Async.chain( [
				function( callback2 ){
					if( !picParams.size ){
						var img = new Image();
						img.onload = function(){
							picParams.size = {
								width: img.width,
								height: img.height
							};

							callback2();
						};
						img.onerror = function(){
							picParams.size = {
								width: 0,
								height: 0
							};


							callback2();
						};

						img.src = picParams.url;
					}
					else{
						callback2();
					}
				},

				function(  ){
					elemParams.elem.style.background = "url("+picParams.url+")";
					elemParams.elem.style.backgroundPosition = "center center";

					if( picParams.size.width && picParams.size.height &&
					    picParams.size.width < elemParams.size.width && picParams.size.height < elemParams.size.height ){
						elemParams.elem.style.backgroundSize = "";
					}
					else{
						elemParams.elem.style.backgroundSize = "contain";
					}

					elemParams.elem.style.backgroundRepeat = "no-repeat";
				}
			] );

		},

		imageUrlToDataUrl: function( url, callback, format, quality ){

			var img = new Image();
			img.onload = function(){
				var canvas = document.createElement("canvas");
				var ctx = canvas.getContext('2d');
				canvas.width = img.width;
				canvas.height = img.height;

				ctx.drawImage(img, 0, 0, img.width, img.height);

				if( img.width * img.height < 300*300 ){
					// limitations due to chrome bug
					format = "image/png";
				}

				format = format || "image/jpeg";
				quality = quality || 90;

				callback(  canvas.toDataURL(format, quality), {
					width: img.width,
					height: img.height
				} );
			};
			img.onerror = function(){
				callback( null );
			};
			img.src = url;
		},

		getUrlContent: function( url, callback ){
			var req = new XMLHttpRequest();
			req.open( "GET", url );
			req.onload = function(){
				callback( req.responseText );
			};
			req.onerror = function(){
				callback( null );
			};
			req.send();
		},

		getTitleForUrl: function( url, callback ){

			var req = new XMLHttpRequest();
			req.open( "GET", url );
			req.onload = function(){
				var tmp = document.createElement( "div" );
				tmp.innerHTML = req.responseText;
				try{
					var title = tmp.getElementsByTagName( "title" )[0];
					callback( title.textContent );
				}
				catch( ex ){
					callback( null );
				}
			};
			req.onerror = function(){
				callback( null );
			};
			req.send();

		},

		setAutoTextForTextField: function( elem, text ){

			elem.addEventListener( "focus", function(){

				if( elem.hasAttribute( "autoText" ) ){
					elem.removeAttribute( "autoText" );
					elem.value = "";
				}

			}, false );

			elem.addEventListener( "blur", function(){
				if( elem.value == "" ){
					elem.setAttribute( "autoText", 1 );
					elem.value = text;
				}

			}, false );

			if( elem.value == "" ){
				elem.setAttribute( "autoText", 1 );
				elem.value = text;
			}

		},

		Async: {

			chain: function( callbacksChain ){

				var dataObject = {};

				var f = function(){
					if( callbacksChain.length > 0 ){
						var nextCallback = callbacksChain.shift();
						nextCallback( f, dataObject );
					}
				}

				f();

			},

			arrayProcess: function( dataArray, callback, finishCallback, noTimeout ){

				var f = function( i ){

					if( i >= dataArray.length ){
						finishCallback();
					}
					else{

						if( noTimeout ){
							callback( dataArray[i], function(){
								f(i + 1);
							} );
						}
						else{
							setTimeout( function(){
								callback( dataArray[i], function(){
									f(i + 1);
								} );
							}, 0 );
						}
					}

				}

				f(0);

			},

			cc: function( stateFunction ){

				var rf = function( result ){

					if( result == "break" ){
						return;
					}

					stateFunction( rf );

				};

				stateFunction( rf );

			}

		},

		UI: {
			showAndHide: function( elem, timeout ){
				timeout = timeout | 3000;
				elem.style.opacity = 1;
				setTimeout( function(){
					elem.style.opacity = 0;
				}, timeout );
			}
		},

		Opener: {
			asClicked: function( url, def, event ){

				var action = def;

				if( event.button == 0 ){
					if( event.ctrlKey ){
						if( event.shiftKey ){
							action = "new";
						}
						else{
							action = "background";
						}
					}
				}
				else if( event.button == 1 ){
					action = "background";
				}

				this.byAction( action, url );

				return action;

			},

			byAction: function( action, url ){
				switch( action ){
					case "current":
						this.currentTab( url );
					break;
					case "new":
						this.newTab( url );
					break;
					case "background":
						this.backgroundTab( url );
					break;
				}
			},

			activeTab: function( url ){
				chrome.tabs.query( {
					active: true
				}, function( tabs ){
					chrome.tabs.update( tabs[0].id, {
						url: url
					} );
				})
			},

			currentTab: function( url ){
				chrome.tabs.getCurrent(function( tab ){
					chrome.tabs.update( tab.id, {
						url: url
					} );
				})
			},

			newTab: function( url ){
				chrome.tabs.create({
					url: url,
					active: true
				});
			},

			backgroundTab: function( url ){
				chrome.tabs.create({
					url: url,
					active: false
				});
			}
		}
	};


	fvdSpeedDial.Utils = new Utils();


	(function(){

		var DD = function(){

		}

		var _dragAndDropElem = function( params ){
			var that = this;

			var placeHolder = null;
			var _preserveMargins = {
				left: null,
				top: null
			};

			this._elem = params.elem;
			this._ddTargets = params.targets;
			this._initParams = params;
			this._lastMousePos = null;
			this._ddTargetsList = null;
			this._lastMouseMoveEvent = null;
			// to prevent dd when user mousedown and scroll without mouse move
			this._mouseMoved = false;

			function _elParent(){
				return that._elem.parentNode;
			}

			function _childIndex( child ){
				var p = _elParent();
				for( var i = 0; i != p.childNodes; i++ ){
					if( child == p.childNodes[i] ){
						return i;
					}
				}

				return -1;
			}

			function _createPlaceHolder(){

				placeHolder = document.createElement( "div" );
				placeHolder.style.width = that._elem.offsetWidth + "px";
				placeHolder.style.height = that._elem.offsetHeight + "px";
				placeHolder.className = that._elem.className;

				_elParent().insertBefore( placeHolder, that._elem );

			}

			function _removePlaceHolder(){

				_elParent().removeChild( placeHolder );

			}

			// methods
			this.event = function( type ){

				var args = [];
				for( var i = 1; i < arguments.length; i++ ){
					args.push( arguments[i] );
				}

				if( that._initParams["callback" + type] ){
					that._initParams["callback" + type].apply(window, args);
				}

			}

			this.init = function(){

				this._elem.addEventListener( "mousedown", function( event ){
					if( event.button != 0 ){
						return;
					}
					that._mouseMoved = false;
					that._draggingStartCursorPosition = that._mousePos( event );
					document.addEventListener( "mousemove", that._mouseMove, false );
					document.addEventListener( "mouseup", that._mouseUp, false );
					document.addEventListener( "mouseout", that._cancelIfNoMove, false );
					that.event("MouseDownReal");
				}, false );


			}

			this.adjustPos = function( mouse ){

				mouse = mouse || that._lastMousePos;
				that._lastMousePos = mouse;

				var marginLeft = mouse.x - that._draggingStartCursorPosition.x;
				var marginTop = mouse.y - that._draggingStartCursorPosition.y;

				that._elem.style.webkitTransition = "none";

				var newMargins = that._initParams.changePos( marginLeft, marginTop, that );
				marginLeft = newMargins.left;
				marginTop = newMargins.top;

				if( marginLeft !== false ){
					that._elem.style.marginLeft = marginLeft + "px";
				}

				if( marginTop !== false ){
					that._elem.style.marginTop = marginTop + "px";
				}

				var elemOffset = fvdSpeedDial.Utils.getOffset( that._elem );

				var centerPos = {
					left: elemOffset.left + that._elem.offsetWidth/2,
					top: elemOffset.top + that._elem.offsetHeight/2
				};

				var nowDraggedOn = [];
				var nowDraggedOnElems = [];

				for( var i = 0; i != that._ddTargetsList.length; i++ ){
					var targetOffset = fvdSpeedDial.Utils.getOffset( that._ddTargetsList[i] );

					if( centerPos.left >= targetOffset.left && centerPos.left <= (targetOffset.left + that._ddTargetsList[i].offsetWidth) &&
					    centerPos.top >= targetOffset.top && centerPos.top <= (targetOffset.top + that._ddTargetsList[i].offsetHeight) ){

						// save cursor position rel to dragged elem
						var cursor = {
							left: centerPos.left - targetOffset.left,
							top: centerPos.top - targetOffset.top
						};

						var draggedOnData = {
							cursor: cursor,
							el: that._ddTargetsList[i],
							width: that._ddTargetsList[i].offsetWidth,
							height: that._ddTargetsList[i].offsetHeight
						};

						nowDraggedOn.push( draggedOnData );
						nowDraggedOnElems.push( draggedOnData.el );

					}
				}

				for( var i = 0; i != nowDraggedOn.length; i++ ){

					if( params.alwaysPropatateDragOn ){

						that.event( "Dragon", nowDraggedOn[i].el, nowDraggedOn[i] );

					}
					else{

						if( that._nowDraggedOn.indexOf(nowDraggedOn[i].el) == -1 ){
							that.event( "Dragon", nowDraggedOn[i].el, nowDraggedOn[i] );
						}

					}

				}

				for( var i = 0; i != that._nowDraggedOn.length; i++ ){
					if( nowDraggedOnElems.indexOf(that._nowDraggedOn[i]) == -1 ){
						that.event( "Dragleave", that._nowDraggedOn[i] );
					}
				}

				that._nowDraggedOn = nowDraggedOnElems;
				return {
					left: marginLeft,
					top: marginTop
				};

			},

			this._mouseMove = function( event ){
				that._mouseMoved = true;
				event = event || that._lastMouseMoveEvent;
				that._lastMouseMoveEvent = event;
				if( params.usePlaceHolder ){

					if (!that._startEventSent) {

						_createPlaceHolder();
						that._elem.style.position = "absolute";

						if (that._elem.style.marginTop) {
							_preserveMargins.top = that._elem.style.marginTop;
						}
						if (that._elem.style.marginLeft) {
							_preserveMargins.left = that._elem.style.marginLeft;
						}

						that._startEventSent = true;
						that.event( "Start" );

					}

				}

				if( !that._nowDragging ){
					that._nowDragging = true;

					that.event("MouseDown");
				}

				if( that._ddTargetsList == null ){
					// search elements for drag
					var targets = document.querySelectorAll( "*[dd_class~="+that._ddTargets+"]" );
					that._ddTargetsList = [];
					for( var i = 0; i != targets.length; i++ ){
						if( targets[i] == that._elem ){
							continue;
						}
						that._ddTargetsList.push( targets[i] );
					}

				}

				var mouse = that._mousePos(event);
				var margins = that.adjustPos( mouse );

				if (!params.usePlaceHolder) {

					if( !that._startEventSent ){
						if( margins.left != 0 || margins.top != 0 ){

							that._startEventSent = true;
							that.event( "Start" );

						}
					}

				}

			}

			this._cancelIfNoMove = function() {
				if(!that._mouseMoved) {
					that._mouseUp();
				}
			};

			this._mouseUp = function( event ){

				if( params.usePlaceHolder ){
					_removePlaceHolder();
					that._elem.style.position = "";
				}

				document.removeEventListener( "mousemove", that._mouseMove, false );
				document.removeEventListener( "mouseup", that._mouseUp, false );
				try {
					document.removeEventListener( "mouseout", that._cancelIfNoMove, false );
				}
				catch(ex) {

				}

				that._elem.style.webkitTransition = "";

				if( _preserveMargins.top ){
					that._elem.style.marginTop = _preserveMargins.top;
				}
				else{
					that._elem.style.marginTop = "";
				}
				if( _preserveMargins.left ){
					that._elem.style.marginLeft = _preserveMargins.left;
				}
				else{
					that._elem.style.marginLeft = "";
				}

				if( params.constantStyle ){
					for( var k in params.constantStyle ){
						that._elem.style[k] = params.constantStyle[k];
					}
				}
				else{

				}

				that._nowDragging = false;
				that._startEventSent = false;
				that._ddTargetsList = null;


				that.event( "End", {elements: that._ddTargetsList} );

			}

			this._mousePos = function( event ){
				var scrollTop = document.body.scrollTop;
				if( this._initParams.scrollingNotMean ){
					scrollTop = 0;
				}

				return {
					x: event.x,
					y: event.y + scrollTop
				};
			}

			this.init();


		}

		_dragAndDropElem.prototype = {
			// options
			_initParams: null,
			_elem: null,
			_ddTargets: null,

			// privates
			_ddTargetsList: null,
			_nowDragging: false,
			_draggingStartCursorPosition: {x:null, y:null},
			_nowDraggedOn: [],
			_startEventSent: false,

		}

		DD.prototype = {

			create: function( params ){
				return new _dragAndDropElem( params );
			}

		}

		this.DD = new DD();

	}).apply(fvdSpeedDial.Utils);



})();

