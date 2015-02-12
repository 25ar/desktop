(function(){
  
  var ButtonController = function(){
    
    function refreshButton(){
      
      var image = "/images/icons/24x24_nosync.png";
      
      switch(fvdSynchronizer.Server.Sync.syncState()){
        case "sync":
          image = "/images/icons/24x24_sync.png";
        break;
        case "hasDataToSync":
          image = "/images/icons/24x24.png";
        break;
      }
      
      chrome.browserAction.setIcon( {
        path: image
      } );
      
    }
    /*
    chrome.extension.onRequest.addListener(function( request ){
      
      if( request.subject == "changeSyncState" ){
        refreshButton();
      }
      
    });
    */
    
    this.refreshButton = function(){
      refreshButton();
    };
    
    window.addEventListener( "load", function(){
      
      refreshButton();

    }, false );
    
  };
  
  this.ButtonController = new ButtonController();
  
}).apply( fvdSynchronizer );