(function(){
	
	this.PowerOffClient = new function(){
		
		var self = this;
		
		var powerOffButton = null;
		var deck = null;
		var passCodeField = null;
		var enterPassCodeButton = null;
		
		function callback_hiddenChange(){
			refresh();
		}
		
		function refresh( params ){
			
			params = params || {};
			if( typeof params.total == "undefined" ){
				params.total = true;
			}
				
			if( self.isHidden() ){
				document.body.setAttribute( "poweroff", "1" );
				
				powerOffButton.setAttribute( "active", "1" );
			}
			else{
				document.body.setAttribute( "poweroff", "0" );				
				powerOffButton.setAttribute( "active", "0" );	
			}		
	
			
			if( params.total ){
				fvdSpeedDial.SpeedDial.refreshExpandState();				
			}
			
		}
		
		this.isHidden = function(){
			
			return fvdSpeedDial.PowerOff.isHidden();
			
		}
		
		this.hide = function(){
			
			if( !this.isHidden() ){
				fvdSpeedDial.Prefs.set( "poweroff.hidden", true );			
			}
			
		}
		
		this.show = function( password ){
	
			fvdSpeedDial.Prefs.set( "poweroff.hidden", false );			
			
			if( !fvdSpeedDial.SpeedDial.getExpandState() ){
				fvdSpeedDial.SpeedDial.toggleExpand();
			}
			
		}
			
		window.addEventListener( "load", function(){
			
			function tryEnterPasscode(){
				
				var password = passCodeField.value;
				
				passCodeField.value = "";
				
				if( fvdSpeedDial.PowerOff.checkPassword( password ) ){				
					self.show();
				}
				else{
					
					fvdSpeedDial.Dialogs.alert( _("newtab_powerof_wrong_passcode_title"), _("newtab_powerof_wrong_passcode_text") );
					
				}			
				
			}
			
			powerOffButton = document.querySelector( "#searchBar .rightMenu .powerOff" );
			passCodeField = document.getElementById( "poweroffPassCode" );
			enterPassCodeButton = document.getElementById( "enterPowerOffPassCode" );
			
			powerOffButton.addEventListener( "click", function(){
				
				if( fvdSpeedDial.PowerOff.isEnabled() ){				
					self.hide();				
				}
				else{				
					window.open( chrome.extension.getURL( "/options.html#poweroff" ) );
				}			
				
			}, false );
			
			powerOffButton.addEventListener( "mouseover", function(){			
				document.querySelector( "#speedDialCollapsedContent .collapsedMessagePoweroffForm" ).setAttribute( "notransparency", 1 );			
			}, false );
			powerOffButton.addEventListener( "mouseout", function(){			
				document.querySelector( "#speedDialCollapsedContent .collapsedMessagePoweroffForm" ).removeAttribute( "notransparency" );			
			}, false );
			
			passCodeField.addEventListener( "click", function( event ){
				event.stopPropagation();
				event.preventDefault();
			}, false );
			passCodeField.addEventListener( "mousedown", function( event ){
				event.stopPropagation();
			}, false );
			
			passCodeField.addEventListener( "keypress", function( event ){
				
				if( event.keyCode == 13 ){
					tryEnterPasscode();
				}
				
			}, false );
			
			enterPassCodeButton.addEventListener("click", function(){
				tryEnterPasscode();
			}, false);
			enterPassCodeButton.addEventListener( "mousedown", function( event ){
				event.stopPropagation();
			}, false );

			chrome.runtime.onMessage.addListener(function(msg) {
				if(msg.action == "poweroff:hiddenchange") {
					callback_hiddenChange();
				}
			});
			
			refresh({
				total: false
			});
			
		}, false );
		
	}
	
	
}).apply( fvdSpeedDial );
