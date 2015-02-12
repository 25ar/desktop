if( self != top ){
	
	document.documentElement.style.visibility = "hidden";

	document.documentElement.style.overflow = "hidden";
	
	document.addEventListener("DOMContentLoaded", function(){
		
		var css = '#sw_hdr{display:none}';
		css += '#sidebar{display:none}';
		css += '#tw{display:none}';
		css += '#sw_abar{display:none}';
		css += '#sw_content{width:auto}';	
		css += '#sw_canvas{padding-left: 20px !important;}';		
		css += '#sa_bop{display:none}';
		css += '.rc_msg{display:none}';
		css += '.rc_msg{display:none}';
		css += '.sb_pag{display:none}'	
		css += '.sb_pag{display:none}'	
		css += '#sb_foot{display:none}';
		css += '#results_container .ans{display:none}';
		css += '#sw_main .sw_a{display:none}';
		
		var s = document.createElement("style");
		s.textContent = css;
		
		document.body.appendChild(s);
		
		var base = document.createElement("base");
		base.setAttribute( "target", "_blank" );
		document.body.appendChild( base );
		
		setTimeout(function(){
			document.documentElement.style.overflow = "";
			document.documentElement.style.visibility = "visible";	
	
			setTimeout(function(){
				chrome.extension.sendMessage({
					action: "setLiveSearchWindowSize",
					size: document.documentElement.offsetHeight,
					url: document.location.href
				});						
			}, 100);
	
		}, 500);

			
	}, false);
		
}
