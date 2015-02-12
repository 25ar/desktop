(function() {
  function runMigrations(lastV, currentV) {
    console.log("Run migrations. lastver:", lastV, "currentver:", currentV);
    var migrations = [];
    var countRunned = 0;
    // migrate thumbs from Web SQL to Local FS
    migrations.push(function(done) {
      if(lastV <= 673 || !lastV) {
        countRunned++;
        console.log("Migrate local thumbs to file system");
        fvdSpeedDial.Utils.Async.chain([
          function(next) {
            // need to migrate dial thumbs to local filesystem
            fvdSpeedDial.Storage.listDials(null, null, null, function(dials) {
              fvdSpeedDial.Utils.Async.arrayProcess(dials, function(dial, apNext) {
                // resave thumb for dials
                if(!dial.thumb || typeof dial.thumb != "string" || dial.thumb.indexOf("data") !== 0) {
                  return apNext();
                }
                console.log("Start update dial!", dial);
                fvdSpeedDial.Storage.updateDial(dial.id, {
                  thumb: dial.thumb
                }, apNext);
              }, next);
            });
          },
          function(next) {
            // need to migrate most visited thumbs to local filesystem
            fvdSpeedDial.Storage.MostVisited.getExtendedData(function(data) {
              fvdSpeedDial.Utils.Async.arrayProcess(data, function(item, apNext) {
                // resave thumb for dials
                if(!item.thumb || typeof item.thumb != "string" || item.thumb.indexOf("data") !== 0) {
                  return apNext();
                }
                fvdSpeedDial.Storage.MostVisited.updateData(item.id, {
                  thumb: item.thumb
                }, apNext);
              }, next);
            });
          },
          function(next) {
            // migrate background
            fvdSpeedDial.Storage.getMisc("sd.background", function(data) {
              if(!data || typeof data != "string" || data.indexOf("data:") === -1) {
                return next();
              }
              // store
              fvdSpeedDial.Storage.setMisc("sd.background", data, next);
            });
          },
          function() {
            done();
          }
        ]);
      }
      else {
        done();
      }
    });
    // add redundancy for Local FS files
    migrations.push(function(done) {
      if(lastV <= 679 || !lastV) {
        countRunned++;
        fvdSpeedDial.Utils.Async.chain([
          function(next) {
            // store dials previews
            fvdSpeedDial.Storage.listDials(null, null, null, function(dials) {
              fvdSpeedDial.Utils.Async.arrayProcess(dials, function(dial, apNext) {
                if(!dial.thumb || typeof dial.thumb != "string" || dial.thumb.indexOf("filesystem:") !== 0) {
                  return apNext();
                }
                // save to redundancy storage
                fvdSpeedDial.Storage.FileSystem.getEntryByURL(dial.thumb, function(err, entry) {
                  if(err) {
                    return apNext();
                  }
                  //rewrite file to save in redundancy db
                  fvdSpeedDial.Storage.FileSystem.read(entry.fullPath, function(err, contents) {
                    if(err) {
                      return apNext();
                    }
                    fvdSpeedDial.Storage.FileSystem.write(entry.fullPath, contents, function(err) {
                      apNext();
                    });
                  });
                });
              }, next);
            });
          },
          function(next) {
            // store background image
            fvdSpeedDial.Storage.getMisc("sd.background", function(data) {
              if(!data || typeof data != "string" || data.indexOf("filesystem:") !== 0) {
                return next();
              }
              fvdSpeedDial.Storage.FileSystem.getEntryByURL(data, function(err, entry) {
                if(err) {
                  return next();
                }
                //rewrite file to save in redundancy db
                fvdSpeedDial.Storage.FileSystem.read(entry.fullPath, function(err, contents) {
                  if(err) {
                    return next();
                  }
                  fvdSpeedDial.Storage.FileSystem.write(entry.fullPath, contents, function(err) {
                    next();
                  });
                });
              });
            });
          },
          function() {
            done();
          }
        ]);
      }
      else {
        done();
      }
    });
    migrations.push(function() {
      console.log("Migrations process completed, runned", countRunned, "migrations");
      // force refresh speeddial
      chrome.runtime.sendMessage({
        action: "forceRebuild"
      });
    });
    fvdSpeedDial.Utils.Async.chain(migrations);
  }

  chrome.runtime.onMessage.addListener(function(msg) {
    if(msg.action == "storage:connected") {
      var currentV = chrome.runtime.getManifest().version,
          lastV = localStorage["__v2vmigrations_last_ver"];
      currentV = parseInt(currentV.replace(/\./g, ""), 10);
      if(lastV) {
        lastV = parseInt(lastV.replace(/\./g, ""), 10);
      }
      if(lastV != currentV) {
        localStorage["__v2vmigrations_last_ver"] = chrome.runtime.getManifest().version;
        runMigrations(lastV, currentV);
      }
    }
  });
})();