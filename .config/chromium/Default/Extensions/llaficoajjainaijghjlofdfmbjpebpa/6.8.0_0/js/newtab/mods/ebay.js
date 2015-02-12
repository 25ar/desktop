(function() {
  function isEbayUrl(url) {
    var host = fvdSpeedDial.Utils.parseUrl(url, "host");
    if(!host) {
      return false;
    }    
    if(/(?:^|\.)ebay\.[^\.]+$/.test(host)) {
      return true;
    }
    return false;
  }  
  function doSearch() {
    var query = document.querySelector("#ebaySearchForm .searchField input").value.trim();
    if(!query) {
      return;
    }
    document.location = "http://fvdmedia.com/addon_search/ebay.php?q="+encodeURIComponent(query);
  }
  function isSearchOpened() {
    var overlay = document.querySelector("#ebaySearchOverlay");
    return overlay.hasAttribute("appear");
  }
  function showSearch() {
    var overlay = document.querySelector("#ebaySearchOverlay");
    overlay.style.display = "block"
    setTimeout(function() {
      overlay.setAttribute("appear", 1);  
    }, 0);        
    
    var input = document.querySelector("#ebaySearchForm .searchField input");
    input.value = "";
    input.focus();
  }
  function hideSearch() {
    var overlay = document.querySelector("#ebaySearchOverlay");
    overlay.style.display = "none"    
    overlay.removeAttribute("appear");
  }
  fvdSpeedDial.SpeedDial.onBuildCompleted.addListener(function() {
    var dials = document.querySelectorAll("#cellsContainer .newtabCell");    
    dials = [].slice.call(dials);
    dials.forEach(function(dialElem) {
      var url = dialElem.getAttribute("data-url");      
      if(!url) {
        return;        
      }
      if(isEbayUrl(url)) {
        if(!dialElem.querySelector(".ebay-magnifier")) {
          dialElem.classList.add("with-ebay-search");
          var magnifier = document.createElement("button");
          magnifier.className = "btn-no-style ebay-magnifier";  
          dialElem.appendChild(magnifier);
          magnifier.setAttribute("title", _("newtab_search_on_ebay"));
          magnifier.addEventListener("mousedown", function(event) {
            event.stopPropagation();
            event.preventDefault();
          });          
          magnifier.addEventListener("click", function(event) {
            event.stopPropagation();
            event.preventDefault();
            showSearch();            
          });
        }        
      }
      else {
        
      }
    });
  });
  
  document.addEventListener("DOMContentLoaded", function() {
    // init autocomplete
    var autocomplete = new fvdSpeedDial.AutoCompletePlus({
      input: "#ebaySearchForm .searchField input",
      form: "#ebaySearchForm"
    });    
    
    autocomplete.onClickSuggestion.addListener(function() {
      doSearch();
    });
    
    var overlay = document.querySelector("#ebaySearchOverlay");
    overlay.addEventListener("click", function(event) {
      if(event.target == overlay) {
        hideSearch();
      }
    }, false);
    
    overlay.querySelector(".search-button button").addEventListener("click", function() {
      doSearch();
    }, false);
    
    document.addEventListener("keydown", function(event) {
      if(event.keyCode == 27 && isSearchOpened()) {
        hideSearch();
      }
    }, false);
    
    var input = document.querySelector("#ebaySearchForm .searchField input");
    input.addEventListener("keydown", function(event) {
      if(event.keyCode == 13) {
        doSearch();
      }
    }, false);
    
    /*
    document.body.addEventListener("click", function(event) {
      var target = event.target;
      if(target.matches(".newtabCell .ebay-magnifier")) {
        alert("OK Lat's GO!");
      }
    }, false);
    */
  }, false);
  
})();
