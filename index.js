const http = require("http")
const https = require("https")
const { exit } = require("process")

const METHODS = ["GET" , "POST", "PATCH" , "DELETE", "PUT"];

class Http_request {

    constructor({url, method="get", protocol="http"}){

        this.protocol = protocol
        // console.log(this.protocol);
        this.url = url
        this.method = method
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
        proto.request({
            hostname: this.url,
            method: this.method,
            
        }, 
        res => {
            
            // console.log(res);
            res.on("data" , d => {
                data += d
            })
            res.on("end", d => {
                // console.log(data);
                this.print_data(res, this.protocol)
                
            })
        }
        ).end()
    }


    print_data(res, protocol="http"){
        console.log(`${protocol.toUpperCase()}/${res.httpVersion} ${res.statusCode} ${res.statusMessage}`);
        for (const key in res.headers){
            console.log(`${key} : ${res.headers[key]}`);
        }
        
    }
}





var url;
var method;
var protocol;
var headers_str;




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
        headers_str = args[argIndex+1];
        // console.log("headers_str:\t" + headers_str);
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



for (let i = 1; i<args.length; i++){
    i = processArgument(i, args)
}








protocol = url.protocol.slice(0, -1);
// console.log(protocol);
my_http = new Http_request({url:url.hostname, method , protocol})
my_http.make_request()



