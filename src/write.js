var r = require('rethinkdb');
var _ = require('lodash');

const SOURCE = 0
const TARGET = 2

const QUERY = function(){
  return { data: '', in: [], out: [], customIn: [], customOut: [], mapOut: {}, mapIn: {} };
}

function writeEntry(query, self, cb){ /// key, 1,2,3<>6,7   IN/OUT
  if(query[1] === '->'){
    writeSimpleRelation(query, self, cb);
  } else {
    writeCustomRelation(query, self, cb);
  }
}

function writeSimpleRelation(query, self, cb){
  r.connect(self.connection)
  .then(function(conn){
    return r.table('data').getAll(query[0],query[2], {index: "data"}).run(conn);
  }).then(function(cursor){
    cursor.toArray(function(err, results){
      if(!results.length){
        writeRecord(self, { id: self.index, data: query[0], out: [self.index+1]})
        .then(_.partial(writeRecord, self, { id: self.index+1, data: query[2], in: [self.index] }))
        .then(_.partial(updateIndex, self, 2, cb));
      } else if(results.length === 1) {
        var result = results[0], record;
        if(result.data === query[0]){
          writeRecord(self, { data: query[2], in: [result.id], id: self.index })
          .then(_.partial(addOutgoing, self, result.id, self.index))
          .then(_.partial(updateIndex, self, 1, cb));
        } else {
          writeRecord(self, { data: query[0], out: [result.id], id: self.index})
          .then(_.partial(addIncoming, self, result.id, self.index))
          .then(_.partial(updateIndex, self, 1, cb));
        }
      } else {
        cb();
      }
    })
  })
}

function writeCustomRelation(query, self, cb){
  r.connect(self.connection)
  .then(function(conn){
    return r.table('data')
            .getAll(query[0], query[1], query[2], {index: "data"})
            .run(conn);
  })
  .then(function(cursor){
    var mapOut = {};
    var mapIn = {};
    cursor.toArray(function(err, results){
      var source 	= _.findWhere(results, {data: query[0]});
      var link 	= _.findWhere(results, {data: query[1]});
      var target 	= _.findWhere(results, {data: query[2]});

      if(!results.length){
        mapOut[self.index] = [self.index+2];
        mapIn[self.index+2] = [self.index];
        writeRecord(self, { id: self.index, data: query[0], customOut: [self.index+1]})
        .then(_.partial(writeRecord, self, { id: self.index+1, data: query[1], mapOut: mapOut, mapIn: mapIn }))
        .then(_.partial(writeRecord, self, { id: self.index+2, data: query[2], customIn: [self.index+1] }))
        .then(_.partial(updateIndex, self, 3, cb));

      } else if(results.length === 3){
        addCustomOut(self, source.id, link.id)
        .then(_.partial(addThroughLink, self, link.id, source.id, target.id))
        .then(_.partial(addCustomIn, self, target.id, link.id))
        .then(cb)

      } else {
        // at least one missing
        if(source !== undefined){
          if(link !== undefined){
              // no target +link +source
              writeRecord(self, {id: self.index, data: query[2], customIn: [link.id]})
              .then(_.partial(addThroughLink, self, link.id, source.id, self.index))
              .then(_.partial(addCustomOut, self, source.id, link.id, self.index))
              .then(_.partial(updateIndex, self, 1, cb))
          } else {
            if(target !== undefined){
              // no link +source +target
              mapOut[source.id] = [target.id];
              mapIn[target.id] = [source.id];
              writeRecord(self, {id: self.index, data: query[1], mapIn: mapIn, mapOut: mapOut})
              .then(_.partial(addCustomOut, self, source.id, self.index, target.id))
              .then(_.partial(addCustomIn, self, target.id, self.index, source.id))
              .then(_.partial(updateIndex, self, 1, cb))
            } else {
              // no link no target +source
              mapOut[source.id] = [self.index+1];
              mapIn[self.index+1] = [source.id];
              writeRecord(self, {id: self.index, data: query[1], mapOut: mapOut, mapIn: mapIn })
              .then(_.partial(writeRecord, self, {id: self.index+1, data: query[2], customIn: [self.index]}))
              .then(_.partial(addCustomOut, self, source.id, self.index, self.index+1))
              .then(_.partial(updateIndex, self, 2, cb))
            }
          }
        } else {
          // no source
          if(link !== undefined){
            if(target !== undefined){
              // no source +link +target
              writeRecord(self, {id: self.index, data: query[0], customOut: [link.id]})
              .then(_.partial(addThroughLink, self, link.id, self.index, target.id))
              .then(_.partial(addCustomIn, self, target.id, link.id, self.index))
              .then(_.partial(updateIndex, self, 1, cb))
            } else {
              // no source no target +link
              writeRecord(self, {id: self.index, data: query[0], customOut: [link.id] })
              .then(_.partial(writeRecord, self, {id: self.index+1, data: query[2], customIn: [link.id]}))
              .then(addThroughLink, self, link.id, self.index, self.index+1)
              .then(_.partial(updateIndex, self, 2, cb))
            }
          } else {
            // no source no link +target
            mapOut[self.index] = target.id;
            mapIn[target.id] = self.index;
            writeRecord(self, {id: self.index, data: query[0], customOut: [self.index+1] })
            .then(_.partial(writeRecord, self, {id: self.index+1, data: query[1], mapIn: mapIn, mapOut: mapOut}))
            .then(_.partial(addCustomIn, self, target.id, self.index+1, self.index))
            .then(_.partial(updateIndex, self, 2, cb))
          }

        }
      }
    })
  })
}

/*
 * Utility functions for writing records
 */

function writeRecord(self, record){
  record = _.extend(QUERY(), record);
  return r.connect(self.connection).then(function(conn){
    return r.table('data').insert(record).run(conn);
  })
}

function addCustomIn(self, target, link, source){
  return r.connect(self.connection).then(function(conn){
    return r.table('data').get(target).update({
      customIn: r.row('customIn').setInsert(link)
    }).run(conn)
  })
}
function addCustomOut(self, source, link, target){
  return r.connect(self.connection).then(function(conn){
    return r.table('data').get(source).update({
      customOut: r.row('customOut').setInsert(link)
    }).run(conn)
  })
}
function addThroughLink(self, link, source, target){
  return r.connect(self.connection).then(function(conn){
    return r.table('data')
            .get(link)
            .update(function(link){
              return {
                mapOut: link("mapOut").merge({[source]: link('mapOut')(source.toString()).default([]).setInsert(target) }),
                mapIn: link("mapIn").merge({[target]: link('mapIn')(target.toString()).default([]).setInsert(source) })
              }
        }).run(conn);
  })
}

function updateIndex(self, n, cb){
  self.index += n;
  return r.connect(self.connection).then(function(conn){
    return r.table('data').get(0).update({ count: self.index }).run(conn);
  }).then(cb)
}

function addOutgoing(self, recordId, idToAdd){
  return r.connect(self.connection).then(function(conn){
    return r.table('data')
        .get(recordId)
        .update({ out: r.row('out').setInsert(idToAdd) })
        .run(conn);
  })
}

function addIncoming(self, recordId, idToAdd){
  return r.connect(self.connection).then(function(conn){
    return r.table('data')
        .get(recordId)
        .update({ in: r.row('in').setInsert(idToAdd) })
        .run(conn);
  })
}


module.exports = {
  writeEntry: writeEntry,
};
