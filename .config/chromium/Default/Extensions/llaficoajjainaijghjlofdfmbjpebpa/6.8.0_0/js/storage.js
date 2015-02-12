// signletone, original saved in background page

// note:
// to get favicon use URL : chrome://favicon/http://www.google.com
//

(function() {

  function checkLocalFile(url, thumb_source_type, thumb_url, cb) {
    var res = {};
    if(thumb_source_type && thumb_source_type != "screen") {
      return cb(null);
    }
    if( url.indexOf( "file://" ) === 0 ) {
      if(thumb_source_type) {
        res.thumb_source_type = thumb_source_type;
      }
      if(thumb_url) {
        res.thumb_url = thumb_url;
      }
      // process add local file to speed dial
      res.title = url.match(/[\/\\]([^\/\\?]+)[^\/\\]*$/i)[1];
      if(/(\.jpe?g|\.gif|\.png)$/i.test(url)) {
        res.thumb_url = url;
        res.thumb_source_type = "url";
        fvdSpeedDial.Utils.imageUrlToDataUrl(res.thumb_url, function(th, size) {
          res.thumb = th;
          res.thumb_width = size.width;
          res.thumb_height = size.height;
          cb(res);
        });
      }
      else if(/(\.html?|\.pdf)$/i.test(url)) {
        cb(res);
      }
      else {
        // not allowed for auto screen use standard image for local file
        res.screen_maked = 1; // use force url
        res.thumb_url = "https://s3.amazonaws.com/fvd-data/sdpreview/local_file.png";
        fvdSpeedDial.Utils.imageUrlToDataUrl(res.thumb_url, function(th, size) {
          res.thumb = th;
          res.thumb_width = size.width;
          res.thumb_height = size.height;
          cb(res);
        });
        res.thumb_source_type = "url";
      }
    }
    else {
      cb(null);
    }
  }

  var Storage = function(){

  };

  Storage.prototype = {

    _connection: null,
    _dbName: "fvdSpeedDialDataBase",
    _estimatedSize: 500 * 1024 * 1024,

    // callbacks
    _groupsChangeCallbacks: [],
    _dialsChangeCallbacks: [],
    _standardThumbDirUrl: "/images/newtab/dials_standard",

    // force use transaction
    _transaction: null,

    _backupRegexp: /_backup_(.+?)_(.+)$/i,

    _defaultDials: [

      {
        group: {
          name: _("bg_default_group_name"),
          global_id: "default",
          sync: 1
        },
        dials: [

          {
            url: "https://chrome.google.com/webstore/category/home",
            thumb_source_type: "url",
            thumb_url: "https://s3.amazonaws.com/fvd-data/sdpreview/0/f850db11/1377550434-521bc062b1885/preview.png",
            title: _("bg_default_dial_webstore"),
            global_id: "21a2730a"
          },/*
          {
            url: "https://google.com",
            thumb_source_type: "url",
            thumb_url: "https://s3.amazonaws.com/fvd-data/sdpreview/0/e14f0993/1381885410-525de5e2c6b34/preview.png",
            title: _("bg_default_dial_google"),
            global_id: "e14f0993"
          },*/
          {
            url: "http://facebook.com",
            thumb_source_type: "url",
            thumb_url: "https://s3.amazonaws.com/fvd-data/sdpreview/0/22ae9a07/1377549791-521bbddf9dc9b/preview.png",
            title: _("bg_default_dial_facebook"),
            global_id: "22ae9a07"
          },
          {
            url: "http://twitter.com",
            thumb_source_type: "url",
            thumb_url: "https://s3.amazonaws.com/fvd-data/sdpreview/0/f125b86e/1377503184-521b07d0319ef/preview.png",
            title: _("bg_default_dial_twitter"),
            global_id: "f125b86e"
          },
          {
            url: "http://amazon.com",
            thumb_source_type: "url",
            thumb_url: "https://s3.amazonaws.com/fvd-data/sdpreview/0/2060fdd1/1377466564-521a78c4f166f/preview.png",
            title: _("bg_default_dial_amazon"),
            global_id: "2060fdd1"
          },
          {
            url: "http://ebay.com",
            thumb_source_type: "url",
            thumb_url: "https://s3.amazonaws.com/fvd-data/sdpreview/0/d70b5c2/1377504927-521b0e9fb4575/preview.png",
            title: _("bg_default_dial_ebay"),
            global_id: "d70b5c2"
          }

        ]
      }

    ],

    createForOneTransaction: function( callback ){

      var transactionStorage = new Storage();
      transactionStorage._connection = this._connection;

      transactionStorage._connection.transaction( function( tx ){

        transactionStorage._transaction = tx;

        callback(transactionStorage);

      } );

    },



    // backup

    backupTables: function( tables, postfix, callback ){

      console.log( "Backup tables with postfix ", postfix );

      var that = this;

      fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){

        that.transaction( function( tx ){

          tx.executeSql( "CREATE TABLE IF NOT EXISTS _backup_" + postfix + "_" + table + " AS SELECT * FROM " + table, [], function(){

            arrayProcessCallback();

          } );

        } );

      }, callback );

    },

    removeBackup: function( postfix, callback ){

      var regexp = this._backupRegexp;

      var that = this;

      this._getTables( function( tables ){

        fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){

          var matches = table.match( regexp );

          if( matches && (matches[1] == postfix || !postfix ) ){

            that.transaction( function( tx ){

              tx.executeSql( "DROP TABLE " + table, [], arrayProcessCallback );
            } );

          }
          else{
            arrayProcessCallback();
          }

        }, callback);

      });

    },

    restoreBackupInitial: function( callback ){

      var that = this;

      var regexp = this._backupRegexp;

      this._getTables( function( tables ){

        var backupPostfixes = [];

        fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){

          var matches = table.match( regexp );

          if( matches && backupPostfixes.indexOf( matches[1] ) == -1 ){
            backupPostfixes.push(matches[1]);
          }

          arrayProcessCallback();


        }, function(){

          if( backupPostfixes.length == 0 ){
            callback();
          }
          else{

            var restorePostfix = backupPostfixes.shift();

            that.restoreBackup( restorePostfix, function(){

              fvdSpeedDial.Utils.Async.arrayProcess(backupPostfixes, function( postfix, arrayProcessCallback ){

                that.removeBackup( postfix, arrayProcessCallback );

              }, callback);

            } );

          }


        });

      });

    },

    restoreBackup: function( postfix, callback ){

      console.log( "RESTORE Backup tables with postfix ", postfix );

      var that = this;

      var regexp = this._backupRegexp;

      this._getTables( function( tables ){

        fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){

          var matches = table.match( regexp );

          if( matches && matches[1] == postfix ){

            var tableOrig = matches[2];

            that.transaction( function( tx ){

              fvdSpeedDial.Utils.Async.chain( [
                function( chainCallback ){

                  tx.executeSql( "DELETE FROM " + tableOrig, [], chainCallback );

                },
                function( chainCallback ){

                  tx.executeSql( "INSERT INTO " + tableOrig + " SELECT * FROM " + table, [], chainCallback );

                },

                function( chainCallback ){

                  tx.executeSql( "DROP TABLE " + table , [], chainCallback );

                },

                function(){
                  arrayProcessCallback();
                }
              ] );



            } );

          }
          else{
            arrayProcessCallback();
          }

        }, callback );



      } );

    },

    connect: function( callback ){
      var that = this;

      this._connection = openDatabase(this._dbName, '1.0', '', this._estimatedSize);
      this._createTables(function( result ) {
        if( fvdSpeedDial._debug ){
          console.log( "Tables creation result: " + result );
        }
        that.restoreBackupInitial( function() {
          if( callback ){
            callback();
          }
          chrome.runtime.sendMessage({
            action: "storage:connected"
          });
        } );
      });
    },

    transaction: function( callback ){

      if( this._transaction ){
        callback( this._transaction );
      }
      else{
        this._connection.transaction( callback );
      }

    },

    resetAllDialsClicks: function(cb) {
      this.transaction(function(tx) {
        tx.executeSql("UPDATE `dials` SET `clicks` = 0", [], function() {
          cb();
        });
      });
    },

    // restore tables data

    restoreTablesData: function( data, callback, progressCallback ){

      var tables = [];
      var totalRows = 0;
      var count = 0;

      for( var table in data ){
        tables.push( table );
        totalRows += data[table].length;
      }

      var that = this;

      fvdSpeedDial.Utils.Async.arrayProcess(tables, function( table, apc1 ){

        that.transaction( function( tx ){
          tx.executeSql( "DELETE FROM `"+table+"`", [], function() {
            if(table == "dials") {
              chrome.runtime.sendMessage({
                action: "storage:dialsCleared"
              });
            }
            fvdSpeedDial.Utils.Async.arrayProcess(data[table], function( row, apc2 ){

              var fields = [];
              var questions = [];
              var values = [];

              for( var k in row ){
                fields.push( "`"+k+"`" );
                questions.push( "?" );
                values.push( row[k] );
              }

              that.transaction( function( tx ){

                var query = "INSERT INTO `"+table+"`("+fields.join(",")+") VALUES("+questions.join(",")+")";

                tx.executeSql( query, values, function(){
                  console.log( "OK", arguments );
                  count++;

                  if( progressCallback ){
                    progressCallback( count, totalRows );
                  }

                  apc2();
                }, function(){
                  console.log( "FAIL", arguments );
//                    apc2();
                } );

              });

            }, function(){
              apc1(); // to next table
            });

          } );
        } );

      }, function(){

        callback();

      });

    },

    // dump functions

    dump: function( dumpToJsonCallback ){

      var that = this;

      fvdSpeedDial.Utils.Async.chain([

        function( callback, dataObject ){

          // get dials
          that.transaction(function( tx ){
            tx.executeSql( "SELECT `url`, `title`, `auto_title`, `thumb_source_type`, `get_screen_method`," +
                           " `thumb_url`, `position`, `update_interval`, " +
                           "`group_id`, `clicks`, `deny`, `screen_delay`, `thumb_width`, `thumb_height`," +
                           "`global_id` FROM `dials`", [], function( tx, results ) {
              dataObject.dials = that._resultsToArray( results );
              callback();
            } );
          });

        },

        function ( callback, dataObject ){
          // get groups
          that.transaction(function( tx ){
            tx.executeSql( "SELECT `rowid` as `id`, `name`, `position`, `global_id` FROM `groups`", [], function( tx, results ){
              dataObject.groups = that._resultsToArray( results );
              callback();
            } );
          });
        },

        function ( callback, dataObject ){
          // get groups
          that.transaction(function( tx ){
            tx.executeSql( "SELECT * FROM `deny`", [], function( tx, results ){
              dataObject.deny = that._resultsToArray( results );
              callback();
            } );
          });
        },

        function( callback, dataObject ){
          dumpToJsonCallback( dataObject );
        }

      ]);

    },

    resetAutoDialsForGroup: function( params, callback ){

      var where = [];
      var limit = "";

      var attrs = [];

      if( params.groupId ){
        where.push( "`group_id` = ?" );
        attrs.push( params.groupId );
      }

      where.push( "`get_screen_method` = 'auto'" );
      where.push( "`thumb_source_type` = 'screen'" );

      if( params.limit ){
        limit = "LIMIT 0, " + params.limit;
      }

      if( params.ids ){
        where.push( "`rowid` IN ("+params.ids.join(",")+")" );
      }

      if( where.length > 0 ){
        where = " WHERE " + where.join(" AND ");
      }
      else{
        where = "";
      }

      var query = "UPDATE `dials` SET `thumb` = '', `screen_maked` = 0 " +
                 where + " " + limit;

      this.transaction(function( tx ){
        tx.executeSql( query, attrs, function( tx, results ){

          console.log(results);

          callback();

        } );
      });

    },

    setAutoPreviewGlobally: function( params, callback ){

      this.transaction(function( tx ){

        tx.executeSql( "SELECT global_id FROM `dials` WHERE `thumb_source_type` = 'screen' AND get_screen_method = 'manual'", [], function( tx, results ){

          var globalIds = [];
          for( var i = 0; results.rows.length != i; i++ ){
            globalIds.push( results.rows.item(i).global_id );
          }

          tx.executeSql( "UPDATE `dials` SET `get_screen_method` = 'auto', `thumb_source_type` = 'screen', `thumb` = '', `screen_maked` = 0 "+
                  " WHERE `thumb_source_type` = 'screen' AND get_screen_method = 'manual'", [], function( tx, results ){
            for( var i = 0; i != globalIds.length; i++ ){
              fvdSpeedDial.Sync.addDataToSync( {
                category: ["dials"],
                data: globalIds[i]
              } );
            }

            callback( globalIds );
          });


        } );
      });

    },

    // dial functions
    dialGlobalId: function( id, callback ){

      this.transaction(function( tx ){
        tx.executeSql( "SELECT global_id FROM `dials` WHERE rowid = ?", [id], function( tx, results ){

          var globalId = null;
          if( results.rows.length == 1 ){
            globalId = results.rows.item(0).global_id;
          }
          callback( globalId );

        } );
      });

    },

    listDialsIdsByGroup: function( groupId, callback ){

      this.transaction(function( tx ){
        tx.executeSql( "SELECT rowid, global_id FROM `dials` WHERE group_id = ?", [ groupId ], function( tx, results ){

          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item(i);
            data.push( {
              id: dial.rowid,
              global_id: dial.global_id
            } );
          }

          callback( data );

        } );
      });

    },

    getDialsToPreviewUpdate: function(cb) {
      this.transaction(function( tx ){
        tx.executeSql( "SELECT rowid, update_interval, last_preview_update, url " +
                       " FROM `dials` WHERE update_interval != '' AND `thumb_source_type` = 'screen'", [], function( tx, results ){
          var data = [],
              now = new Date().getTime();
          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item(i);
            if(!dial.last_preview_update) {
              tx.executeSql("UPDATE `dials` SET last_preview_update = ? WHERE `rowid` = ?", [
                now,
                dial.rowid
              ]);
              continue;
            }
            var interval = dial.update_interval.split("|");
            switch(interval[1]) {
              case "minutes":
                interval = interval[0] * 60;
              break;
              case "hours":
                interval = interval[0] * 3600;
              break;
              case "days":
                interval = interval[0] * 3600 * 24;
              break;
              default:
                continue;
            }
            interval *= 1000;
            if(now - dial.last_preview_update < interval) {
              continue;
            }
            data.push({
              id: dial.rowid,
              url: dial.url
            });
            tx.executeSql("UPDATE `dials` SET last_preview_update = ? WHERE `rowid` = ?", [
              now,
              dial.rowid
            ]);
          }
          cb( data );
        } );
      });
      
    },

    listDials: function( orderBy, groupId, limit, callback ){
      if(typeof orderBy == "function") {
        callback = orderBy;
        orderBy = null;
      }
      if( !orderBy ){
        orderBy = "`position` ASC";
      }
      var whereArr = [];
      var where = "";
      if( groupId && groupId > 0 ){
        whereArr.push("group_id = " + groupId);
      }

      whereArr.push( "`deny` = 0" );

      if( whereArr.length > 0 ){
        where = "WHERE " + whereArr.join( " AND " );
      }

      var limitClause = "";
      if( limit ){
        limitClause = "LIMIT " + limit;
      }

      var that = this;

      var groupByClause = "";

      if( groupId == 0 ){
        groupByClause = " GROUP BY `url` ";
      }

      this.transaction(function( tx ){

        var query = "SELECT rowid as `id`, `url`, `title`, `auto_title`, `update_interval`, " +
                    " `thumb_source_type`, `thumb_url`, `position`, `group_id`, `clicks`, `deny`, `screen_maked`" +
                    ", `thumb`, `thumb_version`, `screen_delay`, `thumb_width`, `thumb_height`, `get_screen_method`" +
                    " FROM `dials` " +
                    where+ " "+groupByClause+" ORDER BY " + orderBy + " " + limitClause;
        console.log("Start get list!");
        tx.executeSql( query, [], function( tx, results ){

          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item(i);
            that._prepareDialData( dial );
            data.push( dial );
          }

          callback( data );

        }, function(err) {
          console.error("FAIL", arguments);
        } );
      });
    },

    dialsRawList: function( params, callback ){

      params = params || {};

      var whereStr = "";
      if( params.where ) {
        whereStr = "WHERE " + params.where.join(" AND ");
      }

      var query = "SELECT dials.rowid,dials.*,groups.global_id as group_global_id FROM `dials` JOIN groups ON dials.group_id = groups.rowid " + whereStr;

      this._rawList( query, function(list) {
        // need to replace filesystem urls by data uris
        // because rawList request is used for sync
        fvdSpeedDial.Utils.Async.arrayProcess(list, function(dial, next) {
          if(typeof dial.thumb != "string" || dial.thumb.indexOf("filesystem:") !== 0) {
            return next();
          }
          // fix bug when update_interval set to undefined(maybe with sync)
          if(dial.update_interval == "undefined") {
            dial.update_interval = "";
          }
          fvdSpeedDial.Utils.imageUrlToDataUrl(dial.thumb, function(dataUrl) {
            dial.thumb = dataUrl;
            next();
          });
        }, function() {
          callback(list);
        });
      } );

    },

    getDial: function( id, callback ){

      var that = this;

      this.transaction(function( tx ){
        tx.executeSql( "SELECT rowid as `id`, `url`, `title`, `auto_title`, `thumb_source_type`, `thumb_url`, " +
                  "`position`, `group_id`, `clicks`, `deny`, `screen_maked`, `thumb`, `screen_delay`, `thumb_width`, "+
                "`thumb_height`, `get_screen_method`, `update_interval` FROM `dials` WHERE `rowid` = ?", [id], function( tx, result ){
          if( result.rows.length == 1 ){
            var dial = result.rows.item(0);

            that._prepareDialData( dial );
            callback( dial );
          }
        } );
      });

    },


    getDialDataList: function( dialId, dataList, callback ){
      var dataString = "`"+dataList.join("`,`")+"`";

      var query = "SELECT "+dataString+" FROM `dials` WHERE `rowid` = ?";

      this.transaction( function( tx ){
        tx.executeSql( query, [dialId], function( ts, results ){

          if( results.rows.length == 1 ){
            callback( results.rows.item(0) );
          }

        } );
      } );

    },

    addDial: function( addData, callback, hints ){

      hints = hints || [];

      var that = this,
          storeThumb = null;

      addData.thumb = addData.thumb || "";
      addData.screen_delay = addData.screen_delay || fvdSpeedDial.Prefs.get("sd.preview_creation_delay_default");

      var screen_maked = 0,
          localFileData = null,
          res = null;
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          checkLocalFile(addData.url, addData.thumb_source_type, addData.thumb_url, function(lf) {
            localFileData = lf;
            next();
          });
        },
        function(next) {
          if(localFileData){
            for(var k in localFileData) {
              addData[k] = localFileData[k];
            }
            next();
          }
          else {
            if( addData.thumb_source_type == "screen" ){
              if( addData.thumb ){
                addData.screen_maked = 1; // thum specified for screen type
              }
              else{

              }
            }
            next();
          }
        },
        function(next) {
          if(addData.thumb) {
            // store thumb separately
            storeThumb = addData.thumb;
            delete addData.thumb;
          }
          that.isDenyUrl( addData.url, function(deny){

            if( deny && hints.indexOf( "ignore_deny" ) == -1 ){
              if( callback ){
                callback({
                  result: false,
                  error: "url_deny"
                });
              }
            }
            else{

              that.nextDialPosition( addData.group_id, function( position ){
                if( !addData.position ){
                  addData.position = position;
                }

                addData.clicks = addData.clicks || 0;
                addData.deny = addData.deny || 0;
                addData.screen_maked = addData.screen_maked || 0;

                if( !addData.global_id ){
                  addData.global_id = that._generateGUID();
                }

                var insertData = that._getInsertData( addData );

                that.transaction(function( tx ){
                  tx.executeSql( "INSERT INTO `dials`("+insertData.keys+") VALUES("+insertData.values+")", insertData.dataArray, function( tx, results ){

                    that._callDialsChangeCallbacks( {
                      action: "add"
                    });
                    res = {
                      result: results.rowsAffected == 1,
                      id: results.insertId
                    };
                    next();
                  }, function(){
                    console.log( "Error add dials", arguments );
                  } );
                });
              } );

            }

          } );
        },
        function(next) {
          if(!storeThumb) {
            return next();
          }
          // store thumb
          fvdSpeedDial.Storage.updateDial(res.id, {
            thumb: storeThumb
          }, next);
        },
        function() {
          if(callback) {
            callback(res);
          }
        }
      ]);
    },


    syncFixDialsPositions: function( groupId, callback ){

      var that = this;

      this._rawList( "SELECT `rowid` FROM `dials` WHERE `group_id` = "+groupId+" ORDER BY `position`", function( dials ){

        var position = 1;

         fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, arrayProcessCallback ){

          that.transaction( function( tx ){
            tx.executeSql( "UPDATE `dials` SET `position` = ? WHERE `rowid` = ?", [ position, dial.rowid ], function(){
              position++;
              arrayProcessCallback();
            } );
          } );


        }, function(){
          callback();
        } );

      } );



    },


    syncDialData: function( globalId, fields, callback ){

      fields = fields || ["rowid", "*"];

      var query = "SELECT " + fields.join(",") + " FROM `dials` WHERE `global_id` = ?";

      this.transaction( function( tx ){

        tx.executeSql( query, [globalId], function( tx, results ){

          if( results.rows.length >= 1 ){
            callback( results.rows.item(0) );
          }
          else{
            callback( null );
          }

        }, function(){ console.log( "Fail get syncDialData", arguments ) } );

      } );

    },

    syncRemoveDials: function( notRemoveDials, callback ){

      var that = this;

      var removeInfo = {
        count: 0,
        removedFromGroups: []
      }; // describes remove process info

      var where = "WHERE 1=1 ";

      if( notRemoveDials.length > 0 ){
        where += "AND `global_id` NOT IN('"+notRemoveDials.join("','")+"')";
      }

      where += " AND (SELECT `sync` FROM `groups` WHERE `rowid` = `dials`.`group_id`) = 1";

      this._rawList( "SELECT `global_id`, `rowid`, `group_id` FROM `dials` " + where, function( dials )  {

        fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, arrayProcessCallback ){

          removeInfo.count++;
          removeInfo.removedFromGroups.push( dial.group_id );

          that.transaction( function( tx ){
            tx.executeSql( "DELETE FROM dials WHERE rowid = ?", [dial.rowid], function(){

              that._callDialsChangeCallbacks( {
                action: "remove",
                data:{
                  id: dial.rowid
                }
              });

              arrayProcessCallback();

            } );
          } );


        }, function(){
          callback( removeInfo );
        } );

      } );


    },

    syncUpdateMass: function( globalIds, data, callback ){

      var tmp = this._getUpdateData( data );

      var dataArray = tmp.dataArray;
      var strings = tmp.strings;

      var query = "UPDATE `dials` SET " + strings.join(",") + " WHERE `global_id` IN ( '"+globalIds.join("','")+"' )";

      this.transaction(function( tx ){
        tx.executeSql( query, dataArray, function( tx, results ){
          if( callback ){
            callback({
              result: results.rowsAffected > 1
            });
          }
        } );
      });

    },

    syncSaveDial: function( dial, callback ){

      var that = this;

      var oldData = null;

      var nullThumbSrc = false;

      var saveInfo = {}; // describes dial info with it saves

      this.dialExistsByGlobalId( dial.global_id, function( exists ){

        that.syncGetGroupId( dial.group_global_id, function( groupId ){

          if( groupId == 0 ){
            callback(saveInfo); // cannot add dial, group not found
          }
          else{
            dial.group_id = groupId;

            saveInfo.group_id = groupId;

            var deny = 0;

            fvdSpeedDial.Utils.Async.chain( [

              function( chainCallback ){


                that.isDenyUrl( dial.url, function( aDeny ){
                  deny = aDeny ? 1 : 0;
                  chainCallback();
                } );
              },

              function( chainCallback ){

                if( exists ){

                  that.syncDialData( dial.global_id, [
                    "rowid", "thumb_source_type", "thumb_url", "url", "group_id", "screen_maked", "get_screen_method"
                  ], function( result ){

                    if( result ){

                      oldData = result;

                      // check if dials moved

                      if( oldData.group_id != dial.group_id ){
                        saveInfo.move = {
                          from: oldData.group_id,
                          to: dial.group_id
                        };
                      }


                      if( oldData.thumb_source_type != dial.thumb_source_type ){
                        nullThumbSrc = true;
                      }
                      else{

                        if( dial.thumb_source_type == "screen" ){
                          if( dial.url != oldData.url ){
                            nullThumbSrc = true;
                          }
                          else if( dial.get_screen_method != oldData.get_screen_method ){
                            nullThumbSrc = true;
                          }
                        }
                        else if( dial.thumb_source_type == "url" ){
                          if( dial.thumb_url != oldData.thumb_url ){
                            nullThumbSrc = true;
                          }
                        }
                        else if( dial.thumb_source_type == "local_file" ){
                          /*
                           *
                           * process local file here
                           *
                          if( dial._previewContent ){
                            var newContentMd5 = fvd_speed_dial_Misc.md5( dial._previewContent );

                            var tmp = oldData.thumb_url.split( /[\/\\]/ );
                            var fileName = tmp[tmp.length - 1];

                            if( fileName.indexOf( newContentMd5 ) == -1 ){
                              nullThumbSrc = true;
                            }
                          }
                          */

                        }


                      }

                      if( nullThumbSrc ){
                        dial.screen_maked = 0;
                      }
                      else{
                        dial.screen_maked = oldData.screen_maked;
                      }

                      chainCallback();

                    }
                    else{

                      nullThumbSrc = true;

                      chainCallback();
                    }

                  } );

                }
                else{

                  nullThumbSrc = true;

                  chainCallback();
                }

              },

              function( chainCallback ){

                if( nullThumbSrc && dial.thumb_source_type == "url" || dial._previewUrl ){
                  // need to grab thumb from url

                  var loadContentUrl = dial.thumb_url;
                  if( dial._previewUrl ){
                    loadContentUrl = dial._previewUrl;
                  }

                  fvdSpeedDial.ThumbMaker.getImageDataPath({
                    imgUrl: loadContentUrl,
                    screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
                  }, function(dataUrl, thumbSize){

                    delete dial._previewUrl;

                    dial.thumb = dataUrl;
                    chainCallback();

                  });

                }
                else{
                  chainCallback();
                }

              },

              function( chainCallback ){

                var toDb = {
                  url: dial.url,
                  title: dial.title,
                  auto_title: dial.auto_title,
                  thumb_url: dial.thumb_url,
                  thumb_source_type: dial.thumb_source_type,
                  thumb_width: dial.thumb_width,
                  thumb_height: dial.thumb_height,
                  group_id: dial.group_id,
                  deny: deny,
                  position: dial.position ,
                  global_id: dial.global_id,
                  screen_maked: dial.screen_maked,
                  update_interval: dial.update_interval || ""
                };

                if( dial.get_screen_method ){
                    toDb.get_screen_method = dial.get_screen_method;
                }

                if( dial.thumb ){
                  toDb.thumb = dial.thumb;
                }


                if( exists ){

                  that.updateDial( oldData.rowid, toDb, function(){
                    chainCallback();
                  } );

                }
                else{

                  //dump( "ADD dial " + dial.global_id + "\n" );

                  //self.asyncNextPosition( dial.group_id, function( nextPosition ){

                  that.addDial( toDb,
                  function(){

                    chainCallback();

                  }, ["ignore_deny"] );


                }
              },

              function( chainCallback ){


                if (dial.thumb_source_type == "local_file") {

                  /*
                   * process local file
                   *


                  self.asyncDialIdByGlobalId(dial.global_id, function(dialId){

                    if (dialId != null) {

                      if( oldData ){
                        var tmp = oldData.thumb_url.split( /[\/\\]/ );
                        var fileName = tmp[tmp.length - 1];

                        try{
                          self.removeSyncDataFile( fileName );
                        }
                        catch( ex ){

                        }
                      }



                      self.asyncPutDialPreviewBase64InFile(dialId, dial._previewContent, null, function( localPath ){

                        // need update dial local path

                        var  query = {
                          query: "UPDATE `dials` SET `thumb_url` = :thumb_url WHERE `rowid` = :rowid",
                          params: { thumb_url: localPath, rowid: dialId }
                        };

                        self.asyncCustomQuery( query, null, function(){
                          chainCallback();
                        } );

                      });
                    }
                    else{
                      chainCallback();
                    }

                  });

                  */

                  chainCallback();

                }
                else{
                  chainCallback();
                }


              },
              function(){

                callback( saveInfo );
              }

            ] );



          }

        } );



      } );

    },



    deleteDial: function( dialId, callback ){
      var that = this;

      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          fvdSpeedDial.Storage.getDial(dialId, function(d) {
            if(!d || !d.thumb || typeof d.thumb != "string" || d.thumb.indexOf("filesystem:") !== 0) {
              return next();
            }
            fvdSpeedDial.Storage.FileSystem.removeByURL(d.thumb, function() {
              next();
            });
          });
        },
        function() {
          that.transaction( function( tx ) {
            tx.executeSql( "DELETE FROM `dials` WHERE `rowid` = ?", [ dialId ], function( tx, results ){
              if( callback ){
                that._callDialsChangeCallbacks( {
                  action: "remove",
                  data:{
                    id: dialId
                  }
                });

                callback({
                  result: results.rowsAffected == 1
                });
              }
            } );
          } );
        }
      ]);
    },

    clearDials: function( callback, where ){

      var that = this;

      where = where || "";

      if( where ){
        where = "WHERE " + where;
      }

      this.transaction( function( tx ){

        tx.executeSql( "SELECT rowid, thumb FROM `dials` " + where, [], function(tx, results){
          var r = [];
          for(var i = 0; i != results.rows.length; i++) {
            r.push(results.rows.item(i));
          }
          fvdSpeedDial.Utils.Async.arrayProcess(r, function(row, next) {
            that._callDialsChangeCallbacks( {
              action: "remove",
              data:{
                id: row.rowid
              }
            });
            if(!row.thumb || typeof row.thumb != "string" || row.thumb.indexOf("filesystem:") !== 0) {
              return next();
            }
            fvdSpeedDial.Storage.FileSystem.removeByURL(row.thumb, function() {
              next();
            });
          }, function() {
            that.transaction(function(tx) {
              tx.executeSql( "DELETE FROM `dials` " + where, [], function(){
                if( callback ){
                  chrome.runtime.sendMessage({
                    action: "storage:dialsCleared"
                  });
                  callback();
                }
              } );
            });
          });
        } );

      } );

    },

    updateDial: function( dialId, data, callback ){
      var that = this;

      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if(!data.thumb || typeof data.thumb != "string") {
            return next();
          }
          if(data.thumb.indexOf("data:") !== 0) {
            return next();
          }
          // store thumb
          var thumb = fvdSpeedDial.Utils.dataURIToBlob(data.thumb),
              ext = fvdSpeedDial.Utils.typeToExt(thumb.type);
          fvdSpeedDial.Storage.FileSystem.write("/" + fvdSpeedDial.Config.FS_DIALS_PREVIEW_DIR +
                                        "/" + dialId + "." + ext, thumb, function(err, url) {
            if(err) {
              throw err;
            }
            data.thumb = url;
            next();
          });
        },
        function() {
          var tmp = that._getUpdateData( data );
          var dataArray = tmp.dataArray;
          var strings = tmp.strings;
          dataArray.push( dialId );
          if(data.thumb) {
            strings.push("`thumb_version` = `thumb_version` + 1");
          }
          var query = "UPDATE `dials` SET " + strings.join(",") + " WHERE `rowid` = ?";
          that.transaction(function( tx ){
            tx.executeSql( query, dataArray, function( tx, results ){

              that._callDialsChangeCallbacks( {
                action: "update",
                data:{
                  id: dialId,
                  data: data
                }
              });

              if( callback ){
                callback({
                  result: results.rowsAffected == 1
                });
              }
            } );
          });
        }
      ]);
    },

    moveDial: function( dialId, groupId, callback ){

      var that = this;

      this.nextDialPosition( groupId, function( newPosition ){

        that.updateDial( dialId, {
          group_id: groupId,
          position: newPosition
        }, function( result ){
          callback( result );
        } );

      } );

    },

    dialCanSync: function( globalId, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT sync FROM `groups` WHERE `rowid` = (SELECT `group_id` FROM `dials` WHERE `dials`.`global_id` = ?)", [globalId], function( tx, results ){

          try{
            callback(results.rows.item(0).sync == 1);
          }
          catch( ex ){
            callback( true );
          }

        } );
      } );

    },


    insertDialUpdateStorage: function( dialId, sign, interval, newDialPosition, callback ){

      var that = this;

      this.getDialDataList( dialId, ["group_id"], function( dial ){

        that.transaction(function( tx ){

          var changedGlobalIds = [];

          fvdSpeedDial.Utils.Async.chain([

            function( chainCallback ){

              tx.executeSql( "SELECT global_id FROM dials WHERE `group_id` = ? AND `position` >= ? AND `position` <= ?", [
                dial.group_id, interval.start, interval.end
              ], function( tx, results ){

                for ( var i = 0; i != results.rows.length; i++ ){
                  changedGlobalIds.push( results.rows.item(i).global_id );
                }

                chainCallback();

              } );

            },

            function( chainCallback ){

              tx.executeSql("UPDATE `dials` SET `position` = `position` " + sign + "1 WHERE `group_id` = ? AND `position` >= ? AND `position` <= ?",
                      [dial.group_id, interval.start, interval.end], function(){

                that.updateDial( dialId, {
                  position: newDialPosition
                }, function(){
                  chainCallback();
                } );

              });

            },

            function(){
              callback( changedGlobalIds );
            }

          ]);

        });

      } );
    },

    /**
     * params is url, excludeIds, finalCheck
     */
    dialExists: function( params, callback ){
      var that = this;
      params = params || {};

      var additionalWhere = "";
      if( params.excludeIds ){
        additionalWhere = " AND `rowid` NOT IN( "+ params.excludeIds.join(",") +" )";
      }

      this.transaction( function( tx ){
        tx.executeSql( "SELECT EXISTS(SELECT * FROM `dials` WHERE `url` = ? "+additionalWhere+") as ex", [
          params.url
        ], function( tx, results ){
          var exists = !!results.rows.item(0).ex;

          if( exists ){
            return callback( exists );
          }

          var parsedUrl = fvdSpeedDial.Utils.parseUrl( params.url );
          if(!parsedUrl || !parsedUrl.host) {
            // url without host or not well formed url
            // it's maybe a file:/// url
            return callback(false);
          }
          var host = parsedUrl.host.toLowerCase();

          if( host.indexOf( "www." ) === 0 ){
            host = host.substr( 4 );
          }
          else{
            host = "www." + host;
          }

          parsedUrl.host = host;

          var url = fvdSpeedDial.Utils.buildUrlFromParsed( parsedUrl );

          tx.executeSql( "SELECT EXISTS(SELECT * FROM `dials` WHERE `url` = ? "+additionalWhere+") as ex", [ url ], function( tx, results ){
            var exists = !!results.rows.item(0).ex;

            if( !exists && !params.finalCheck ){
              if( parsedUrl.scheme == "http" ){
                parsedUrl.scheme = "https";
              }
              else{
                parsedUrl.scheme = "http";
              }

              url = fvdSpeedDial.Utils.buildUrlFromParsed( parsedUrl );

              that.dialExists( {
                url: url,
                excludeIds: params.excludeIds,
                finalCheck: true
              }, callback);
            }
            else{
              callback( exists );
            }
          });

        } );
      } );
    },

    dialExistsByGlobalId: function( globalId, callback ){

      this.transaction( function( tx ){
        tx.executeSql( "SELECT EXISTS(SELECT * FROM `dials` WHERE `global_id` = ?) as ex", [ globalId ], function( tx, results ){
          callback( results.rows.item(0).ex );
        } );
      } );
    },


    nextDialPosition: function( group_id, callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT MAX(position)  as cnt FROM `dials` WHERE `group_id` = ?", [group_id], function( tx, results ){
          callback( results.rows.item(0).cnt + 1 );
        } );
      } );
    },

    countDials: function( params, callback ){
      if(typeof params == "function") {
        callback = params;
        params = {};
      }
      params = params || {};

      var clause = "*";

      if( params.uniqueUrl ){
        clause = " DISTINCT `url` ";
      }

      this.transaction( function( tx ){
        tx.executeSql( "SELECT COUNT("+clause+") as cnt FROM `dials` WHERE `deny` = ? ", [0], function( tx, results ){
          callback( results.rows.item(0).cnt );
        } );
      } );
    },

    refreshDenyDials: function( callback ){

      var that = this;

      // go away all dials and refresh its deny field
      this.transaction(function(tx){
        tx.executeSql( "SELECT `rowid`, `url`, `deny` FROM `dials`", [], function( tx,results ){

          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item( i );
            (function( i, dial ){
              that.isDenyUrl( dial.url, function( deny ){

                var newDeny = deny ? 1 : 0;
                if( newDeny != dial.deny ){
                  that.updateDial(dial.rowid, {
                    deny: newDeny
                  }, function(){

                    if( i == results.rows.length - 1 ){
                      if( callback ){
                        callback();
                      }
                    }

                  });
                }
                else{
                  if( i == results.rows.length - 1 ){
                    if( callback ){
                      callback();
                    }
                  }
                }

              } );
            })( i, dial );
          }

          if( results.rows.length == 0 ){
            if( callback ){
              callback(  );
            }
          }

        } );
      });


    },

    // deny functions

    deny: function( type, sign, callback ){

      if( !sign ){
        throw "deny_empty_sign";
      }

      var firstSign = sign;

      if( type == "host" ){
        if( fvdSpeedDial.Utils.isValidUrl( sign ) ){
          sign = fvdSpeedDial.Utils.parseUrl( sign, "host" );
        }
      }
      else if( type == "url" ){

        if( !fvdSpeedDial.Utils.isValidUrl( sign ) ){
          throw "deny_invalid_url";
        }

        sign = fvdSpeedDial.Utils.urlToCompareForm(sign);
      }
      else{
        throw "deny_wrong_type";
      }

      var that = this;
      this._denySignExists( type, sign, function( exists ){
        if( !exists ){
          that.transaction(function( tx ){
            tx.executeSql( "INSERT INTO deny ( `sign`, `effective_sign`, `type` ) VALUES( ?, ?, ? )", [firstSign, sign, type], function( tx, results ){
              if( callback ){
                callback({
                  result: results.rowsAffected == 1,
                  id: results.insertId
                });
              }

              that._callDenyChangeCallbacks( {
                action: "add",
                type: type,
                sign: sign
              } );
            } );
          });
        }
        else{
          callback({
            result: false,
            error: "deny_already_exists"
          });
        }
      } );



    },

    editDeny: function( id, data, callback ){

      var that = this;

      data.effective_sign = fvdSpeedDial.Utils.urlToCompareForm( data.sign );
      this._denySignExists( data.type, data.effective_sign, function( exists ){

        if( exists ){
          if( callback ){
            callback({
              result: false,
              error: "deny_already_exists"
            });
          }
        }
        else{
          var updateData = that._getUpdateData( data );

          updateData.dataArray.push(id);


          var query = "UPDATE `deny` SET " + updateData.strings.join(",") + " WHERE `rowid` = ?";

          that.transaction( function( tx ){
            tx.executeSql( query, updateData.dataArray, function( tx, results ){
              if( callback ){
                callback({
                  result: results.rowsAffected == 1
                });
              }
              that._callDenyChangeCallbacks( {
                action: "edit"
              } );
            } );
          } );
        }

      }, id );

    },

    denyList: function( callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT rowid as id, effective_sign, sign, type FROM deny", [], function( tx, results ){
          var result = [];
          for( var i = 0; i != results.rows.length; i++ ){
            result.push( results.rows.item( i ) );
          }

          callback( result );
        } );

      } );

    },

    removeDeny: function( id, callback ){
      var that = this;

      this.transaction(function( tx ){
        tx.executeSql( "DELETE FROM `deny` WHERE `rowid` = ?", [id], function( tx, results ){
          if( callback ){
            callback();
          }

          that._callDenyChangeCallbacks( {
            action: "remove"
          } );
        } );
      });
    },

    clearDeny: function( callback ){
      this.transaction( function( tx ){
        tx.executeSql( "DELETE FROM `deny`", [], function(){
          if( callback ){
            callback();
          }
        } );
      } );
    },

    isDenyUrl: function( url, callback ){

      var that = this;
      this.transaction(function( tx ){
        tx.executeSql( "SELECT effective_sign, type FROM deny", [], function( tx, results ){
          var result = false;
          var denyDetails = null;

          for (var i = 0, len = results.rows.length; i < len; i++) {

            var item = results.rows.item( i );
            switch( item.type ){
              case "url":
                result = fvdSpeedDial.Utils.isIdenticalUrls( item.effective_sign, url );
              break;
              case "host":
                var host = fvdSpeedDial.Utils.parseUrl( url, "host" );
                result = fvdSpeedDial.Utils.isIdenticalHosts( item.effective_sign, host, {
                  ignoreSubDomains: true
                } );
              break;
            }

            if( result ){
              denyDetails = {
                deny: item
              };
              break;
            }

          }

          callback(result, denyDetails);
        });
      } );

    },

    /* Groups */

    resetDefaultGroupId: function(){

      this.groupsList(function( groups ){
        var group = groups[0];
        var newId = group.id;

        fvdSpeedDial.Prefs.set( "sd.default_group", newId )
      });

    },

    groupIdByGlobalId: function(globalId, callback) {
      this.transaction(function( tx ){
        tx.executeSql( "SELECT rowid FROM `groups` WHERE global_id = ?", [globalId], function( tx, results ){

          var id = null;
          if( results.rows.length == 1 ){
            id = results.rows.item(0).rowid;
          }
          callback( id );

        } );
      });
    },

    groupGlobalId: function( id, callback ){

      this.transaction(function( tx ){
        tx.executeSql( "SELECT global_id FROM `groups` WHERE rowid = ?", [id], function( tx, results ){

          var globalId = null;
          if( results.rows.length == 1 ){
            globalId = results.rows.item(0).global_id;
          }
          callback( globalId );

        } );
      });

    },

    addDialsCallback: function( callback ){
      if( this._dialsChangeCallbacks.indexOf( callback ) != -1 ){
        return;
      }

      this._dialsChangeCallbacks.push( callback );
    },

    removeDialsCallback: function( callback ){
      var index = this._dialsChangeCallbacks.indexOf( callback );

      if( index == -1 ){
        return;
      }

      this._dialsChangeCallbacks.splice(index, 1);
    },

    addGroupsCallback: function( callback ){
      if( this._groupsChangeCallbacks.indexOf( callback ) != -1 ){
        return;
      }

      this._groupsChangeCallbacks.push( callback );
    },

    removeGroupsCallback: function( callback ){
      var index = this._groupsChangeCallbacks.indexOf( callback );

      if( index == -1 ){
        return;
      }

      this._groupsChangeCallbacks.splice(index, 1);
    },


    groupAdd: function( params, callback, forcePosition ){


      var that = this;
      this.groupExists( {
        name: params.name
      }, function( exists ){
        if( exists ){
          throw "group_exists";
        }
        else{

          that.nextGroupPosition( function( position ){

            if( forcePosition ){
              position = forcePosition;
            }

            if( !params.global_id ){
              params.global_id = that._generateGUID();
            }

            that.transaction(function( tx ){

              tx.executeSql( "INSERT INTO `groups` (`position`, `name`, `global_id`, `sync`) VALUES(?, ?, ?, ?)",
                [ position, params.name, params.global_id, params.sync ], function( tx, results ){
                if( callback ){
                  callback({
                    result: results.rowsAffected == 1,
                    id: results.insertId
                  });
                }

                that._callGroupsChangeCallbacks({
                  action: "add"
                });
              } );

            });



          } );
        }
      } );

    },

    syncFixGroupsPositions: function( callback ){

      var that = this;

      var query = "SELECT `rowid` FROM `groups` ORDER BY `position`";

      this._rawList( query, function( list ){

        var position = 1;

        fvdSpeedDial.Utils.Async.arrayProcess( list, function( group, arrayProcessCallback ){

          that.transaction( function(tx){

            tx.executeSql("UPDATE groups SET position = ? WHERE rowid = ?", [position, group.rowid], function(){

              position++;
              arrayProcessCallback();

            });

          } );

        }, function(){
          callback();
        } );

      } );

    },

    // save group for sync
    syncSaveGroup: function( group, callback ){

      var that = this;

      this.groupExistsByGlobalId( group.global_id, function( exists ){

        if( exists ){
          //dump( "Update group: " + group.global_id + "\n" );

          that.transaction( function( tx ){

            tx.executeSql( "UPDATE `groups` SET `name` = ?, `position` = ? WHERE `global_id` = ?", [
              group.name, group.position, group.global_id
            ], callback ) ;

          } );

        }
        else{

          that.transaction( function( tx ){

            tx.executeSql( "INSERT INTO `groups`(`name`, `position`, `global_id`) VALUES(?, ?, ?)", [
              group.name, group.position, group.global_id
            ], callback ) ;

          } );

        }

      } );

    },

    // get group by global id
    syncGetGroupId: function( globalId, callback ){

      this.transaction( function( tx ){
        tx.executeSql( "SELECT rowid FROM `groups` WHERE `groups`.`global_id` = ?", [globalId], function( tx, results ){

          var groupId = 0;
          if( results.rows.length == 1 ){
            groupId = results.rows.item(0).rowid;
          }

          callback( groupId );

        } );
      } );

    },

    // remove groups that not in list
    syncRemoveGroups: function( notRemoveIds, callback ){

      var that = this;

      var where = "WHERE 1=1";

      if( notRemoveIds.length > 0 ){
        where += " AND global_id NOT IN ('"+notRemoveIds.join("','")+"')";
      }

      where += " AND `sync` = 1";

      this._rawList( "SELECT rowid FROM groups " + where, function( groups ){

        fvdSpeedDial.Utils.Async.arrayProcess( groups, function( group, arrayProcessCallback ){

          var groupId = group.rowid;

          that.transaction( function( tx ){
            tx.executeSql( "DELETE FROM dials WHERE group_id = ?", [groupId], function(){

              tx.executeSql( "DELETE FROM groups WHERE rowid = ?", [ groupId ], function(){
                arrayProcessCallback();
              } );

            } );
          } );



        }, function(){

          callback( groups.length );

        } );

      } );



    },

    getGroup: function( id, callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT `groups`.`rowid` as `id`, `groups`.`name`, `groups`.`sync`, `groups`.`global_id`, (SELECT COUNT(*) FROM `dials` WHERE `group_id` = `groups`.`rowid`) as count_dials FROM `groups` WHERE `groups`.`rowid` = ?", [id], function( tx, results ){

          var group = null;
          if( results.rows.length == 1 ){
            group = results.rows.item(0);
          }

          callback( group );

        } );
      } );
    },

    groupsCount: function( callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT COUNT(*) as cnt FROM `groups`", [], function( tx, results ){
          callback( results.rows.item(0).cnt );
        } );
      } );
    },

    groupsList: function( callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT `groups`.`rowid` as `id`, `groups`.`name`, `groups`.`sync`, (SELECT COUNT(*) FROM `dials` WHERE `group_id` = `groups`.`rowid` AND `deny` = 0) as count_dials FROM `groups` ORDER BY `groups`.`position`", [], function( tx, results ){
          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            data.push(  results.rows.item( i ));
          }
          callback( data );
        } );
      } );
    },

    groupsRawList: function( params, callback ){

      params = params || {};

      var whereStr = "";
      if( params.where ){
        whereStr = "WHERE " + params.where.join(" AND ");
      }

      var query = "SELECT rowid, * FROM `groups` " + whereStr;

      this._rawList( query, callback );

    },


    groupUpdate: function( groupId, data, callback ){
      var that = this;

      var tmp = this._getUpdateData( data );

      var dataArray = tmp.dataArray;
      var strings = tmp.strings;

      dataArray.push( groupId );

      var syncChanged = false;

      fvdSpeedDial.Utils.Async.chain( [
        function( chainCallback ){

          if( typeof data.sync != "undefined" ){

            that.getGroup( groupId, function( group ){
              if( group.sync != data.sync ){
                syncChanged = true;
              }

              chainCallback();
            } );

          }
          else{
            chainCallback();
          }

        },

        function(){

          var query = "UPDATE `groups` SET " + strings.join(",") + " WHERE `rowid` = ?";

          that.transaction(function( tx ){
            tx.executeSql( query, dataArray, function( tx, results ){

              if( syncChanged ){
                fvdSpeedDial.Sync.groupSyncChanged( groupId, function(){

                  if( callback ){
                    callback({
                      result: results.rowsAffected == 1
                    });
                  }

                } );
              }
              else{
                if( callback ){
                  callback({
                    result: results.rowsAffected == 1
                  });
                }
              }

              that._callGroupsChangeCallbacks({
                action: "update"
              });
            } );
          });

        }
      ] );


    },

    groupDelete: function( groupId, callback ){
      var that = this;
      this.transaction( function( tx ){
        tx.executeSql( "DELETE FROM `groups` WHERE `rowid` = ?",  [groupId], function( tx, results ){
          try{
            callback({
              result: results.rowsAffected == 1
            });

            that._callGroupsChangeCallbacks({
              action: "remove",
              groupId: groupId
            });
          }
          catch( ex ){

          }
        } );
      } );
    },

    clearGroups: function( callback, where ){

      where = where || "";

      if( where ){
        where = "WHERE " + where;
      }

      this.transaction( function( tx ){
        tx.executeSql( "DELETE FROM `groups` " + where, [], function(){
          if( callback ){
            callback();
          }
        } );
      } );

    },


    nextGroupPosition: function( callback ){


      this.transaction( function( tx ){
        tx.executeSql( "SELECT MAX(`position`) as maxpos FROM `groups`", [], function( tx, results ){

          try{
            callback( results.rows.item(0).maxpos + 1 );
          }
          catch( ex ){

          }

        } );
      });
    },

    groupCanSyncById: function( id, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT sync FROM `groups` WHERE `rowid` = ?", [id], function( tx, results ){

          try{
            callback(results.rows.item(0).sync == 1);
          }
          catch( ex ){
            callback( true );
          }

        } );
      } );

    },

    groupCanSync: function( globalId, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT sync FROM `groups` WHERE `global_id` = ?", [globalId], function( tx, results ){

          try{
            callback(results.rows.item(0).sync == 1);
          }
          catch( ex ){
            callback( true );
          }

        } );
      } );

    },

    /**
     * check group exists
     * @param {String} name
     * @param {Array} [excludeIds=null]
     * @return {Boolean}
     */
    groupExists: function( params, callback ){
      params.excludeIds = params.excludeIds || null;
      this.transaction( function( tx ){
        var additionalWhere = "";
        if( params.excludeIds ){
          additionalWhere = " AND `rowid` NOT IN (" + params.excludeIds.join(",") + ")";
        }

        tx.executeSql( "SELECT EXISTS( SELECT * FROM `groups` WHERE `name` = ? " + additionalWhere + " ) as ex", [
          params.namename
        ], function( tx, results ){

          try{
            callback(results.rows.item(0).ex == 1);
          }
          catch( ex ){

          }

        } );
      } );
    },

    groupExistsById: function( id, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT EXISTS( SELECT * FROM `groups` WHERE `rowid` = ? ) as ex", [id], function( tx, results ){

          try{
            callback(results.rows.item(0).ex == 1);
          }
          catch( ex ){

          }

        } );

      } );

    },

    groupExistsByGlobalId: function( globalId, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT EXISTS( SELECT * FROM `groups` WHERE `global_id` = ? ) as ex", [globalId], function( tx, results ){

          try{
            callback(results.rows.item(0).ex == 1);
          }
          catch( ex ){

          }

        } );
      } );

    },

    getMisc: function( name, callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT `value` FROM `misc` WHERE `name` = ?", [name], function( tx, results ){
          var v = null;
          if( results.rows.length == 1 ){
            v = results.rows.item(0).value;
          }
          callback( v );
        } );
      } );
    },

    setMisc: function( name, value, callback ){
      var that = this;
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if(name != "sd.background") {
            return next();
          }
          if(typeof value == "string" && value.indexOf("data:") === 0) {
            // save to file
            var img = fvdSpeedDial.Utils.dataURIToBlob(value),
                ext = fvdSpeedDial.Utils.typeToExt(img.type);
            fvdSpeedDial.Storage.FileSystem.write("/" + fvdSpeedDial.Config.FS_MISC_DIR +
                                          "/background." + ext, img, function(err, url) {
              if(err) {
                throw err;
              }
              value = url;
              next();
            });
          }
          else {
            next();
          }
        },
        function() {
          that.transaction( function( tx ){
            tx.executeSql( "INSERT INTO `misc` (`name`, `value`) VALUES(?,?)", [name, value], function(){

              if( callback ){
                callback();
              }
            } );
          });
        }
      ]);
    },

    _rawList: function( query, callback ){
      this.transaction( function( tx ){
        tx.executeSql( query, [], function( tx, results ){
          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            data.push(fvdSpeedDial.Utils.clone(results.rows.item( i )));
          }
          callback( data );
        }, function(){ console.log( "Request error ("+query+")", arguments ) } );
      } );
    },

    _prepareDialData: function( dial ){
      dial.displayTitle = dial.title ? dial.title : dial.auto_title;
    },

    _callDialsChangeCallbacks: function( data ){
      var toRemoveCallbacks = [];
      for( var i = 0; i != this._dialsChangeCallbacks.length; i++ ){
        try{
          this._dialsChangeCallbacks[i]( data );
        }
        catch( ex ){
          toRemoveCallbacks.push( this._dialsChangeCallbacks[i] );
        }
      }

      for( var i = 0; i != toRemoveCallbacks.length; i++ ){
        this.removeDialsCallback( toRemoveCallbacks[i] );
      }
    },

    _callGroupsChangeCallbacks: function( data ){
      var toRemoveCallbacks = [];
      for( var i = 0; i != this._groupsChangeCallbacks.length; i++ ){
        try{
          this._groupsChangeCallbacks[i]( data );
        }
        catch( ex ){
          toRemoveCallbacks.push( this._groupsChangeCallbacks[i] );
        }
      }

      for( var i = 0; i != toRemoveCallbacks.length; i++ ){
        this.removeGroupsCallback( toRemoveCallbacks[i] );
      }
    },

    _callDenyChangeCallbacks: function( data ){
      chrome.runtime.sendMessage({
        action: "deny:changed",
        data: data
      });
    },

    _denySignExists: function( type, effective_sign, callback, except ){

      var additionalWhere = "";
      if( except ){
        additionalWhere = " AND `rowid` != " + except;
      }

      this.transaction(function( tx ){
        tx.executeSql( "SELECT EXISTS( SELECT * FROM `deny` WHERE `effective_sign` = ? AND `type` = ? "+additionalWhere+" ) as found", [effective_sign, type], function( tx, results ){

          callback( results.rows.item(0).found == 1 );

        } );
      });

    },

    _getInsertData: function( data ){
      var dataArray = [];
      var stringKeys = [];
      var stringValues = [];

      for( var k in data ){
        stringKeys.push( "`" + k + "`" );
        stringValues.push( "?" );
        dataArray.push( data[k] );
      }

      return {
        keys: stringKeys.join(","),
        values: stringValues.join(","),
        dataArray: dataArray
      };
    },

    _getUpdateData: function( data ){
      var dataArray = [];
      var strings = [];
      for( var k in data ){
        strings.push( "`" + k + "` = ?" );
        dataArray.push( data[k] );
      }

      return{
        dataArray: dataArray,
        strings: strings
      };
    },

    _resultsToArray: function( results ){
      var data = [];
      for( var i = 0; i != results.rows.length; i++ ){
        data.push( results.rows.item(i) );
      }
      return data;
    },

    _getTables: function( callback ){

      var data = [];

      this.transaction(function( tx ){

        tx.executeSql( "SELECT `name`, `type` FROM sqlite_master", [], function( tx, results ){
          for( var i = 0; i != results.rows.length; i++ ){
            var item = results.rows.item( i );

            if( item.type == "table" ){
              data.push( item.name );
            }
          }

          callback( data );
        } );

      });

    },

    _getIndexes: function( callback, _tx ){

      var tx = null;

      if( _tx ){
        tx = _tx;
      }

      function _execute(){
        var data = [];

        tx.executeSql( "SELECT `name`, `type` FROM sqlite_master", [], function( tx, results ){
          for( var i = 0; i != results.rows.length; i++ ){
            var item = results.rows.item( i );

            if( item.type == "index" ){
              data.push( item.name );
            }
          }

          callback( data );
        } );
      }

      if( tx ){
        _execute();
      }
      else{
        this.transaction(function( _tx ){

          tx = _tx;
          _execute();

        });
      }



    },

    _tableFields: function( table, callback, _tx ){

      var tx = null;

      if( _tx ){
        tx = _tx;
      }

      function _execute(){

        var data = [];

        tx.executeSql( "SELECT * FROM "+table+" LIMIT 1", [], function( tx, results ){
          try{
            data = Object.keys( results.rows.item(0) );
          }
          catch( ex ){

          }

          callback( data );
        } );

      }

      if( !tx ){
        this.transaction(function( _tx ){

          tx = _tx;
          _execute();

        });
      }
      else{
        _execute();
      }


    },

    _generateGUID: function() {

      var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
      var string_length = 32;
      var randomstring = '';

      for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
      }

      return randomstring;

    },

    _createTables: function( callback ){

      var that = this;

      this.transaction( function(tx){

        /*
        tx.executeSql( "DROP TABLE `mostvisited_extended`" );
        tx.executeSql( "DROP TABLE `dials`" );
        tx.executeSql( "DROP TABLE `deny`" );
        tx.executeSql( "DROP TABLE `groups`" );
        tx.executeSql( "DROP TABLE `mostvisited_extended`" );

        fvdSpeedDial.Prefs.set( "sd.tables_created", false );
        */

        var requiredIndexes = [
          {
            name: "dials_global_id",
            sql: "CREATE INDEX dials_global_id ON dials(global_id)"
          },
          {
            name: "groups_global_id",
            sql: "CREATE INDEX groups_global_id ON groups(global_id)"
          }
        ];

        var requiredFields = [
          {
            table: "dials",
            fields: [ {
              name: "global_id",
              sql: "ALTER TABLE `dials` ADD COLUMN `global_id` TEXT"
            },
            {
              name: "get_screen_method",
              sql: "ALTER TABLE `dials` ADD COLUMN `get_screen_method` VARCHAR DEFAULT 'manual'"
            },
            {
              name: "need_sync_screen",
              sql: [
                "ALTER TABLE `dials` ADD COLUMN `need_sync_screen` INT",
                "UPDATE `dials` SET `need_sync_screen` = 1 WHERE `thumb_source_type` = 'local_file' "+
                  "OR ( `thumb_source_type` = 'screen' AND `get_screen_method` = 'manual' )"
              ]
            },
            {
              name: "thumb_version",
              sql: "ALTER TABLE `dials` ADD COLUMN `thumb_version` INT DEFAULT 0"
            },
            {
              name: "update_interval",
              sql: "ALTER TABLE `dials` ADD COLUMN `update_interval` TEXT"
            },
            {
              name: "last_preview_update",
              sql: "ALTER TABLE `dials` ADD COLUMN `last_preview_update` INT"
            },
            ]
          },
          {
            table: "groups",
            fields:[
              {
                name: "global_id",
                sql: "ALTER TABLE `groups` ADD COLUMN `global_id` TEXT"
              },
              {
                name: "sync",
                sql: "ALTER TABLE `groups` ADD COLUMN `sync` INT DEFAULT 1"
              },
            ]
          },
          {
            table: "mostvisited_extended",
            fields: [ {
              name: "get_screen_method",
              sql: "ALTER TABLE `mostvisited_extended` ADD COLUMN `get_screen_method`  VARCHAR DEFAULT 'manual'"
            },
            {
              name: "thumb_version",
              sql: "ALTER TABLE `mostvisited_extended` ADD COLUMN `thumb_version` INT DEFAULT 0"
            }, ]
          },
        ];

        var tablesCreated = _b(fvdSpeedDial.Prefs.get( "sd.tables_created" ));
        if( !tablesCreated ){
          fvdSpeedDial.Prefs.set( "sd.tables_created", true );

          fvdSpeedDial.Utils.Async.chain([
            function( callback2 ){
              tx.executeSql( "CREATE TABLE IF NOT EXISTS dials " +
                       "(url TEXT, title TEXT, `auto_title` TEXT, thumb_source_type TEXT, thumb_url TEXT," +
                       "position INT, group_id INT, deny INT, clicks INT, `screen_maked` INT," +
                       "`thumb` TEXT, `thumb_version` INT DEFAULT 0," +
                       "`screen_delay` INT, `thumb_width` INT, `thumb_height` INT, `global_id` TEXT," +
                       "`get_screen_method`  VARCHAR DEFAULT 'manual', `update_interval` TEXT, " +
                       "`last_preview_update` INT, `need_sync_screen` INT)", [], function(){

                callback2();

              } );

            },

            function( callback2 ){

              tx.executeSql( "CREATE TABLE IF NOT EXISTS mostvisited_extended " +
                             "(id INT UNIQUE ON CONFLICT IGNORE, `title` TEXT," +
                             "`auto_title` TEXT, thumb_source_type TEXT, thumb_url TEXT, `screen_maked` INT," +
                             "`thumb` TEXT, `thumb_version` INT DEFAULT 0, `removed` INT, `screen_delay` INT," +
                             "`thumb_width` INT, `thumb_height` INT," +
                             "`get_screen_method`  VARCHAR DEFAULT 'manual')", [], function(){

                callback2();

              } );

            },

            function( callback2 ){
              tx.executeSql( "CREATE TABLE IF NOT EXISTS deny(sign TEXT, effective_sign TEXT, type TEXT)", [], function(){

                callback2();

              } );
            },

            function( callback2 ){
              tx.executeSql( "CREATE TABLE IF NOT EXISTS misc( `name` TEXT  UNIQUE ON CONFLICT REPLACE, `value` TEXT )", [], function(){
                callback2();
              });

            },

            function( callback2 ){
              tx.executeSql( "CREATE TABLE IF NOT EXISTS groups " +
                       "(name TEXT, position INT, global_id TEXT, sync INT DEFAULT 1)", [], function(){
                if(navigator.language == "ru" || navigator.language == "ru-RU") {
                  that._defaultDials[0].dials.push({
                    thumb_url: "http://fvd-data.s3.amazonaws.com/sdpreview/0/yandex-next.png",
                    thumb_source_type: "url",
                    url: "https://chrome.google.com/webstore/detail/yandex-next/mpneeadoaonjnpgnkacjikaddbnlplif",
                    global_id: "f154dfa",
                    title: "Yandex Next"
                  });
                }


                fvdSpeedDial.Utils.Async.arrayProcess( that._defaultDials, function( group, arrayProcessCallback ){
                  // add default group
                  that.groupAdd( group.group, function( result ){

                    if( result.result ){

                      fvdSpeedDial.Utils.Async.arrayProcess( group.dials, function( dialData, arrayProcessCallback2 ){
                        dialData.group_id = result.id;

                        dialData.get_screen_method = dialData.thumb_source_type != "url" ? "auto" : "custom";

                        that.addDial( dialData, function( res ){

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

                                chrome.runtime.sendMessage( {
                                  action: "forceRebuild"
                                } );

                              } );

                            });

                          }

                          arrayProcessCallback2();
                        } );

                      }, function(){
                        arrayProcessCallback();
                      } );

                    }
                    else{
                      arrayProcessCallback();
                    }

                  } );

                }, function(){
                  callback2();
                } );


              });
            },

            function( callback2 ){
              // create indexes

              fvdSpeedDial.Utils.Async.arrayProcess( requiredIndexes, function( index, arrayProcessCallback ){
                try{
                  tx.executeSql( index.sql, [], function(){
                    arrayProcessCallback();
                  } );
                }
                catch( ex ){
                  arrayProcessCallback();
                }
              }, function(){
                callback2();
              } );

            },

            function(){
              callback( true );
            }
          ]);

          /*
          tx.executeSql( "select * from sqlite_master", [], function( tx, results ){
            for( var i = 0; i != results.rows.length; i++ ){
              console.log( results.rows.item(i) );
            }
          } );
          */
        }
        else{

          fvdSpeedDial.Utils.Async.chain( [

            function( chainCallback ){

              // set sync for all groups.
              tx.executeSql( "UPDATE `groups` SET `sync` = 1", [], function(){
                chainCallback();
              });

            },

            function( chainCallback ){

              // check fields

              fvdSpeedDial.Utils.Async.arrayProcess( requiredFields, function( tableData, arrayProcessCallbackTable ){

                console.log( "Check ", tableData.table );

                that._tableFields( tableData.table, function( fields ){

                  //console.log( fields );

                  fvdSpeedDial.Utils.Async.arrayProcess( tableData.fields, function( field, arrayProcessCallbackField ){

                    console.log( field.name );

                    if( fields.indexOf( field.name ) == -1 && fields.length > 0 ){

                      //console.log( "Not found field? ", field.name, field.sql );

                      var sqls = field.sql;
                      if( !( sqls instanceof Array ) ){
                        sqls = [ sqls ];
                      }

                      fvdSpeedDial.Utils.Async.arrayProcess( sqls, function( sql, apCallbackSqls ){

                        tx.executeSql( sql, [], function(){

                          if( field.after ){
                            field.after( tx, function(){
                              apCallbackSqls();
                            } );
                          }
                          else{
                            apCallbackSqls();
                          }


                        } );

                      }, function(){

                        arrayProcessCallbackField();

                      }, true );


                    }
                    else{
                      arrayProcessCallbackField();
                    }

                  }, function(  ){

                    arrayProcessCallbackTable();
                  }, true );

                }, tx );

              }, function(){
                chainCallback();
              }, true );


            },

            function( chainCallback ){
              // check indexes

              //console.log( "Check indexes" );

              that._getIndexes( function( indexes ){

                fvdSpeedDial.Utils.Async.arrayProcess( requiredIndexes, function( index, arrayProcessCallback ){

                  //console.log( "Check index ", index.name );

                  if( indexes.indexOf( index.name ) == -1 ){

                    //console.log( "Create index", index.name );
                    tx.executeSql( index.sql, [], function(){
                      arrayProcessCallback();
                    } );

                  }
                  else{
                    arrayProcessCallback();
                  }

                }, function(){
                  chainCallback();
                }, true );

              }, tx );
            },

            function( chainCallback ){

              // check global_ids generation

              //console.log( "Check GUIDs" );

              if( _b( fvdSpeedDial.Prefs.get( "sd.global_ids_setuped" ) ) ){
                chainCallback();
              }
              else{

                fvdSpeedDial.Utils.Async.chain([
                  function( chainCallback2 ){

                    tx.executeSql( "SELECT rowid FROM dials WHERE global_id IS NULL", [], function( tx, result ){

                      var ids = [];
                      for( var i = 0; i != result.rows.length; i++ ){
                        ids.push( result.rows.item(i).rowid );
                      }

                      fvdSpeedDial.Utils.Async.arrayProcess( ids, function( id, arrayProcessCallback ){

                        tx.executeSql( "UPDATE dials SET global_id = ? WHERE rowid = ?", [that._generateGUID(), id], arrayProcessCallback );

                      }, function(){
                        chainCallback2();
                      } );

                    } );

                  },
                  function( chainCallback2 ){

                    tx.executeSql( "SELECT rowid FROM groups WHERE global_id IS NULL", [], function( tx, result ){

                      var ids = [];
                      for( var i = 0; i != result.rows.length; i++ ){
                        ids.push( result.rows.item(i).rowid );
                      }

                      fvdSpeedDial.Utils.Async.arrayProcess( ids, function( id, arrayProcessCallback ){

                        tx.executeSql( "UPDATE groups SET global_id = ? WHERE rowid = ?", [that._generateGUID(), id], arrayProcessCallback );

                      }, function(){
                        chainCallback2();
                      } );

                    } );

                  },
                  function(){
                    chainCallback();
                  }
                ]);


              }
            },

            function(){
              callback( true );
            }
          ] );

        }

      });
    }

  };

  fvdSpeedDial.Storage = new Storage();

})();


