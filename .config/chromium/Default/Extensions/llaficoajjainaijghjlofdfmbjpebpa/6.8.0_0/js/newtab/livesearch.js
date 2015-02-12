(function(){
	
	this.LiveSearch = new function(){
		
		const MIN_LENGTH = 3;
		const URL_TEMPLATE = "http://fvdmedia.com/addon_search/?type=instant_search&from=chrome_fvdsd&q=%query%&test=1";
		
		var __googlePageLoadedCallback = null;
		var __loadGoogle = false;
		var _forceFrameSize = null;
		
		function getInput(){
			return document.getElementById("q");
		}
		
		function getContainer(){
			return document.getElementById("liveSearchContainer");
		}
		
		function getFrame(){
			return getContainer().querySelector("iframe");
		}
		
		function resizeListener(){
			refreshPosWithSuggest();
		}
		
		function refreshPosWithSuggest(){
			
			var marginTop = 0;
			var suggest = document.getElementById("suggest");
			
			if( suggest && suggest.style.display != "none" ){
				marginTop = suggest.offsetHeight;
			}
			
			document.getElementById("liveSearch").style.marginTop = marginTop + "px";
					
			//try{

				var iframe = document.querySelector("#liveSearch iframe");	
				var currentSpace = window.innerHeight - document.querySelector("#liveSearch").offsetTop;//document.querySelector("#liveSearch .content").offsetHeight;
				if( _forceFrameSize ){
					var origFrameHeight = _forceFrameSize;
				}
				else{
					var origFrameHeight = iframe.contentDocument.body.offsetHeight;							
				}

				var frameHeight = origFrameHeight + 70;				
					
				console.log("Use", frameHeight);
							
				if( origFrameHeight > 0 && !document.querySelector("#liveSearch .content").hasAttribute("loading") && frameHeight > 0 && frameHeight < currentSpace ){
					document.getElementById("liveSearch").style.marginBottom = (currentSpace - frameHeight) + "px";
				}
				else{
					document.getElementById("liveSearch").style.marginBottom = "0px";
				}
			//}
			//catch( ex ){
			//	console.log( "ERROR BLAD", ex  );
			//}
			
			
			//
			
		}
		
		this.refreshSize = function(){
			refreshPosWithSuggest();
		}
		
		function show(){
			
			var container = getContainer();
						
			var query = getInput().value;
			
			var frame = getFrame();
						
			var newUrl = URL_TEMPLATE.replace( "%query%", encodeURIComponent(query) );
			
			_forceFrameSize = null;
			
			if( !__loadGoogle ){
				container.querySelector(".header span").textContent = _("newtab_instant_seach_preview") + " - " + query;				
			}
			else{
				container.querySelector(".header span").textContent = _("newtab_instant_seach_preview_google") + " - " + query;
			}
			
				
			if( newUrl != frame.getAttribute("src") ){

				frame.setAttribute( "src", "" );

				__googlePageLoadedCallback = function(){
					
					// need to parse google and insert to frame content
					frame.setAttribute( "src", chrome.extension.getURL( "/instantsearch.html?q=" + encodeURIComponent(query) ) );
					__loadGoogle = true;
					
					container.querySelector(".header span").textContent = _("newtab_instant_seach_preview_google") + " - " + query;
					
				}

				var content = container.querySelector(".content");
				content.setAttribute("loading", 1);
				
				frame.style.opacity = 0;
							
				frame.onload = function(){
	
					frame.style.opacity = 1;
					content.removeAttribute("loading");
									
					__googlePageLoadedCallback = null;
										
				}
				
				if( __loadGoogle ){								
					frame.setAttribute( "src", chrome.extension.getURL( "/instantsearch.html?q=" + encodeURIComponent(query) ) );						
				}
				else{
					frame.setAttribute("src", newUrl);					
				}

			}	
									
			if( container.getAttribute( "display" ) == 1 ){
				return;
			}
			
			container.setAttribute("display", 1);
			
			document.getElementById("searchFormContainer").setAttribute("search", 1);
			
			refreshPosWithSuggest();
			
			window.addEventListener( "resize", resizeListener );
												
		}
		
		function hide(){
			
			var container = getContainer();
			
			if( container.getAttribute( "display" ) == 0 ){
				return;
			}
			
			container.setAttribute("display", 0);

			document.getElementById("searchFormContainer").removeAttribute("search");
			
			window.removeEventListener( "resize", resizeListener );
			
		}
		
		function init(){
			
			if( !_b(fvdSpeedDial.Prefs.get("sd.enable_search_preview")) ){
				return;
			}
			
			chrome.i18n.getAcceptLanguages( function( languages ){
				
				if( languages.indexOf("ru") != -1 ){
					// ru not allowed
					return;
				}
				
				function _inputListener(event){
					
					if( event.keyCode == 27 ){
						return;			
					}				
					
					setTimeout(function(){
					
						if( getInput().value.length >= MIN_LENGTH ){
							show();
						}
						else{
							hide();
						}
						
					}, 0);
									
				}
				
				var events = [
					"keyup",
					"input"
				];
				
				events.forEach(function( e ){
					
					getInput().addEventListener( e, _inputListener, false );
					
				});
				
				getContainer().querySelector(".header .close").addEventListener( "click", function( event ){
		
					hide();	
					
				}, false);
				
				getInput().addEventListener( "click", function( event ){
					
					event.stopPropagation();
					
				}, false );
				
				document.addEventListener( "keyup", function( event ){
					
					if( event.keyCode == 27 ){
						hide();					
					}
					
				}, false);
				
				document.addEventListener( "click", function( event ){
					
					var liveSearch = getContainer().querySelector("#liveSearch");
					
					var p = event.target;
					while( true ){
						
						if( p == liveSearch ){
							return;
						}
						
						p = p.parentNode;
						
						if( !p ){
							break;
						}
						
					}
					
					hide();
					
				}, false );
				
				getContainer().addEventListener( "dblclick", function( event ){
					
					event.stopPropagation();
					
				}, false );			
				
				
				fvdSpeedDial.AutoComplete.onPopupShow.addListener(function(){
					refreshPosWithSuggest();
				});
	
				fvdSpeedDial.AutoComplete.onPopupHide.addListener(function(){
					refreshPosWithSuggest();
				});
				
			} );
			
		}
			
		document.addEventListener( "DOMContentLoaded", function(){
			
			// disabled
			return;
			
			init();
			
			chrome.webRequest.onHeadersReceived.addListener(function( data ){
								
				chrome.tabs.getCurrent(function( tab ){
					
					if( data.tabId == tab.id ){
						
						var url = data.url.toLowerCase();
						
						if( data.type == "sub_frame" && 
							(url.indexOf( "https://www.google.com" ) != -1 || url.indexOf( "http://www.google.com" ) != -1) ){
							
							if( __googlePageLoadedCallback ){
								__googlePageLoadedCallback();
							}
							
						}
						
					}
					
				});
				
			}, {urls: ["<all_urls>"]}, ["responseHeaders"]); 			
			
		}, false );
		

		chrome.extension.onMessage.addListener(function(message, data){
			
			if( message.action && message.action == "setLiveSearchWindowSize" ){
				
				if( data && data.tab ){
					chrome.tabs.getCurrent(function( tab ){
						
						if( tab.id == data.tab.id ){
							_forceFrameSize = message.size;
							refreshPosWithSuggest();
							
							console.log("OK CALLED");
						}
						
					});
				}
				
			}
			
		});

	}
	

	
}).apply(fvdSpeedDial);
