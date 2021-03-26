const { exit } = require("process")
const Http_request = require("./httpClient")
let url;
let method;
let protocol;
let path;
let headers_str = "";
let queries_in = "" ;
let headers = {};
let queries = "";
let doubleHeaderKeyWarning = false;
let data="";
let isXFromUrl = false;
let isJson = false;
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
            console.log("ERROR! method should be one of [GET, POST, PATCH, DELETE, PUT].");
            exit()
        }
        method = method.toLowerCase();
        // console.log("method:\t" + method);
        return argIndex+1;
    }else if(arg === "-H" || arg === "--headers") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            headers_str += args[argIndex+1] + ",";
        }
        // console.log("headers_str:\t" + headers_str);
        return argIndex+1;
    }else if(arg === "-Q" || arg === "--queries") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            queries_in += args[argIndex+1] + "&";
        }
        // console.log("queries_in:\t" + queries_in);
        return argIndex+1;
    }else if(arg === "-D" || arg === "--data") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            data += args[argIndex+1] + "&";
            headers["content-type"] = "application/x-www-from-urlencoded"
            isXFromUrl = true;
            // headers["content-length"] = Buffer.byteLength(data);
        }
        // console.log("queries_in:\t" + queries_in);
        return argIndex+1;
    }else if(arg === "--json") {
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== ""){
            data += args[argIndex+1] ;
            headers["content-type"] = "application/josn"
            isJson = true;
            // headers["content-length"] = Buffer.byteLength(data);
        }
        // console.log("queries_in:\t" + queries_in);
        return argIndex+1;
    }else if(arg === "--timeout") {
        let re = /(\d)+/g
        if (args[argIndex+1] !== undefined && args[argIndex+1] !== "" && args[argIndex+1].match(re)){
            timeout = parseInt(args[argIndex+1])*1000;
            // headers["content-length"] = Buffer.byteLength(data);
        }
        // console.log("queries_in:\t" + queries_in);
        return argIndex+1;
    }else{
        console.log("ERROR! bad argument.");
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
            doubleHeaderKeyWarning = true
            console.log(`WARNING! multiple value for "${name}".`);
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


if (data != "" && data != undefined){
    if (isXFromUrl){
        data = data.slice(0,-1);
        let reXFormUrl = /^([^=&\s])+=([^=&\s])+(&([^=&\s])+=([^=&\s])+)*$/g;
        if (!data.match(reXFormUrl)){
            console.log(`WARNING! body not in "x-www-form-urlencoded" format.`);
        }
    }else if (isJson){
        if (!isJsonValidString(data)){
            console.log(`WARNING! body not in "json" format.`);
        }
    }
}




if (doubleHeaderKeyWarning){
    console.log("\n");
    console.log("--------------------------------------------------------------");
}
path = url.pathname;
path += "?" + queries;
protocol = url.protocol.slice(0, -1);
// console.log(protocol);
my_http = new Http_request({url:url.hostname, method , headers, body:data, timeout, path, protocol})
my_http.make_request()