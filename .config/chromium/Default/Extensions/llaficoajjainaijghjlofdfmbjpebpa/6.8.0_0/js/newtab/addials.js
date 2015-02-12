(function() {
  var doNotAddDials = new Date().getTime() >= 1414023805011;
  
  if(doNotAddDials) {
    var sIndex = -1;
    for(var i = 0; i != fvdSpeedDial.Introduction.SLIDES.length; i++) {
      if(fvdSpeedDial.Introduction.SLIDES[i].key == "select-mobile-store") {
        sIndex = i;
        break;
      }
    }  
    if(sIndex >= 0) {
      fvdSpeedDial.Introduction.SLIDES.splice(sIndex, 1);
    }
    fvdSpeedDial.Introduction.allowStartButton = true;
  }
  
  fvdSpeedDial.Introduction.hideCallbacks.push(function(params, done) {
    if(doNotAddDials) {
      done();
      return;
    }
    var useVulcun = params.store && params.store != "other";
    var offers = [];
    fvdSpeedDial.Utils.Async.chain([
      function(next) {
        if(!useVulcun) {
          return next();
        }
        VulcunAd.setStore(params.store, next);
      },
      function(next) {
        if(!useVulcun) {
          return next();
        }        
        VulcunAd.loadOffers(function(vulcunOffers) {
          if(vulcunOffers && vulcunOffers.length) {
            offers = offers.concat(vulcunOffers.slice(0,2));
          }
          next();
        });
      },
      function(next) {
        fvdSpeedDial.Utils.getUserCountry(function(cc) {
          var cpaadoffers = CPAAd.getADForCountry(cc, 2);
          if(cpaadoffers && cpaadoffers.length) {
            offers = offers.concat(cpaadoffers);
          }
          next();
        });  
      },
      function() {
        offers = fvdSpeedDial.Utils.shuffle(offers);
        fvdSpeedDial.Storage.groupIdByGlobalId("default", function(groupId) {
          fvdSpeedDial.Utils.Async.arrayProcess(offers, function(dialData, next) {
            try {
              dialData.group_id = groupId;
              fvdSpeedDial.Storage.addDial( dialData, function( res ){
                if( dialData.thumb_source_type == "url" ){
                  fvdSpeedDial.ThumbMaker.getImageDataPath({
                    imgUrl: dialData.thumb_url,
                    screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
                  }, function(dataUrl, thumbSize){
                    fvdSpeedDial.Storage.updateDial( res.id, {
                      thumb: dataUrl,
                      thumb_width: Math.round( thumbSize.width ),
                      thumb_height: Math.round( thumbSize.height )
                    }, function(){
                      next();
                    } );
                  });
                }
                else {
                  next();
                }
              });
            }
            catch(ex) {
              next();
            }
          }, function() {
            fvdSpeedDial.SpeedDial.sheduleRebuild();
            setTimeout(function() {
              done();
            }, 500);
          });
        });
      }
    ]);   
  });
})();
