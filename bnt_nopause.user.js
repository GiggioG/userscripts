// ==UserScript==
// @name         bnt_nopause
// @namespace    https://github.com/GiggioG/userscripts
// @version      1.0.0
// @description  Spira me da ne pauziram novinite.
// @author       Gigo_G
// @updateURL    https://github.com/GiggioG/userscripts/raw/main/bnt_nopause.user.js
// @downloadURL  https://github.com/GiggioG/userscripts/raw/main/bnt_nopause.user.js
//
// @match        https://tv.bnt.bg/*
// @match        https://i.cdn.bg/live/*
// ==/UserScript==

function log(...args){
    console.log("[bnt_nopause]", ...args);
}

function main(){
    let video = null;

    let unpauseInterval;
    function startUnpauseInterval(){
        unpauseInterval = setInterval(()=>{
            if(video.paused && video.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA){
                video.play();
                log("Video paused, playing.")
            }
        }, 20);
    }

    let waitingInterval = setInterval(()=>{
        video = document.querySelector("video");
        if(video != null){
            log("Found video element, beginning to keep it playing...")
            clearInterval(waitingInterval);
            startUnpauseInterval();
        }

    }, 50);
    log("Waiting for video element...")
}

/// ENSURE main() is called only on i.cdn.bg frames on tv.bnt.bg

if(location.host == "tv.bnt.bg"){
    const frame = document.querySelector("div.iframe-container iframe").contentWindow;
    window.addEventListener("message", msg => {
        if(msg.origin != "https://i.cdn.bg"){ return; }
        if(msg.source != frame){ return; }
        if(msg.data == "bnt_nopause:im_frame"){
            log(`top: message from frame "${msg.data}" `);
            frame.postMessage("bnt_nopause:start_unpausing", "https://i.cdn.bg");
        }
    });
}else if(location.host == "i.cdn.bg"){
    window.addEventListener("message", msg => {
        if(msg.origin != "https://tv.bnt.bg"){ return; }
        if(msg.source != window.top){ return; }
        if(msg.data == "bnt_nopause:start_unpausing"){
            log(`frame: message from top "${msg.data}" `);
            main();
        }
    });
    window.top.postMessage("bnt_nopause:im_frame", "https://tv.bnt.bg");
}
