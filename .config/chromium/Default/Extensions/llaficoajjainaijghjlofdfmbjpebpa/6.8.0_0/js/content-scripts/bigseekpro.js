const INSERT_CSS = '\
.search_results_item_title{\
	font-size: 13px;\
}\
body{\
	font-size: 12px;\
}\
.search_results_item_link{\
	padding-bottom: 0px;\
}\
.search_header + table td{\
	white-space: nowrap;\
}\
.search_title_right{\
	width: auto;\
	min-width: 50%;\
}\
';

const HIDE_ELEMENTS = [
	".search_header",
	".topsearchdiv",
	".search_numberpager",
	".search_footer",
	"#footer"
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
