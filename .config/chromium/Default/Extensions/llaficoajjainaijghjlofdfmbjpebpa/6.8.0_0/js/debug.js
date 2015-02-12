(function(){
	Debug = function(){
		
	}
	
	Debug.prototype = {
		log: function( data ){
			if( this._debug ){
				console.log( data );		
			}			
		}
	}
	
	this.Debug = new Debug();
}).apply( fvdSpeedDial );
