window.addEventListener( "load", function(){

  fvdSpeedDial.Localizer.localizeCurrentPage();

  fvdSpeedDial.AutoComplete = new fvdSpeedDial.AutoCompletePlus({
    input: "#q",
    form: "#cse-search-box"
  });
  fvdSpeedDial.AutoComplete.onClickSuggestion.addListener(function() {
   fvdSpeedDial.SpeedDialMisc.doSearch();
  });

  start_drop_down();

  fvdSpeedDial.SpeedDialMisc.init();

  fvdSpeedDial.SpeedDial.init();

  fvdSpeedDial.SpeedDial._cellsRebuildCallback = function(){
    document.body.setAttribute("loaded", 1);

    //fvdSpeedDial.SpeedDial._cellsRebuildCallback = null;
  };

  fvdSpeedDial.SpeedDial.sheduleFullRebuild();

  fvdSpeedDial.ContextMenus.init();

  function showCorruptedFilesRestore() {
    var overlay = document.getElementById("restoreCorruptedFilesOverlay");
    overlay.removeAttribute("hidden");
    setTimeout(function() {
      overlay.setAttribute("appear", 1);
    }, 0);
  }

  function hideCorruptedFilesRestore() {
    var overlay = document.getElementById("restoreCorruptedFilesOverlay");
    overlay.removeAttribute("appear");
    overlay.setAttribute("hidden", 1);
  }

  chrome.runtime.onMessage.addListener(function(msg) {
    if(msg.action == "storage:fs:updatestate") {
      if(msg.state == "restoring") {
        showCorruptedFilesRestore();
      }
      else if(msg.state == "normal") {
        var overlay = document.getElementById("restoreCorruptedFilesOverlay");
        if(overlay.hasAttribute("appear")) {
          document.location.reload();
        }
      }
    }
  });

  chrome.runtime.sendMessage({
    action: "storage:fs:getState"
  }, function(state) {
    if(state == "restoring") {
      showCorruptedFilesRestore();
    }
  });

}, false );



