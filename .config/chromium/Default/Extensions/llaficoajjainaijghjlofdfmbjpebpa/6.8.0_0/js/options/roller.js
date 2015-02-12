(function(){
	
	var Roller = function(){
		
	}
	
	var _Roller = function( elem ){
		this._elem = elem;
	}
	
	_Roller.prototype = {
		_elem: null,
		
		rollTo: function( itemNumber ){ /* from zero */		
			
			var that = this;
			
			var firstNode = this._elem.querySelector("div:first-child");
			var width = firstNode.offsetWidth;
			
			var offset = -itemNumber*width;
			
			firstNode.style.marginLeft = offset + "px";
			/*
			this._elem.style.opacity = 0.5;
			
			setTimeout(function(){
				that._elem.style.opacity = 1;
			}, 500);
			*/
		}
	}
	
	Roller.prototype = {
		create: function( elem ){
			return new _Roller( elem );		}
	};
	
	this.Roller = new Roller();
	
}).apply( fvdSpeedDial );
