(function(){
	

	var Background = function(){
		
	}
	
	Background.prototype = {
		
		CURRENT_CHROME_THEME_BACKGROUND_URL: "chrome://theme/IDR_THEME_NTP_BACKGROUND",
		
		/**
		 *		 
		 * bgData = {
		 * 	color,
		 *  useColor,
		 *  imageUrl,
		 *  imageType,
		 *  adaptiveSize,
		 *  callback
		 * }
		 * 
		 */
						
		setToElem: function( bgData, elem ){
			
			var that = this;
			
			if( bgData.imageUrl && bgData.imageType != "noimage" ){
				var img = new Image();
				img.onload = function(){					
					bgData.imgInst = img;
					that._setToElem( bgData, elem );
				}
				img.onerror = function(){
					that._setToElem( bgData, elem );
				}
				img.src = bgData.imageUrl;				
			}
			else{
				this._setToElem( bgData, elem );
			}
			
		},
		
		/*
		 * bgData some like setToElem but if have image added param imgInst
		 */
		_setToElem: function( bgData, elem ){
			
			elem.style.background = "none";
		
			console.log( bgData );
			
			if( bgData.imgInst ){
				
				var elemWidth, elemHeight;

				if( elem.clientWidth ){
					elemWidth = elem.clientWidth;
					elemHeight = elem.clientHeight;			
				}
				else{
					elemWidth = elem.offsetWidth;
					elemHeight = elem.offsetHeight;								
				}

		

				elem.style.backgroundImage = "url("+ bgData.imageUrl.replace( "(", "\\(" ).replace( ")", "\\)" ) +")";
				
				if( bgData.adaptiveSize ){
					var ratio = elemWidth / bgData.adaptiveSize.width;
					var bgWidth = Math.round(ratio * bgData.imgInst.width);
					var bgHeight = Math.round(ratio * bgData.imgInst.height);
					
					elem.style.backgroundSize = bgWidth+"px "+bgHeight+"px";
				}
				
		
				
				switch( bgData.imageType ){
					case "fill":
						elem.style.backgroundPosition = "center center";
						elem.style.backgroundSize = "cover";
						elem.style.backgroundRepeat = "no-repeat";
					break;
					case "fit":
						elem.style.backgroundPosition = "center center";
						elem.style.backgroundSize = "contain";
						elem.style.backgroundRepeat = "no-repeat";			
					break;
					case "stretch":
						elem.style.backgroundSize = "100% 100%";
						elem.style.backgroundRepeat = "no-repeat";
					break;
					case "tile":
						
					break;
					case "center":
						elem.style.backgroundPosition = "center center";
						elem.style.backgroundRepeat = "no-repeat";
					break;				
				}
			
				if (!bgData.adaptiveSize) {
					// if not specified adaptive size - this is not preview, than set attachment
					elem.style.backgroundAttachment = "fixed";					
				}
			

				
				if( bgData.useColor ){
					elem.style.backgroundColor = "#"+bgData.color;		
				}				
			}
			else{
			
				if( bgData.useColor ){
					elem.style.backgroundColor = "#"+bgData.color;		
				}
				else{					
						
				}	
			}
				
			if( bgData.callback ){
				bgData.callback( bgData );
			}
		}
		
	}
	
	this.Background = new Background();
	
}).apply(fvdSpeedDial);
