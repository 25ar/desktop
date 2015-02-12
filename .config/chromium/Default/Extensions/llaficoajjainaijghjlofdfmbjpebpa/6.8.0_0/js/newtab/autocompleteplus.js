(function() {
  var _lastaCIndex = 0,
      acSources = {},
      acSourcesXHR = null;
  
  /*
   * @param [string] params.query
   */
  acSources.google = function(params, cb) {
    if(acSourcesXHR) {
      acSourcesXHR.abort();
    }
    var url = "http://google.com/complete/search?output=toolbar&q=" + encodeURIComponent(params.query);
    
    var req = new XMLHttpRequest();
    acSourcesXHR = req;
    req.open('GET', url, true);
    req.inst = this;
    req.q = "";
    req.onload = function() {
      acSourcesXHR = null;
      var r = req.responseXML;
      if (r) {
        var elems = r.getElementsByTagName("suggestion");
        var items = [];
        for (var i = 0; i != elems.length; i++) {
          items.push(elems[i].getAttribute("data"));
        }
        cb({
          items: items
        });        
      }
    };
    req.send(null);
  };
  
  acSources.ebay = function(params, cb) {
    if(acSourcesXHR) {
      acSourcesXHR.abort();
    }    
    var url = "http://autosug.ebay.com/autosug?kwd="+encodeURIComponent(params.query)+"&version=1279292363&_jgr=1&sId=0&_ch=0&callback=GH_ac_callback";
    var req = new XMLHttpRequest();
    acSourcesXHR = req;
    req.open('GET', url, true);
    req.inst = this;
    req.q = "";
    req.onload = function() {
      acSourcesXHR = null;
      var r = req.responseText;
      if (r) {
        var items = [],
            m = r.match(/AutoFill\._do\((.+?)\)$/i),
            parsed = null;
        if(m) {          
          parsed = JSON.parse(m[1]);          
          if(!parsed.res) {
            return cb({
              items: []
            });
          }
          cb({
            items: parsed.res.sug 
          });
        }
      }
    };
    req.send(null);        
  };
  
  function addLoadEvent(a) {
    window.addEventListener("load", a);
  }

  /*
   * @param [string] params.input - selector
   * @param [string] params.form - selector
   */
  function AutoComplete(params) {
    var acId = ++_lastaCIndex, 
        suggestElemId = "suggest_" + acId, 
        suggestionsTableId = "suggestions_" + acId, 
        self = this, 
        acpObj = {},
        inputEl = document.querySelector(params.input),
        acSource = inputEl.hasAttribute("data-autocomplete-source") ? inputEl.getAttribute("data-autocomplete-source") : "google";

    this.onPopupShow = new EventEmitter();
    this.onPopupHide = new EventEmitter();
    this.onClickSuggestion = new EventEmitter();

    function $(a) {
      if (a == "force_acp_object_imput") {
        return acpObj.force_input_obj;
      } else if (a == "force_acp_object_form") {
        return acpObj.force_form_obj;
      }
      return document.getElementById(a);
    }

    function autocompleteHide(event) {
      var suggest = $(suggestElemId);      
      if (suggest) {
        suggest.style.display = "none";
      }
      document.removeEventListener("click", autocompleteHide, true);
      self.onPopupHide.callListeners();
      if (event) {
        event.stopPropagation();
      }
    }

    function startAutocomplete() {
      acpObj = {
        force_input_obj : document.querySelector(params.input),
        force_form_obj : document.querySelector(params.form),
        click_callback : function() {

        },
        acp_searchbox_id : "force_acp_object_imput", /* ID of the search <input tag   */
        acp_search_form_id : "force_acp_object_form", /* ID of the search form         */
        acp_partner : "flsh", /* AutoComplete+ partner ID      */
        acp_suggestions : "7", /* Number of suggestions to get  */
      };

      var c = $(acpObj.acp_searchbox_id);

      c.addEventListener("keyup", function(event) {
        acpObj.ac.s(event, c);
      });

      var b = document.createElement("div");
      b.setAttribute("class", "acp_ltr");
      var mainContainer = b;

      var table = document.createElement("table");

      b.appendChild(table);
      table.setAttribute("cellspacing", "0");
      b.setAttribute("style", "display:none");
      b.setAttribute("id", suggestElemId);
      var a = document.createElement("tbody");
      a.setAttribute("id", suggestionsTableId);
      table.appendChild(a);
      c.parentNode.appendChild(b);
      if (!acpObj.acp_sig) {
        acpObj.acp_sig = "on";
      }
      if (acpObj.acp_sig == "on") {
        tfoot = document.createElement("tfoot");
        tr = document.createElement("tr");
        td = document.createElement("td");

        tr.appendChild(td);
        tfoot.appendChild(tr);
        table.appendChild(tfoot);
      }

      b = table;

      (function() {
        var b = {
          y : -1,
          table : $(suggestionsTableId)
        };

        function g(h, k) {
          for (var j = h.table.rows.length - 1; j >= 0; j--) {
            h.table.rows[j].style.backgroundColor = "";
          }
          if (k === undefined) {
            h.table.rows[h.y].style.backgroundColor = "#eee";
            $(acpObj.acp_searchbox_id).value = h.table.rows[h.y].cells[0].getAttribute("queryText");
          } else {
            k.style.backgroundColor = "#eee";
            h.y = k.getAttribute("sugID");
          }
        }

        function c(m, k, l) {
          var n;
          if (document.all) {
            n = "rules";
          } else {
            if (document.getElementById) {
              n = "cssRules";
            }
          }
          var j = document.styleSheets;
          for (var h = 0; h < document.styleSheets[j.length - 1][n].length; h++) {
            if (document.styleSheets[j.length - 1][n][h].selectorText == m) {
              document.styleSheets[j.length - 1][n][h].style[k] = l;
              return;
            }
          }
        }

        function e(i) {
          if (!acpObj.acp_b) {
            acpObj.acp_b = 1;
          }
          if (!b.table) {
            b.table = $(suggestionsTableId);
            var j = $(acpObj.acp_searchbox_id);
          }
          if (!acpObj.acp_api) {

          }

          //var h = "http://google.com/complete/search?output=toolbar&q=" + encodeURIComponent(i);

          this.c(i);
        }

        function d(query) {
          acSources[acSource]({
            query: query
          }, function(result) {
            a({
              "items" : result.items,
              "query" : query
            });
          });
        }

        function f(i, h) {

          if (h.value.length == 0) {
            $(suggestElemId).style.display = "none";
            return;
          }

          if (i.keyCode == 27) {

            if ($(suggestElemId) && $(suggestElemId).style.display != "none") {
              autocompleteHide(i);
              i.stopPropagation();
            }

            return;
          }

          var i = i || event;
          switch (i.keyCode) {
            case 38:
              b.y--;
              break;
            case 40:
              b.y++;
              break;
            case 13:
            case 39:
            case 37:
              return;
              break;
            default:
              this.r(h.value);
              b.y = -1;
              return;
          }

          if (b.y < 0) {
            b.y = b.table.rows.length - 1;
          }
          if (b.y >= b.table.rows.length) {
            b.y = 0;
          }
          if (b.y >= b.table.rows.length) {
            b.y = 0;
          }

          if (i.keyCode == 38 || i.keyCode == 40) {

            if ($(suggestElemId) && $(suggestElemId).style.display == "none") {
              fvdSpeedDial.AutoComplete.onPopupShow.callListeners();
              $(suggestElemId).style.display = "block";
            }

          }

          this.f(b);
        }

        function a(m) {
          dd_hide();

          var i = $(suggestionsTableId);

          var l = String(m.items).split(",");
          while (i.rows && i.rows.length) {
            i.deleteRow(-1);
          }
          for (s in l) {
            if (l[s] == "") {
              continue;
            }
            var k = i.insertRow(-1);
            var h = k.insertCell(0);
            h.style.display = "block";

            var bolderText = document.createElement("b");
            bolderText.textContent = l[s].substr(m.query.length, l[s].length);
            var queryText = document.createTextNode(m.query);

            var newdiv = document.createElement("div");
            newdiv.appendChild(queryText);
            newdiv.appendChild(bolderText);

            h.setAttribute("queryText", l[s]/* + m.query*/);

            h.appendChild(newdiv);

            h.style.width = "";
            k.setAttribute("sugID", s);
            k.onmouseover = function() {
              acpObj.ac.f(b, this);
            };

            k.addEventListener("dblclick", function(event) {

              event.stopPropagation();

            }, false);

            k.addEventListener("click", function(event) {
              $(acpObj.acp_searchbox_id).value = '';              
              $(acpObj.acp_searchbox_id).focus();
              var te = document.createEvent('TextEvent');
              te.initTextEvent('textInput', true, true, window, this.cells[0].getAttribute("queryText"));
              $(acpObj.acp_searchbox_id).dispatchEvent(te);
              autocompleteHide();
              event.stopPropagation();
              self.onClickSuggestion.callListeners();              
            });            
          }
          document.addEventListener("click", autocompleteHide, false);
          
          if ($(suggestElemId).style.display == "none") {
            $(suggestElemId).style.display = "block";
          }
          if (i.rows.length == 0) {
            $(suggestElemId).style.display = "none";
          }

          fvdSpeedDial.AutoComplete.onPopupShow.callListeners();
        }


        acpObj.ac = {
          s : f,
          h : a,
          r : e,
          c : d,
          f : g,
          css : c
        };
      })();

    }


    
    document.querySelector(params.input).addEventListener("keydown", function(event) {
      if (event.keyCode == 13) {
        if ($(suggestElemId) && $(suggestElemId).style.display != "none") {
          event.stopPropagation();
          event.preventDefault();
          fvdSpeedDial.SpeedDialMisc.doSearch();
          autocompleteHide();
        }
      }
    }, false);
    
    
    startAutocomplete();
  }
  
  fvdSpeedDial.AutoCompletePlus = AutoComplete;

})();

