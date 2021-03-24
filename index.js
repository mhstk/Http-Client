const http = require("http")
const https = require("https")
const { exit } = require("process")

const METHODS = ["GET" , "POST", "PATCH" , "DELETE", "PUT"];

class Http_request {

    constructor({url, method="get", headers={}, path="/", protocol="http"}){

        this.protocol = protocol
        // console.log(this.protocol);
        this.url = url
        this.method = method
        this.headers = headers;
        this.path = path;
        // console.log(this.method);
    }


    make_request(){
        var proto;
        if (this.protocol === "http"){
            proto = http
        } else if (this.protocol === "https"){
            proto = https
        }
        let data = ""



        var req = proto.request({
            hostname: this.url,
            method: this.method,
            headers : this.headers,
            path : this.path
            
        }, 
        res => {
            
            // console.log(res);
            res.on("data" , d => {
                data += d
            })
            res.on("end", d => {
                this.print_data(res, this.protocol)
                console.log(data);
                
            })
        }
        )


        // // setting headers
        // for (const key in this.headers){
        //     req.setHeader(key, this.headers[key]);
        // }

        req.end();

    }


    print_data(res, protocol="http"){
        console.log(`${protocol.toUpperCase()}/${res.httpVersion} ${res.statusCode} ${res.statusMessage}`);
        for (const key in res.headers){
            console.log(`${this.capitalizeFirstLetter(key)} : ${res.headers[key]}`);
        }
        
    }

    capitalizeFirstLetter(str){
        var words = str.split("-")
        var nStr = "";
        for (const word in words){
            nStr += words[word].charAt(0).toUpperCase() + words[word].slice(1) + "-";
        }
        nStr = nStr.slice(0, -1);
        return nStr
    }
}





var url;
var method;
var protocol;
var path;
var headers_str = "";
var queries_in = "" ;
var headers = {};
var queries = "";
var doubleHeaderKeyWarning = false;




var args = process.argv.slice(2);
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
    }else{
        console.log("ERROR! bad argument.");
    }
}


function checkMethod(method){
    if (method !== undefined && (METHODS.includes(method.toUpperCase())))
        return true;
    return false;
}


function processHeaders(str, delimiter, keyValueDelimiter){
    var outObj = {};
    var elements = str.split(delimiter).slice(0,-1);
    for (const ele in elements){
        if (delimiter === ","){
            var name = elements[ele].split(keyValueDelimiter)[0].toLowerCase();
        }else{
            var name = elements[ele].split(keyValueDelimiter)[0];
        }
        var value = elements[ele].split(keyValueDelimiter)[1];
        if (name in outObj){
            doubleHeaderKeyWarning = true
            console.log(`WARNING! multiple value for "${name}".`);
        }
        outObj[name] = value;
    }
    return outObj;
}

function createQueries(obj){
    var outStr = "";
    for (const key in obj){
        outStr += `${key}=${obj[key]}&`;
    }
    outStr = outStr.slice(0, -1);
    return outStr;
}









for (let i = 1; i<args.length; i++){
    i = processArgument(i, args)
}

if (headers_str !== ""){
    headers = processHeaders(headers_str, ",", ":");
}
// console.log(headers);
// exit();

var queriesObj = {}
if (queries_in !== ""){
    queriesObj = processHeaders(queries_in, "&", "=");
}
queries = createQueries(queriesObj);

// console.log(queries);
// exit();

if (doubleHeaderKeyWarning){
    console.log("\n");
    console.log("--------------------------------------------------------------");
}
path = url.pathname;
path += "?" + queries;
protocol = url.protocol.slice(0, -1);
// console.log(protocol);
my_http = new Http_request({url:url.hostname, method , headers, path, protocol})
my_http.make_request()



