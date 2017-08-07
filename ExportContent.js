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

function requestAndParse(userNum, outputPath) {
    var memory = new Array
    if (fs.existsSync(outputPath + 'updated.json')) { 
        memory =JSON.parse(fs.readFileSync(outputPath + 'updated.json', 'utf8'));
        memory.filelist.splice(0)
        var promise = getUserPromiseSince(userNum, memory.updated);
    } else {
        baseMem = '{"updated": "0", "filelist": [ { "filename": "null", "category": "null" }] }'
        memory = JSON.parse(baseMem)
        var promise = getUserPromise(userNum);
    }
    
    promise.then(function(responses) {
        for (var i = 0, len = responses.records.length; i < len; i++) { 
            
            var lastUpdate = memory.updated
            if (lastUpdate > responses.records[i].get("n.created")) {
                memory.filelist.push({"filename":responses.records[i].get("n.name").substring(0,40),"category":folder});
                break
            }
            if (lastUpdate > responses.records[i].get("n.modified")) {
                memory.filelist.push({"filename":responses.records[i].get("n.name").substring(0,40),"category":folder});
                break
            }
            console.log(i+1)
            console.log(responses.records[i].get("n.name"))
            var fileText = responses.records[i].get("n.editorPlainText")
            var fileRichText = responses.records[i].get("n.editorState")
            var mdFilename = "/" + responses.records[i].get("n.name") + ".md"
            ContentState = Draft.convertFromRaw(JSON.parse(fileRichText))
            
            //TODO: Break here for Double Categories
            
            var folder = "Inbox"
            if (responses.records[i].get("categories").length > 0) {
                folder = responses.records[i].get("categories")[0]
                if (responses.records[i].get("categories").length > 1) {
                    console.log("Need to handle multiple categories")
                }
            }
            var path = outputPath + folder
            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            var fileMarkDown = markitdown.stateToMarkdown(ContentState)   
            fs.writeFile(path + mdFilename.substring(0, 40), fileMarkDown, function(err) {
                if(err) {
                    return console.log(err);
                }
            })

            // Text output is not needed with Markdown
            /* var txtFilename = "/" + responses.records[i].get("n.name") + ".txt"   
            fs.writeFile(path + txtFilename.substring(0, 40), fileText, function(err) {
                if(err) {
                    return console.log(err);
                }
            }) */
            memory.filelist.push({"filename":responses.records[i].get("n.name").substring(0,40),"category":folder});
        };
    var timeStamp = new Date()
    memory.updated = timeStamp.valueOf()
    fs.writeFileSync(outputPath + 'updated.json', JSON.stringify(memory, null, 2) , 'utf-8');
    //process.exit()
    return
})};
 


// https://coderwall.com/p/kvzbpa/don-t-use-array-foreach-use-for-instead

function getOnePromise() {
    const session = driver.session();
    matchString = 'MATCH (n:Node) \
        WHERE n.editorPlainText <> "" \
        OPTIONAL MATCH (n)-[:IN]->(coll:Collection) \
        RETURN n.name, collect(coll.name), n.editorPlainText, n.editorState \
        LIMIT 1'
    return session
        .run(matchString)
        .then(result => {
            session.close();
            if (_.isEmpty(result.records))
                return null;
            return result;
    })
    .catch(error => {
  session.close();
      throw error;
    });
};

function getFullPromise() {
    const session = driver.session();
    matchString = 'MATCH (n:Node) \
        WHERE n.editorPlainText <> "" \
        OPTIONAL MATCH (n)-[:IN]->(coll:Collection) \
        RETURN n.name, collect(coll.name) AS categories, n.editorPlainText, n.editorState, n.modified, n.created \
        LIMIT 100'
    return session
        .run(matchString)
        .catch(error => {
            session.close();
            //if (_.isEmpty(result.records))
            //    return console.log("No results found with this criteria.");
            throw error;
    });
};


function getUserPromise(userNumber) {
    const session = driver.session();
    matchString = "MATCH (n:Node)<-[:AUTHOR]-(m:User {id:'" + userNumber + "'}) \
     WHERE n.editorPlainText <> '' \
     OPTIONAL MATCH (n)-[:IN]->(coll:Collection) \
     RETURN n.name, collect(coll.name) AS categories, n.editorPlainText, n.editorState, n.modified, n.created \
     LIMIT 100"
    return session
        .run(matchString)
        .catch(error => {
            session.close();
            //if (_.isEmpty(result.records))
            //    return console.log("No results found with this criteria.");
            throw error;
    });
};

function getUserPromiseSince(userNumber, cutoffdate) {
    const session = driver.session();
    matchString = 'MATCH (n:Node)<-[:AUTHOR]-(m:User {id:"' + userNumber + '"}) \
        WHERE ((n.created > ' + cutoffdate +') OR (n.modified > ' + cutoffdate +')) AND (n.editorPlainText <> "") \
        OPTIONAL MATCH (n)-[:IN]->(coll:Collection) \
        RETURN n.name, collect(coll.name) AS categories, n.editorPlainText, n.editorState, n.modified, n.created \
        LIMIT 100'
    return session
        .run(matchString)
        .catch(error => {
            session.close();
            throw error;
    });
};

function main(userNum,outputPath) {
  // var folders = [{'User':'Matthew','UID':'5957e13005aa7321063ec206','path':'/home/matt/Dropbox/Krang/backup'}]
  if (!userNum) {
    userNum = '5957e13005aa7321063ec206'
  }
  if (!outputPath) {
      outputPath = 'backup/'
  }
  requestAndParse(userNum,outputPath)

  //process.exit()
}

main();
