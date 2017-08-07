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

function requestAndParse(userNum, outputPath, formats) {
    var memory = new Array
    if (fs.existsSync(outputPath + 'updated.json')) { 
        memory =JSON.parse(fs.readFileSync(outputPath + 'updated.json', 'utf8'));
        // Nothing smart is going on, so I don't need the file list.
        //memory.filelist.splice(0)
        var promise = getUserPromiseSince(userNum, memory.updated);
    } else {
        //Nothing smart is going on, so I don't need the file list.
        //baseMem = '{"updated": "0", "filelist": [ { "filename": "null", "category": "null" }] }'
        baseMem = '{"updated": "0"}'
        memory = JSON.parse(baseMem)
        var promise = getUserPromise(userNum);
    }
    promise.then(function(responses) {
        for (var i = 0, lenResp = responses.records.length; i < lenResp; i++) { 
            var lastUpdate = memory.updated
            console.log(i+1)
            console.log(responses.records[i].get("n.name"))
            var fileText = responses.records[i].get("n.editorPlainText")
            var fileRichText = responses.records[i].get("n.editorState")
            var mdFilename = "/" + responses.records[i].get("n.name") + ".md"
            var txtFilename = "/" + responses.records[i].get("n.name") + ".md"
            var folder = "Inbox"
            switch(responses.records[i].get("categories").length) {
                case 0: {
                    folder = "Inbox"
                    writeFiles(outputPath, folder, fileRichText, mdFilename, fileText, txtFilename, formats)
                }
                default: {
                    for (var c = 0, lenCats = responses.records[i].get("categories").length; c < lenCats; c++) { 
                        // For Nodes in more than one category, the files will exist in both collections, for ease of navigation.
                        folder = responses.records[i].get("categories")[c]
                        writeFiles(outputPath, folder, fileRichText, mdFilename, fileText, txtFilename, formats)
                    }
                }
            }
        }
        var timeStamp = new Date()
        memory.updated = timeStamp.valueOf()
        fs.writeFileSync(outputPath + 'updated.json', JSON.stringify(memory, null, 2) , 'utf-8');
        //process.exit()
        return 
    })
};


function writeFiles(outputPath, folder, fileRichText, mdFilename, fileText, txtFilename, formats) {
    var path = outputPath + folder
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
    if ((formats == 'markdown') || (formats == 'both')) {                    
        writeMDfile(fileRichText, path, mdFilename)
    }
    if ((formats == 'text') || (formats == 'both')) {
        writeTextFile(fileText, path, txtFilename)
    }
};

function writeMDfile(fileRichText, path, mdFilename) {
        ContentState = Draft.convertFromRaw(JSON.parse(fileRichText))
        var fileMarkDown = markitdown.stateToMarkdown(ContentState) 
        fs.writeFile(path + mdFilename.substring(0, 40), fileMarkDown, function(err) {
        if(err) {
            return console.log(err);
        }
        })
}

function writeTextFile(fileText, path, mdFilename) {
    var txtFilename = "/" + responses.records[i].get("n.name") + ".txt"   
    fs.writeFile(path + txtFilename.substring(0, 40), fileText, function(err) {
        if(err) {
            return console.log(err);
        }
    }
    )
};

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

function main(userNum,outputPath,formats) {
  if (!userNum) {
    userNum = '598122fd7583ec16ade0d209'
  }
  if (!outputPath) {
    outputPath = 'backup/'
  }
  if (!formats) {
    formats = 'markdown'
  }
  requestAndParse(userNum,outputPath,formats)

};

main();
