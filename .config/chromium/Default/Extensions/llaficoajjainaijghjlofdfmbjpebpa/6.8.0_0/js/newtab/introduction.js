fvdSpeedDial.Introduction = new function(){
	
	var self = this;
	
	this.hideCallbacks = [];
	this.allowStartButton = false;
	this.SLIDES = [
		{
			title: _("newtab_introduction_slide1_title"),
			text: _("newtab_introduction_slide1_text") 
		},	
		{
			title: _("newtab_introduction_slide2_title"),
			text: _("newtab_introduction_slide2_text")
		},  
    {
      key: "select-mobile-store",
      title: "",
      text: _("newtab_introduction_slide3_text")
    } 		
	];
	
	var currentSlideIndex = -1;
	// for ad dials
	var selectedMobileStore = null;
	var hideRequestInProcess = false;
	
	function show(){
		document.getElementById("introductionOverlay").setAttribute("appear", 1);		
		buildImages();
		selectSlide(0);
		// setup store select step
    var as = document.querySelectorAll("#introductionDialog .mobile-stores-select > a");
    as = [].slice.call(as);
    as.forEach(function(a) {
      a.addEventListener("click", function() {
        if(hideRequestInProcess) {
          return;
        }
        selectedMobileStore = a.getAttribute("value");
        hide();
        return false;
      });
    });
	}
	
	function hide(){
    if(hideRequestInProcess) {
      return;
    }	  
    hideRequestInProcess = true;
	  document.getElementById("introductionOverlay").setAttribute("loading", 1);
		fvdSpeedDial.Utils.Async.arrayProcess(self.hideCallbacks, function(cb, next) {
		  cb({
		    store: selectedMobileStore
		  }, next);
		}, function() {
		  document.getElementById("introductionOverlay").removeAttribute("loading");
      fvdSpeedDial.Prefs.set( "donotshowintro", true );
      var overlay = document.getElementById("introductionOverlay");
      overlay.style.opacity = 0;
      setTimeout( function(){
        overlay.removeAttribute("appear");  
      }, 200 );
		});
	}
	
	function selectSlide( index ) {
		currentSlideIndex = index;
		var imgContainer = document.querySelector( "#introductionOverlay .imageContainer" );
		var images = imgContainer.getElementsByTagName( "img" );
		// hide step contents
	 	var stepContents = document.querySelectorAll("#introductionDialog .step-content[appear]");
	 	for(var i = 0; i != stepContents.length; i++) {
	 	  stepContents[i].removeAttribute("appear");
	 	}
		var stepContent = document.querySelector("#introductionDialog .step-content[step=\""+index+"\"]");
		if(stepContent) {
		  stepContent.setAttribute("appear", 1);
		  setTimeout(function() {
        imgContainer.removeAttribute("appear");		    
		  }, 500);
		}
		else {
		  imgContainer.setAttribute("appear", 1);
		}
		for( var i = 0; i != images.length; i++ ){
			if( images[i].getAttribute("step") == index && !stepContent ){
				images[i].setAttribute( "appear", 1 );	
			}
			else{
				images[i].setAttribute( "appear", 0 );	
			}
		}
		
		var data = self.SLIDES[index];
		
		var titleContainer = document.querySelector( "#introductionDialog .slideTitle" );
		var textContainer = document.querySelector( "#introductionDialog .slideText" );	
		
		titleContainer.innerHTML = data.title;	
		textContainer.innerHTML = data.text;	
		
		refreshButtons();		
	}
	
	function buildImages(){
		var container = document.querySelector( "#introductionOverlay .imageContainer" );
		while( container.firstChild ){
			container.removeChild( container.firstChild );
		}
		for( var i = 0; i != self.SLIDES.length; i++ ){
		  if(document.querySelector("#introductionDialog .step-content[step=\""+i+"\"]")) {
		    continue;
		  }
			var img = new Image();
			img.src = "images/newtab/introduction/slide"+(i+1)+".png";
			img.setAttribute( "step", i );
			container.appendChild( img );
		}
		
	}
	
	function refreshButtons(){
		var prev = document.querySelector( "#introductionDialog .buttons .prev" );
		var next = document.querySelector( "#introductionDialog .buttons .next" );
		var start = document.querySelector( "#introductionDialog .buttons .start" );				
		
		if( currentSlideIndex == 0 ){
			prev.setAttribute( "appear", 0 );
		}
		else{
			prev.setAttribute( "appear", 1 );
		}
		
		if( currentSlideIndex < self.SLIDES.length - 1 ){
			next.setAttribute( "appear", 1 );
		}
		else{
			next.setAttribute( "appear", 0 );
		}
		
		if( currentSlideIndex == self.SLIDES.length - 1 ){
		  document.querySelector("#introductionDialog .header").setAttribute("title", _("newtab_introduction_last_step"));
		  if(self.allowStartButton) {
        start.setAttribute( "appear", 1 );		    
		  }
		}
		else{
		  document.querySelector("#introductionDialog .header").removeAttribute("title");
			start.setAttribute( "appear", 0 );
		}
		
	}
	
	window.addEventListener( "load", function(){
		
		if( _b( fvdSpeedDial.Prefs.get( "donotshowintro" ) ) ){
			return;
		}
		
		show();
		
		document.querySelector( "#introductionDialog .buttons .next" ).addEventListener("click", function(){			
			selectSlide( currentSlideIndex + 1 );				
		}, false);
		document.querySelector( "#introductionDialog .buttons .prev" ).addEventListener("click", function(){			
			selectSlide( currentSlideIndex - 1 );				
		}, false);
		document.querySelector( "#introductionDialog .buttons .start" ).addEventListener("click", function(){			
			hide();		
		}, false);		
		document.querySelector( "#introductionDialog .close" ).addEventListener("click", function(){			
			hide();		
		}, false);
		
	} );
	
};
