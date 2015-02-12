if( self != top ){
	
	document.body.scrollTop = 130;
	
	var base = document.createElement("base");
	base.setAttribute("target", "_blank");
	document.head.appendChild( base );
	
	document.body.style.overflowX = "hidden";

}
