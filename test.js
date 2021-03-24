function t(i){
    if (i===0){
        return a;
    }
    else{
        return b;
    }
}

function a(){
    console.log("a");
}

function b(){
    console.log("b");
}



f = t(1);
f();