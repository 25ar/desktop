// proxy access to storage object to background page

(function() {
  var proxyMethods = [
    "resetAllDialsClicks",
    "groupsList",
    "setMisc",
    "getMisc",
    "dump",
    // Deny
    "clearDeny",
    "editDeny",
    "isDenyUrl",
    "deny",
    "denyList",
    "removeDeny",
    // Apps
    "Apps.get",
    "Apps.storePositions",
    // Dials
    "countDials",
    "listDials",
    "insertDialUpdateStorage",
    "dialExists",
    "addDial",
    "deleteDial",
    "getDial",
    "updateDial",
    "moveDial",
    "clearDials",
    "dialGlobalId",
    "resetAutoDialsForGroup",
    // groups
    "groupExists",
    "groupUpdate",
    "groupAdd",
    "getGroup",
    "groupCanSyncById",
    "clearGroups",
    "groupsCount",
    "groupDelete",
    // Most Visited
    "MostVisited.getAvailableCount",
    "MostVisited.getData",
    "MostVisited.getDataByHost",
    "MostVisited.extendData",
    "MostVisited.getById",
    "MostVisited.updateData",
    "MostVisited.deleteId",
    // Recently Closed
    "RecentlyClosed.getAvailableCount",
    "RecentlyClosed.getData",
    "RecentlyClosed.remove"
  ];

  var StorageProxy = function() {
  };
  var p = new StorageProxy();

  proxyMethods.forEach(function(methodName) {
    function _processMethod() {
      var args = Array.prototype.slice.call(arguments),
          lastIndex = args.length - 1,
          cb = null;
      if(typeof args[lastIndex] == "function") {
        cb = args[lastIndex];
        args.splice(lastIndex, 1);
      }
      var request = {
        action: "proxy:storage",
        method: methodName,
        args: args,
        wantResponse: cb !== null
      };
      chrome.runtime.sendMessage(request, function(data) {
        if(cb) {
          cb.apply(window, data.args);
        }
      });
    }

    var parts = methodName.split(".");
    var m = parts.pop(),
        obj = p;
    parts.forEach(function(part) {
      if(typeof obj[part] == "undefined") {
        obj[part] = {};
      }
      obj = obj[part];
    });
    obj[m] = _processMethod;
  });
  fvdSpeedDial.Storage = p;
})();

  
