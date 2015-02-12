(function(){
		
	this.Background = new function(){
				
		window.addEventListener( "load", function(){
			
			// refresh setting tabs			
			chrome.tabs.query({
				url: chrome.extension.getURL("options.html")
			}, function( tabs ){
				
				tabs.forEach(function( tab ){
					chrome.tabs.reload( tab.id );
				});
				
			});
			
			if( fvdSynchronizer.Utils.isVersionChanged() ){
				// reset display chrome sync message
				fvdSynchronizer.Prefs.set( "dont_display_ds_chromesync_message", false );
			}
			
			fvdSynchronizer.Localizer.localizeCurrentPage();
			
			function mainSyncChangeListener() {
			}
			
			// listen driver change state
			for (var driverName in fvdSynchronizer.Driver) {
				
				if(fvdSynchronizer.Driver[driverName].addChangeMainSyncStateListener){
					
					fvdSynchronizer.Driver[driverName].addChangeMainSyncStateListener( mainSyncChangeListener );
					
				}
			}	
			
			fvdSynchronizer.Observer.registerCallback( "event:login", function(){
							
				for (var driverName in fvdSynchronizer.Driver) {
					
					if(fvdSynchronizer.Driver[driverName].setFirstSyncAfter){
						
						fvdSynchronizer.Driver[driverName].setFirstSyncAfter( "login" );
						
					}
				}
				
			} );
			
			fvdSynchronizer.Observer.registerCallback( "event:openURL", function( data ){
				
				window.open( data.url );
				
			} );
			
			fvdSynchronizer.Server.Sync.getAuthState( function( error, authorized ){
				
				if( !authorized ){
					// user not authorized - be sure that auth cookie is removed
					chrome.cookies.remove({
						url: fvdSynchronizer.Server.Sync.getAdminUrl(),
						name: fvdSynchronizer.Server.Sync.getAuthCookieName()
					});
				}
				
			} );
						
		}, false );
		
	};
	
}).apply( fvdSynchronizer );
