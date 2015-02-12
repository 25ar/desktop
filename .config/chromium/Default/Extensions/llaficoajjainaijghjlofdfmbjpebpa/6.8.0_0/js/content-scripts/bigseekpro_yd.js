if( self != top ){
	
	const INSERT_CSS = '\
	#results{\
		margin-left: 0px !important;\
	}\
	#bd{\
		width: auto !important;\
	}\
	#web{\
		width: auto !important;\
	}\
	#main{\
		margin-right: 10px !important;\
	}\
	.sub{\
		display: none !important;\
	}\
	';
	
	const HIDE_ELEMENTS = [
		"#hd-wrap",
		"#horiz_tabs",
		"#sidebar",
		"#atat",
		".ads.horiz.bot",
		"#satat",
		"#pg",
		".bdc",
		"#ft",
		"#cnt-wrap",
		"#east",
		".reducepx-spnshd.left-ad"		
	];
	
	var style = document.createElement( "style" );
	
	style.textContent = INSERT_CSS;
			
	document.head.appendChild( style );
	
	HIDE_ELEMENTS.forEach( function( selector ){
		
		var elem = document.querySelector( selector );
		if( elem ){
			elem.style.display = "none";
		}
		
	} );
	
	var base = document.createElement("base");
	base.setAttribute( "target", "_top" );
	document.head.appendChild( base );
	
	
}