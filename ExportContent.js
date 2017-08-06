const neo4j = require('neo4j-driver').v1;
var _ = require('lodash');
var Draft = require('draft-js')
var markitdown = require('draft-js-export-markdown')
var fs = require('fs');
const uri = "bolt://localhost:7687"
const user = "neo4j"
const password = "test"
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session1 = driver.session()
//var convertFromRaw = require('draft-js/convertFromRaw')
//import {convertFromRaw} from 'draft-js';

function clearGraph() {
  const session = driver.session();
  return session.run('MATCH (n) WITH n LIMIT 1000000 DETACH DELETE n').then(result => {
  session.close();
  return result;
  });
}



function addLink(typeIn,guidIn,titleIn) {
  const session = driver.session();
  return session.run('CREATE (a:concept:topic {type: $type, guid: $guid, title: $title})', 
{type: typeIn, guid: guidIn, title: titleIn}).then(result => {
  session.close();
  return result;
  });
}


function addConcept(typeIn,nameIn,titleIn) {
  const session = driver.session();
  var today = new Date()
  var stamp = today.toISOString()
  
  console.log("Date: " + stamp)
  return session.run('CREATE (a:concept:topic {type: $type, name: $name, title: $title, created: $time})',
  {type: typeIn, name: nameIn, title: titleIn, time: stamp}).then(result => {
  session.close();
  return result;
  });
}

function upDate(nameIn) {
  const session = driver.session();
  var today = new Date()
  var stamp = today.toISOString()
  console.log("Name: " + nameIn + " Updated: " + stamp)
  return session.run('MATCH (n {name: $name}) \
SET n.updated = $time \
RETURN n.updated ',
  {name: nameIn, time: stamp}).then(result => {
  session.close();
  return result;
  });
}


function getOne() {
    const session = driver.session();
    matchString = 'MATCH (n:Node) \
        WHERE n.editorPlainText <> "" \
        MATCH (n)-[:IN]->(coll:Collection) \
        RETURN n.name, collect(coll.name), n.editorPlainText, n.editorState \
        LIMIT 1'
    return session
        .run(matchString)
        .then(result => {
            session.close();
            if (_.isEmpty(result.records))
                return null;
            //var record = result.records[0];
            //console.log(result.records[0].get("n.name"))
            //console.log(result.records[0].get("n.editorState"))
            return result;
    })
    .catch(error => {
  session.close();
      throw error;
    });
};

function requestAndParse() {
    var memory = new Array
    if (fs.exists('updated.json')) { 
        memory =JSON.parse(fs.readFileSync('updated.json', 'utf8'));
        memory.filelist.splice(0)
    } else {
        baseMem = '{"updated": "0", "filelist": [ { "filename": "null", "category": "null" }] }'
        memory = JSON.parse(baseMem)
    }
    var promise = getOnePromise();
    //if (!fs.existsSync('backup')){
    //        fs.mkdirSync('backup');
    //    }
    promise.then(function(responses) {
        for (var i = 0, len = responses.records.length; i < len; i++) { 
            
            console.log(i+1)
            console.log(responses.records[i].get("n.name"))
            var fileText = responses.records[i].get("n.editorPlainText")
            var fileRichText = responses.records[i].get("n.editorState")
            var mdFilename = "/" + responses.records[i].get("n.name") + ".md"
            ContentState = Draft.convertFromRaw(JSON.parse(fileRichText))
            
            //Break here for Double Categories
            
            var folder = "Inbox"
            if (responses.records[i].get("categories").length > 0) {
                folder = responses.records[i].get("categories")[0]
                if (responses.records[i].get("categories").length > 1) {
                    console.log("Need to handle multiple categories")
                }
            }
            var path = "backup/" + folder
            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            var fileMarkDown = markitdown.stateToMarkdown(ContentState)   
            fs.writeFile(path + mdFilename.substring(0, 40), fileMarkDown, function(err) {
                if(err) {
                    return console.log(err);
                }
            })
            var txtFilename = "/" + responses.records[i].get("n.name") + ".txt"   
            fs.writeFile(path + txtFilename.substring(0, 40), fileText, function(err) {
                if(err) {
                    return console.log(err);
                }
            })
            memory.filelist.push({"filename":responses.records[i].get("n.name").substring(0,40),"category":folder});
            //memory = JSON.stringify(memory);
        };
    var timeStamp = new Date()
    memory.updated = timeStamp.valueOf()
    fs.writeFileSync('updated.json', JSON.stringify(memory, null, 2) , 'utf-8');
    return
})};
 
/* 
----------
Krang checks .update
Generate fileList in memory from all nodes with content.
Cycle through files in folders, archive if not on the guest list.
Exports files changed since last .update
restamp .update file
hg commit (with .hg folder elsewhere on the server) 

----------
*/

                // https://coderwall.com/p/kvzbpa/don-t-use-array-foreach-use-for-instead
                
                        //console.log(responses.records[0].get("n.name"))
            //console.log(responses.records[0].get("n.editorState"))

function getOnePromise() {
    const session = driver.session();
    matchString = 'MATCH (n:Node) \
        WHERE n.editorPlainText <> "" \
        OPTIONAL MATCH (n)-[:IN]->(coll:Collection) \
        RETURN n.name, collect(coll.name) AS categories, n.editorPlainText, n.editorState \
        LIMIT 100'
    return session
        .run(matchString)
        .catch(error => {
            session.close();
            throw error;
    });
};
/*
MATCH (n:Node) \
WHERE n.editorPlainText <> "" \
MATCH (n)-[:IN]->(coll:Collection) \
RETURN n.name, collect(coll.name), n.editorPlainText, n.editorState \
LIMIT 1
*/

function getID(guidIn) {
  const session = driver.session();
  return session.run('MATCH (n:concept) WHERE n.name = $name RETURN ID(n) LIMIT 1', 
{guid: guidIn}).then(result => {
  session.close();
  return result;
  });
};

function pass(input) {
  return input;
}

function getConceptPropertyValue(property,guidID) {
  var session = driver.session();
  var matchString = ("MATCH (n) WHERE n.guid = $guid RETURN n." + property +  " as outputted LIMIT 1")
  return session
    .run(
      matchString, {guid: guidID})
    .then(result => {
      session.close();

      if (_.isEmpty(result.records))
        return null;

      var record = result.records[0];
      return record;
    })
    .catch(error => {
  session.close();
      throw error;
    });
}


function main() {
  /*clearGraph()
  title = "Who will be the Doctor?"
  guid1 = "whoDoc"
  addConcept("topic", guid1, title);
  title = "The mom from Broadchurch"
  guid2 = "sheDoc"
  addConcept("topic", guid2, title);
  upDate(guid1)
  //var test = getConceptPropertyValue('time',guid1)
  console.log("Done Executing Main")
  */
  //getOne()
  requestAndParse()
  //wait(1000)

 // console.log(result.records[0].get("n.name"))
 // const record = result.records[0]
  //console.log(matches.records[0])
  //console.log(matches[name]) 
  return
}

main();

/*
const resultPromise = session.run(
  'CREATE (a:topic:task {name: $name, comment: "The stuff"}) RETURN a',
  {name: name}, {type: topicType}
);


resultPromise.then(result => {
  session.close();

  const singleRecord = result.records[0];
  const node = singleRecord.get(0);

  console.log(node.properties.name);

  // on application exit:
  driver.close();
}); */

/* 
MATCH (n)
WITH n LIMIT 1000000
DETACH DELETE n
*/
