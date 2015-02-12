(function() {
	var CAPTURE_WIDTH = 1024;
	var CAPTURE_HEIGHT = 768;
	var CAPTURE_TIMEOUT = 60000 * 2; // 2 minutes
	var CHECK_COMPLETE_INTERVAL = 1000;
	var CHECK_COMPLETE_INTERVAL_FINAL = 3000;
	var DISPLAY_HIDDEN_WINDOW_MONITOR = 5;

	var CANNOT_CAPTURE_REGEXPS = [/^chrome:\/\//i, /^chrome-extension:\/\//i];
	var FAILED_IMAGE = {
		src: "data:image/png;base64,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",
		size: {
			width: 30,
			height: 30
		}
	};

	function RemoveWindowListener( captureWindowId ){

		var self = this;

		function _removeWindowListener( removedWindowId ){

			if( removedWindowId == captureWindowId ){
				return self.stop();
			}

			chrome.windows.getAll( function( windows ){

				if( windows.length == 1 && windows[0].id == captureWindowId ){
					chrome.windows.remove( captureWindowId );
				}

			} );

		}

		chrome.windows.onRemoved.addListener( _removeWindowListener );

		this.stop = function(){
			chrome.windows.onRemoved.removeListener( _removeWindowListener );
		};

	}

	fvdSpeedDial.HiddenCapture = new function(){

		var isLinux = navigator.platform.toLowerCase().indexOf( "linux" ) !== -1;
		var isMac = navigator.platform.toLowerCase().indexOf( "mac" ) === 0;
		var isWin = navigator.platform.toLowerCase().indexOf( "win" ) === 0;

		this.capture = function( params, callback ){
      for(var i = 0; i != CANNOT_CAPTURE_REGEXPS.length; i++){
        if(CANNOT_CAPTURE_REGEXPS[i].test(params.url)){
          setTimeout(function(){
            callback({
              dataUrl: FAILED_IMAGE.src,
              title: "",
              thumbSize: {
                width: FAILED_IMAGE.size.width,
                height: FAILED_IMAGE.size.height
              }
            });
          }, 0);
          return;
        }
      }

			if( typeof params == "string" ){
				params = {
					url: params
				};
			}

			params.width = params.width || fvdSpeedDial.SpeedDial.getMaxCellWidth() * 2;

			chrome.windows.create({
				url: params.url,
				focused: false,

				left: 100000,
				top: 100000,


				width: isWin ? 100 : 1,
				height: isWin ? 100 : 1,

				type: "popup"
			}, function( w ){

				var removeListener = new RemoveWindowListener( w.id );

				if( !w.tabs || w.tabs.length == 0 ){
					// close window
					chrome.windows.remove( w.id );
					return;
				}

				var ctimeout = null;
				var timeout = setTimeout(function(){

					try{
						clearTimeout( ctimeout );
					}
					catch( ex ){

					}

					chrome.windows.remove( w.id );
					callback( null );

				}, CAPTURE_TIMEOUT);


				var monitor = 0;
				fvdSpeedDial.Utils.Async.cc(function( ccCallback ){
          chrome.windows.update(w.id, {
            top: 100000,
            left: 100000
          }, function(){

						monitor++;
						if( monitor == DISPLAY_HIDDEN_WINDOW_MONITOR ){
							// restore size
							chrome.windows.update( w.id, {
								width: CAPTURE_WIDTH,
								height: CAPTURE_HEIGHT
							} );
							return;
						}

						ccCallback();

					});
				});


				if( isLinux || isMac ){
          chrome.windows.update(w.id, {
            state: "minimized"
          });
				}

				var tab = w.tabs[0];

				chrome.tabs.executeScript( tab.id, {
					file: "/js/capture/contentscript.js",
					runAt: "document_start"
				});

				var isFinalTimeout = false;
				function checkTimeout( interval ){

					ctimeout = setTimeout(function(){

						chrome.tabs.get( tab.id, function( tabInfo ){

							if( !tabInfo ){
								// tab closed
								clearTimeout( timeout );
								return callback( null );
							}

							if( !params.saveImage && tabInfo.title ){
								// capture only title
								capture( tabInfo );
								return;
							}

							if( tabInfo.status == "complete" ){
								if( isFinalTimeout ){
									capture( tabInfo );
								}
								else{
									isFinalTimeout = true;
									checkTimeout( CHECK_COMPLETE_INTERVAL_FINAL );
								}
							}
							else{
								isFinalTimeout = false;
								checkTimeout();
							}

						} );

					}, interval || CHECK_COMPLETE_INTERVAL);

				}

				function normailzeWithCheck( callback, attemptNum ){

					if( attemptNum == 10 ){
					//	alert(_("dlg_alert_release_left_button"));
					}

					if( attemptNum > 30 ){
						return callback();
					}

					attemptNum = attemptNum || 0;
          var updateData =  {
            state: "normal",
            focused: false
          };
          if(isLinux) {
            updateData.left = 10000;
            updateData.top = 10000;
          }
					chrome.windows.update(w.id, updateData, function(){

						chrome.windows.get( w.id, function( wInfo ){
							if( wInfo.state != "normal" ){
								normailzeWithCheck( callback, attemptNum + 1 );
							}
							else{
								callback();
							}
						} );

					});

				}

				function capture( tab ){

					fvdSpeedDial.Utils.Async.chain([

						function( chainCallback ){

							chrome.windows.get( w.id, function( wInfo ){
								if( wInfo.state != "normal" ){
									normailzeWithCheck( chainCallback );
								}
								else{
									chainCallback();
								}
							} );

						},

						function(){

							chrome.windows.update( w.id, {
								width: CAPTURE_WIDTH,
								height: CAPTURE_HEIGHT
							}, function(){

								setTimeout(function(){

									chrome.tabs.captureVisibleTab( w.id, function( dataUrl ){
										clearTimeout( timeout );
										chrome.windows.remove( w.id );

										fvdSpeedDial.ThumbMaker.getImageDataPath( {
											imgUrl: dataUrl,
											screenWidth: params.width
										}, function( thumbUrl, thumbSize ){
											callback( {
												dataUrl: thumbUrl,
												title: tab.title,
												thumbSize: thumbSize
											} );
										} );
									} );

								}, 500);

							} );

						}

					]);

				}

				checkTimeout();

			});

		};

	};
})();