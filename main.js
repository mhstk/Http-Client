const { exit } = require("process")
const Http_request = require("./httpClient")
const fs = require('fs')


let url;
let method;
let protocol;
let path;
let headers_str = "";
let queries_in = "" ;
let headers = {};
let queries = "";
let warning = false;
let body_data;
let body_json;
let body_file;
let isXFromUrl = false;
let isJson = false;
let isFile = false;
let timeout;

const METHODS = ["GET" , "POST", "PATCH" , "DELETE", "PUT"];




let args = process.argv.slice(2);
try{
    url = new URL(args[0])
}catch(err){
    console.log("ERROR! URL not valid.");
    exit()
  
}

function processArgument(argIndex, args){
    arg = args[argIndex];
    if (arg ==="-M" || arg === "--method"){
        method = args[argIndex+1];
        if (!checkMethod(method)){
            console.log("ERROR! Method should be one of [GET, POST, PATCH, DELETE, PUT].");
            exit()
        }
        method = method.toLowerCase();
        return argIndex+1;

    }else if(arg === "-H" || arg === "--headers") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            headers_str += args[argIndex+1] + ",";
        }else{
            console.log("ERROR! Headers option badly used.");
            exit();
        }
        return argIndex+1;

    }else if(arg === "-Q" || arg === "--queries") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            queries_in += args[argIndex+1] + "&";
        }else{
            console.log("ERROR! Queries option badly used.");
            exit();
        }
        return argIndex+1;

    }else if(arg === "-D" || arg === "--data") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            body_data = args[argIndex+1];
            headers["content-type"] = "application/x-www-from-urlencoded"
            isXFromUrl = true;
    
        }else{
            console.log("ERROR! Data option badly used.");
            exit();
        }
        return argIndex+1;

    }else if(arg === "--json") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            body_json = args[argIndex+1] ;
            headers["content-type"] = "application/josn"
            isJson = true;
        }else{
            console.log("ERROR! Json option badly used.");
            exit();
        }
        return argIndex+1;

    }else if(arg === "--file") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            body_file = getDataOfFile(args[argIndex+1]) ;
            if (body_file !== undefined){
                headers["content-type"] = "application/octet-stream"
                isFile = true;
            }else{
                console.log("ERROR! File option badly used.");
                exit();
            }
        }
        return argIndex+1;

    }else if(arg === "--timeout") {
        let re = /^(\d)+$/g
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== "" && args[argIndex+1].match(re)){
            timeout = parseInt(args[argIndex+1])*1000;
            // headers["content-length"] = Buffer.byteLength(data);
        }else{
            console.log("ERROR! Timeout option badly used.");
            exit();
        }
        return argIndex+1;

    }else{
        console.log("ERROR! bad argument.");
        exit();
    }
}


function getDataOfFile(addr){
    
    try{
        fs.statSync(addr);
        let data = fs.readFileSync(addr);
        return data;
    }catch(err){
        console.log("ERROR! problem reading the file.");
        exit();
    }
}


function checkMethod(method){
    if (method !== undefined && (METHODS.includes(method.toUpperCase())))
        return true;
    return false;
}


function processHeaders(str, delimiter, keyValueDelimiter){
    let outObj = {};
    let elements = str.split(delimiter).slice(0,-1);
    for (const ele in elements){
        let name;
        if (delimiter === ","){
            name = elements[ele].split(keyValueDelimiter)[0].toLowerCase();
        }else{
            name = elements[ele].split(keyValueDelimiter)[0];
        }
        let value = elements[ele].split(keyValueDelimiter)[1];
        if (name in outObj){
            warning = true
            console.log(`WARNING! Multiple value for "${name}".`);
        }
        outObj[name] = value;
    }
    return outObj;
}

function createQueries(obj){
    let outStr = "";
    for (const key in obj){
        outStr += `${key}=${obj[key]}&`;
    }
    outStr = outStr.slice(0, -1);
    return outStr;
}

function isJsonValidString(str){
    try{
        JSON.parse(str);
    }catch (e) {
        return false;
    }
    return true;
}



console.log();
for (let i = 1; i<args.length; i++){
    i = processArgument(i, args)
}

if (headers_str !== ""){
    headers = processHeaders(headers_str, ",", ":");
}
// console.log(headers);
// exit();

let queriesObj = {}
if (queries_in !== ""){
    queriesObj = processHeaders(queries_in, "&", "=");
}
queries = createQueries(queriesObj);

// console.log(queries);
// exit();
let data="";

if ((body_data !== undefined) || (body_json !== undefined) || body_file !== undefined){
    if (isXFromUrl + isJson + isFile > 1){
        console.log(`ERROR! You have used incompatible arguments together.`);
        exit();
    }
    if (isXFromUrl){
        let reXFormUrl = /^([^=&\s])+=([^=&\s])+(&([^=&\s])+=([^=&\s])+)*$/g;
        if (!body_data.match(reXFormUrl)){
            warning = true;
            console.log(`WARNING! Body not in x-www-form-urlencoded format.`);
        }
    }
    if (isJson){
        if (!isJsonValidString(body_json)){
            warning = true;
            console.log(`WARNING! Body not in json format.`);
        }
    }
    if (body_data !== undefined && body_data !== ""){
        data = body_data;
    }
    if (body_json !== undefined && body_json !== ""){
        data = body_json;
    }
    if (body_file !== undefined){
        data = body_file;
    }
}




if (warning){
    console.log("==========================================================================================================");
}
path = url.pathname;
path += "?" + queries;
protocol = url.protocol.slice(0, -1);
// console.log(protocol);
my_http = new Http_request({url:url.hostname, method , headers, body:data, timeout, path, protocol})
my_http.make_request()