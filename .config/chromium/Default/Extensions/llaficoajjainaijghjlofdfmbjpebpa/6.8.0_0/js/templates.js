(function() {
  var el = document.createElement("div");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.runtime.getURL("/templates.html"), false);
  xhr.send(null);
  el.innerHTML = xhr.responseText;
  fvdSpeedDial.Localizer.localizeElem(el);
  fvdSpeedDial.Templates = {
    getHTML: function(id) {
      return el.querySelector("#" + id).innerHTML;
    },
    clone: function(id) {
      return el.querySelector("#" + id).cloneNode(true);
    }
  };
})();