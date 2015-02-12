fvdSpeedDial.InstantSearch = new function(){
	
	var query = "";
	
	function getGoogleSearchResults( query, callback ){
		
		var req = new XMLHttpRequest();
		req.open( "GET", "https://www.google.com/search?q=" + encodeURIComponent( query ) );
		
		req.onload = function(){
			
			var elem = document.createElement( "div" );
			
			var page = req.responseText;
			
			// remove comments
			page = page.replace( /<!--.+?-->/gim, "" );
			// remove noscript tags
			page = page.replace( /(<noscript[^<>]*>|<\/noscript[^<>]*>)/gim, "" );
			// remove meta tags
			page = page.replace( /<meta[^<>]*>(([\s\S]*?)(<\/meta\s*>))?/gim, "" );			
			// remove scripts
			page = page.replace( /<script.*?>.*?<\/script.*?>/gim, "" );			
			
			elem.innerHTML = page;
			var res = elem.querySelector( "#ires" );
			
			var data = [];
			
			if( res ){
				
				var lis = res.querySelectorAll( "li.g" );
				for( var i = 0; i != lis.length; i++ ){
					
					var li = lis[i];
					
					if( li.id == "newsbox" ){
						continue;
					}
					
					var titleEl = li.querySelector( "h3.r" );
					if( !titleEl ){
						continue;
					}
															
					var title = titleEl.textContent;
					
					var linkEl = li.querySelector( "h3.r a" );
					if( !linkEl ){
						return;
					}
					
					var link = linkEl.getAttribute("href");
					
					var citeEl = li.querySelector( "div.f cite" );
					if( !citeEl ){
						continue;
					}
					
					var cite = citeEl.textContent;
					
					var descEl = li.querySelector( "span.st" );
					if( !descEl ){
						continue;
					}
					
					var desc = descEl.innerHTML;
					
					data.push( {
						title: title,
						cite: cite,
						desc: desc,
						link: link
					} );
					
				}
				
			}
			
			callback( data );
			
		}
		
		req.onerror = function(){
			
			callback( null );
			
		}
		
		req.send( null );
		
	}
	
	function init(){
		
		query = decodeURIComponent( document.location.search.replace("?q=", "") ); 
		
		document.body.setAttribute( "loading", 1 );
		
		getGoogleSearchResults( query, function( data ){
			
			if( data ){
				
				var container = document.getElementById( "searchResults" );
				
				data.forEach(function( item ){
					
					var it = document.createElement( "li" );					
					var a = document.createElement( "a" );
					var b = document.createElement( "b" );
					var desc = document.createElement( "div" );					
					
					a.textContent = item.title;
					a.setAttribute( "href", item.link );
					b.textContent = item.cite;
					desc.innerHTML = item.desc;
					
					it.appendChild( a );
					it.appendChild( b );
					it.appendChild( desc );	
					
					container.appendChild( it );									
					
				});
				//document.getElementById("searchResults").innerHTML = data;
			}
			
			document.body.removeAttribute( "loading" );
			
			setTimeout( function(){
				parent.fvdSpeedDial.LiveSearch.refreshSize();
			}, 300 );
			
			
		} );
		
	}
	
	document.addEventListener( "DOMContentLoaded", function(){
		
		init();
		
	}, false );
	
}
