
// singletone

(function(){

	const PAGE_SCREEN_PARAMS = {
		format: "image/jpeg",
		quality: 80
	};

  var ThumbMaker = function() {
    this.init();
  };

  ThumbMaker.prototype = {
    _listenData: [],

    removeListener: function(listener) {
      var index = this._listenData.indexOf(listener);
      if (index != -1) {
        this._listenData.splice(index, 1);
      }
    },

    resize: function(img, sx, callback, params) {

      params = params || {};
      params.format = params.format || "image/png";
      params.quality = params.quality || 100;

      var srcLower = img.getAttribute("src").toLowerCase();
      if (srcLower.indexOf(".svg") == srcLower.length - 4) {
        // draw svg on canvas
        var cc = document.createElement("canvas");
        cc.width = img.width;
        cc.height = img.height;
        canvg(cc, img.getAttribute("src"), {
          ignoreMouse: true,
          ignoreAnimation: true,
          ignoreDimensions: true,
          ignoreClear: true,
          offsetX: 0,
          offsetY: 0
        });
        img = cc;
      }

      // testing - use simple resize every time
      if (img.width < 1000 || true) {
        // simple resize
        /*
        function resize2(i) {
          var cc = document.createElement("canvas");
          cc.width = i.width / 2;
          cc.height = i.height / 2;
          var ctx = cc.getContext("2d");
          ctx.drawImage(i, 0, 0, cc.width, cc.height);
          return cc;
        }
        var cc = img;
        while (cc.width > sx * 2) {
          cc = resize2(cc);
        }

        img = cc;
        */
        var canvas = document.createElement("canvas");
        var sy = sx * img.height / img.width;
        canvas.width = sx;
        canvas.height = sy;
        var ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0, sx, sy);

        callback(canvas.toDataURL(params.format, params.quality), {
          width: sx,
          height: sy
        });

        return;
      }

      var lobes = 1;

      //returns a function that calculates lanczos weight
      function lanczosCreate(lobes) {
        return function(x) {
          if (x > lobes)
            return 0;
          x *= Math.PI;
          if (Math.abs(x) < 1e-16)
            return 1;
          var xx = x / lobes;
          return Math.sin(x) * Math.sin(xx) / x / xx;
        };
      }

      //elem: canvas element, img: image element, sx: scaled width, lobes: kernel radius
      function thumbnailer(elem, img, sx, lobes) {
        this.canvas = elem;
        elem.width = img.width;
        elem.height = img.height;

        this.ctx = elem.getContext("2d");
        this.ctx.drawImage(img, 0, 0);
        this.img = img;
        this.src = this.ctx.getImageData(0, 0, img.width, img.height);
        this.dest = {
          width: sx,
          height: Math.round(img.height * sx / img.width),
        };
        this.dest.data = new Array(this.dest.width * this.dest.height * 3);
        this.lanczos = lanczosCreate(lobes);
        this.ratio = img.width / sx;
        this.rcp_ratio = 2 / this.ratio;
        this.range2 = Math.ceil(this.ratio * lobes / 2);
        this.cacheLanc = {};
        this.center = {};
        this.icenter = {};
        setTimeout(this.process1, 0, this, 0);
      }

      thumbnailer.prototype.process1 = function(self, u) {
        self.center.x = (u + 0.5) * self.ratio;
        self.icenter.x = Math.floor(self.center.x);
        for (var v = 0; v < self.dest.height; v++) {
          self.center.y = (v + 0.5) * self.ratio;
          self.icenter.y = Math.floor(self.center.y);
          var a, r, g, b;
          a = r = g = b = 0;
          for (var i = self.icenter.x - self.range2; i <= self.icenter.x +
            self.range2; i++) {
            if (i < 0 || i >= self.src.width)
              continue;
            var f_x = Math.floor(1000 * Math.abs(i - self.center.x));
            if (!self.cacheLanc[f_x])
              self.cacheLanc[f_x] = {};
            for (var j = self.icenter.y - self.range2; j <= self.icenter.y +
              self.range2; j++) {
              if (j < 0 || j >= self.src.height)
                continue;
              var f_y = Math.floor(1000 * Math.abs(j - self.center.y));
              if (self.cacheLanc[f_x][f_y] == undefined)
                self.cacheLanc[f_x][f_y] = self.lanczos(Math.sqrt(Math.pow(
                  f_x * self.rcp_ratio, 2) + Math.pow(f_y * self.rcp_ratio,
                  2)) / 1000);
              weight = self.cacheLanc[f_x][f_y];
              if (weight > 0) {
                var idx = (j * self.src.width + i) * 4;
                a += weight;
                r += weight * self.src.data[idx];
                g += weight * self.src.data[idx + 1];
                b += weight * self.src.data[idx + 2];
              }
            }
          }
          var idx = (v * self.dest.width + u) * 3;
          self.dest.data[idx] = r / a;
          self.dest.data[idx + 1] = g / a;
          self.dest.data[idx + 2] = b / a;
        }

        if (++u < self.dest.width)
          setTimeout(self.process1, 0, self, u);
        else
          setTimeout(self.process2, 0, self);
      };
      thumbnailer.prototype.process2 = function(self) {
        self.canvas.width = self.dest.width;
        self.canvas.height = self.dest.height;
        self.ctx.drawImage(self.img, 0, 0);
        self.src = self.ctx.getImageData(0, 0, self.dest.width, self.dest
          .height);
        var idx, idx2;
        for (var i = 0; i < self.dest.width; i++) {
          for (var j = 0; j < self.dest.height; j++) {
            idx = (j * self.dest.width + i) * 3;
            idx2 = (j * self.dest.width + i) * 4;
            self.src.data[idx2] = self.dest.data[idx];
            self.src.data[idx2 + 1] = self.dest.data[idx + 1];
            self.src.data[idx2 + 2] = self.dest.data[idx + 2];
          }
        }
        self.ctx.putImageData(self.src, 0, 0);

        callback(elem.toDataURL(params.format, params.quality), {
          width: self.dest.width,
          height: self.dest.height
        });
      };

      var elem = document.createElement("canvas");

      new thumbnailer(elem, img, sx, lobes);
    },


    getImageDataPath: function(params, callback) {
      var imgUrl = params.imgUrl;
      var screenWidth = params.screenWidth;
      var img = document.createElement('img');

      var that = this;

      img.onerror = function() {
        callback(null);
      };

      img.onload = function() {

        try {

          if (img.width < screenWidth) {
            screenWidth = img.width;
          }

          that.resize(img, screenWidth, function(imgUrl, size) {
            callback(imgUrl, size);
          }, params.format);

        } catch (ex) {

          console.log(ex);
          //callback( null );

        }

      };

      img.setAttribute("src", imgUrl);


    },

    // type = (speeddial, mostvisited)
    screenTab: function(params) {
      var tabId, type, dialId, width, url, delay, saveImage;
      tabId = params.tabId;
      type = params.type;
      dialId = params.dialId;
      width = params.width;
      url = params.url;
      delay = params.delay;
      saveImage = params.saveImage;
      // first search listener with this tabId

      var listener = {
        "tabId": tabId,
        "type": type,
        "dialId": dialId,
        "width": width,
        "url": url,
        screenDelay: delay,
        saveImage: saveImage,
        port: null
      };

      for (var i = 0; i != this._listenData.length; i++) {
        if (this._listenData[i].tabId == tabId) {
          // replace listener
          this._listenData[i] = listener;
          return;
        }
      }

      this._listenData.push(listener);

      return;
    },

    listenerForTab: function(tabId) {
      for (var i = 0; i != this._listenData.length; i++) {
        if (this._listenData[i].tabId == tabId) {
          return this._listenData[i];
        }
      }
      return null;
    },

    init: function() {
      var that = this;

      chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {

        if (info.status) {

          var listener = that.listenerForTab(tabId);

          if (!listener) {
            return;
          }

          function returnToSpeedDial() {

            if (listener.type == "speeddial") {

              fvdSpeedDial.Storage.getDial(listener.dialId, function(
                oldDial) {

                chrome.tabs.create({
                  active: true,
                  url: chrome.extension.getURL(
                    "newtab.html#force-display&dial_preview_maked=" +
                    listener.dialId + "&show_group_id=" +
                    oldDial.group_id)
                }, function() {
                  chrome.tabs.remove(tabId);
                });

              });

            } else {

              chrome.tabs.create({
                active: true,
                url: chrome.extension.getURL(
                  "newtab.html#force-display")
              }, function() {
                chrome.tabs.remove(tabId);
              });

            }

          }

          function saveToDB(result, thumbSize, callback) {
            // get last tab info
            chrome.tabs.get(tabId, function(tab) {

              switch (listener.type) {
                case "speeddial":

                  fvdSpeedDial.Storage.getDial(listener.dialId,
                    function(oldDial) {

                      var resultData = {
                        "auto_title": tab.title
                      };

                      if (oldDial) {

                        //if( !oldDial.title && oldDial.auto_title != tab.title ){
                        // need to sync dials
                        fvdSpeedDial.Sync.addDataToSync({
                          category: "dials",
                          data: listener.dialId,
                          translate: "dial"
                        });
                        //}

                      }

                      if (listener.saveImage) {
                        resultData.thumb = result;
                        resultData.screen_maked = 1;
                        resultData.thumb_width = thumbSize.width;
                        resultData.thumb_height = thumbSize.height;
                        resultData.need_sync_screen = 1;
                      }

                      fvdSpeedDial.Storage.updateDial(listener.dialId,
                        resultData,
                        function() {

                          try {
                            port.postMessage({
                              "message": "created",
                              data: {
                                urlChanged: !fvdSpeedDial
                                  .Utils.isIdenticalUrls(
                                    listener.url, tab.url
                                  ),
                                startUrl: listener.url,
                                currentUrl: tab.url
                              }

                            });
                          } catch (ex) {

                          }


                          if (callback) {
                            callback();
                          }
                        });

                    });


                  break;

                case "mostvisited":

                  var resultData = {
                    "auto_title": tab.title
                  };

                  if (listener.saveImage) {
                    resultData.thumb_source_type = "screen";
                    resultData.thumb = result;
                    resultData.screen_maked = 1;
                    resultData.thumb_width = thumbSize.width;
                    resultData.thumb_height = thumbSize.height;
                  }

                  fvdSpeedDial.Storage.MostVisited.updateData(
                    listener.dialId, resultData,
                    function() {
                      try {
                        port.postMessage({
                          "message": "created"
                        });
                      } catch (ex) {

                      }

                      if (callback) {
                        callback();
                      }
                    });

                  break;
              }

            });

          }


          if (!listener.saveImage) {
            // without image, grab only title
            if (tab.title) {
              that.removeListener(listener);
              saveToDB(null, null, function() {
                returnToSpeedDial();
              });
            }
            return;
          }

          var port = listener.port;

          function fullScreen() {

            setTimeout(function() {
              chrome.tabs.get(tabId, function(tab) {

                if (tab.status == "complete") {

                  // remove listener
                  that.removeListener(listener);

                  chrome.tabs.captureVisibleTab(null, {
                    format: "png"
                  }, function(dataurl) {

                    that.getImageDataPath({
                      imgUrl: dataurl,
                      screenWidth: listener.width,
                      format: PAGE_SCREEN_PARAMS
                    }, function(result, thumbSize) {
                      saveToDB(result, thumbSize,
                        function() {
                          returnToSpeedDial();
                        });
                    });

                  });

                }
              });
            }, 500);


          }

          fvdSpeedDial.Utils.Async.chain([

            function(callbackChain) {

              chrome.tabs.executeScript(tabId, {
                file: "js/cropper/cropper.js"
              }, function() {

                // wait one second for response
                setTimeout(function() {

                  if (!listener.canBeScripted) {
                    // make screen of tab

                    // wait while tab will be completed

                    function _waitForTabCompletion() {

                      // if tab already completed
                      chrome.tabs.get(tabId, function(tab) {

                        if (!tab) {
                          // tab removed
                          return;
                        }

                        if (tab.status == "complete") {
                          fullScreen();
                        } else {
                          setTimeout(function() {
                            _waitForTabCompletion
                              ();
                          }, 1000);
                        }

                      });


                    }

                    _waitForTabCompletion();


                  }

                }, 1000);

                // connect to tab

                port = chrome.tabs.connect(tabId, {
                  name: "thumbmaker_cropper"
                });

                listener.port = port;
                port.onMessage.addListener(function(message) {
                  switch (message.message) {
                    case "change_photo_position":

                      fvdSpeedDial.Prefs.set(
                        "cropper_photo_position_left",
                        message.data.left);
                      fvdSpeedDial.Prefs.set(
                        "cropper_photo_position_top",
                        message.data.top);

                      break;

                    case "set_url":
                      if (listener.type == "speeddial") {
                        fvdSpeedDial.Storage.updateDial(
                          listener.dialId, {
                            url: message.data.url
                          },
                          function() {
                            port.postMessage({
                              message: "url_setted"
                            })
                          });
                      }
                      break;

                    case "ready_to_init":
                      listener.canBeScripted = true;
                      // next include all other scripts and init cropper
                      callbackChain();

                      break;

                    case "return_to_speeddial":

                      returnToSpeedDial();

                      break;

                    case "click_start_crop":

                      port.postMessage({
                        "message": "show_crop_area"
                      });

                      break;

                    case "click_cancel":
                      // remove listener
                      try {
                        that.removeListener(listener);
                        port.postMessage({
                          "message": "destroy"
                        });
                      } catch (ex) {

                      }
                      break;

                    case "make_fullscreen_snapshoot":

                      fullScreen();

                      break;

                    case "snapshoot":
                      var data = message.data;

                      chrome.tabs.captureVisibleTab(null, {
                        format: "png"
                      }, function(dataurl) {

                        port.postMessage({
                          "message": "captured"
                        });
                        // remove listener
                        try {
                          that.removeListener(listener);
                        } catch (ex) {

                        }


                        var img = document.createElement(
                          "img");
                        img.onload = function() {
                          var canvas = document.createElement(
                            "canvas");
                          canvas.width = data.width;
                          canvas.height = data.height;
                          var ctx = canvas.getContext(
                            "2d");
                          ctx.drawImage(img, data.x1,
                            data.y1, data.width,
                            data.height, 0, 0, data
                            .width, data.height);

                          that.getImageDataPath({
                            imgUrl: canvas.toDataURL(
                              "image/png"),
                            screenWidth: listener
                              .width,
                            format: PAGE_SCREEN_PARAMS
                          }, function(result,
                            thumbSize) {
                            saveToDB(result,
                              thumbSize);
                          });

                        };
                        img.src = dataurl;
                      });

                      break;
                  }
                });


              });

            },

            function(callbackChain) {
              chrome.tabs.executeScript(tabId, {
                file: "js/_external/jquery.js"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.executeScript(tabId, {
                file: "js/_external/imgareaselect.js"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.insertCSS(tabId, {
                file: "js/_external/imgareaselect.css"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.executeScript(tabId, {
                file: "js/_external/tiptip.js"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.insertCSS(tabId, {
                file: "js/_external/tiptip.css"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.insertCSS(tabId, {
                file: "styles/cropper/style.css"
              }, function() {
                callbackChain();
              });
            },
            function() {

              port.postMessage({
                "message": "init",
                data: {
                  aspectRatio: fvdSpeedDial.SpeedDial._cellsSizeRatio,
                  init: {
                    width: 1024,
                    height: 1024 / fvdSpeedDial.SpeedDial._cellsSizeRatio
                  },
                  minWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth(),
                  delay: listener.screenDelay,
                  photoPosition: {
                    left: fvdSpeedDial.Prefs.get(
                      "cropper_photo_position_left", 0),
                    top: fvdSpeedDial.Prefs.get(
                      "cropper_photo_position_top", 0)
                  }
                }
              });

            }

          ]);
        }
      });
    }
  };

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.action == "thumbmaker:getimagedatapath") {
      fvdSpeedDial.ThumbMaker.getImageDataPath(msg.params, function(imgUrl, size) {
        sendResponse({
          imgUrl: imgUrl,
          size: size
        });
      });
      return true;
    }
    else if(msg.action == "thumbmaker:screentab") {
      fvdSpeedDial.ThumbMaker.screenTab(msg.params);
    }
  });


  fvdSpeedDial.ThumbMaker = new ThumbMaker();

})();