// redirect all requests from proxy to Storage object

(function() {
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.action == "proxy:storage") {
      if(msg.wantResponse) {
        msg.args.push(function() {
          sendResponse({
            args: Array.prototype.slice.call(arguments)
          });
        });
      }
      var accessObj = fvdSpeedDial.Storage,
          parts = msg.method.split("."),
          m = parts.pop();
      parts.forEach(function(part) {
        accessObj = accessObj[part];
      });
      //console.log("ARGS", m, msg.args);
      accessObj[m].apply(accessObj, msg.args);
      if(msg.wantResponse) {
        // we call waitResponse after processing
        return true;
      }
    }
  });
})();