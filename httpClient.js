const http = require("http")
const https = require("https")
const fs = require("fs")
const { exit } = require("process")
const stream = require("stream")
const _cliProgress = require('cli-progress');



const progressBar = new _cliProgress.SingleBar({
    format: '{bar} {percentage}% | ETA: {eta}s'
}, _cliProgress.Presets.shades_classic);




class Http_request {

    constructor({url, method="get", headers={}, body=undefined, timeout=undefined, path="/", protocol="http"}){

        this.protocol = protocol
        // console.log(this.protocol);
        this.url = url
        this.method = method
        this.headers = headers;
        this.path = path;
        this.body = body;
        this.timeout = timeout;
        this.FILES_DIRECTORY = "./Downloaded\ Files"
        this.SUPPORTABLE_EXTE = ["application/pdf" , "application/zip" , "image/png", "image/jpeg", "video/mp4"];
        // console.log(this.method);
    }


    make_request(){
        let proto;
        if (this.protocol === "http"){
            proto = http
        } else if (this.protocol === "https"){
            proto = https
        }

        let dataReadStream = new stream.Readable();
        dataReadStream._read = function() {};
        
        let isDownloadedFile = false;


        let recievedLength = 0;
        



        let req = proto.request({
            hostname: this.url,
            method: this.method,
            headers : this.headers,
            path : this.path
            
        }, 
        res => {
            
            // console.log(res);
            res.on("data" , d => {
                isDownloadedFile = this.processData(res.headers, dataReadStream ,d, this.SUPPORTABLE_EXTE);
                recievedLength += d.length
                progressBar.update(recievedLength);
                

            })
            res.on("end", d => {
                progressBar.stop();
                if (isDownloadedFile){
                    try{
                        let filename;
                        if (this.path.indexOf(".") !== -1){
                            filename = this.path.slice(this.path.lastIndexOf("/")+1, this.path.indexOf("."))
                        }else{
                            filename = this.path.slice(this.path.lastIndexOf("/")+1, this.path.indexOf("?"))
                        }
                        if (filename === ""){
                            filename = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '') 
                        }
                        filename += this.getFileExtention(res.headers["content-type"].split(";")[0]);
                        filename = this.FILES_DIRECTORY + "/" +filename;
                        let fileWriteStream = fs.createWriteStream(filename);
                        

                        dataReadStream.pipe(fileWriteStream);
                        console.log(`File successfuly saved to "${filename}"`);
                        fileWriteStream.on("error", ()=>{
                            console.log("Failed to save file! 5555");
                        });
                    }catch(err){
                        console.log("Failed to save file!");
                        console.log(err.message);
                        
                    }


                }else{
                    dataReadStream.pipe(process.stdout);
                }
                
                
            })
        }
        )

        req.on("response", (response) => {
            this.print_data(response, this.protocol)
            console.log("\n-----------------------------------------------------------------------------------------------------------\nData:");
            if ("content-length" in response.headers){
                var totalBytes = response.headers["content-length"];
                progressBar.start(totalBytes, 0);
            }
        })


        // // setting headers
        // for (const key in this.headers){
        //     req.setHeader(key, this.headers[key]);
        // }
        
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            progressBar.stop();
        });

        if (this.body !== undefined && this.body !== ""){
            req.write(this.body);
        }

        if (this.timeout !== undefined){
            req.setTimeout(this.timeout, () => {
                console.log("***TIMEOUT***");
                req.destroy();
                exit();
            });
        }

        req.end();




        //writing readStream to file
    }

    getFileExtention(contentType){
        if (contentType === "application/pdf"){
            return ".pdf";
        }else if (contentType === "application/zip"){
            return ".zip";
        }else if (contentType === "image/png"){
            return ".png";
        }else if (contentType === "image/jpeg"){
            return ".jpeg";
        }else if (contentType === "video/mp4"){
            return ".mp4";
        }
    }


    processData(headers, dataReadStream, data, supportable_exte){
        dataReadStream.push(data)
        if (supportable_exte.includes(headers["content-type"].split(";")[0])){
            return true;
        }
        return false;
    }


    print_data(res, protocol="http"){
        console.log();
        console.log(`${protocol.toUpperCase()}/${res.httpVersion} ${res.statusCode} ${res.statusMessage}`);
        for (const key in res.headers){
            console.log(`${this.capitalizeFirstLetter(key)} : ${res.headers[key]}`);
        }
        
    }

    capitalizeFirstLetter(str){
        let words = str.split("-")
        let nStr = "";
        for (const word in words){
            nStr += words[word].charAt(0).toUpperCase() + words[word].slice(1) + "-";
        }
        nStr = nStr.slice(0, -1);
        return nStr
    }
}


module.exports = Http_request;