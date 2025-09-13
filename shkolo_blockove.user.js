// ==UserScript==
// @name         shkolo_blockove
// @namespace    https://github.com/GiggioG/userscripts
// @version      1.0.0
// @description  Merges schedule grid cells when you have a block of two consecutive classed.
// @author       Gigo_G
// @updateURL    https://github.com/GiggioG/userscripts/raw/main/shkolo_blockove.user.js
// @downloadURL  https://github.com/GiggioG/userscripts/raw/main/shkolo_blockove.user.js
//
// @match        https://app.shkolo.bg/diary*
// @match        https://app.shkolo.bg/user*
// ==/UserScript==

function log(...args){
    console.log("[shkolo-blockove]", ...args);
}

function classesTheSame(a, b){
    if(!a || !b) { return false; }
    if(!a.querySelector("a.scheduleCourse") || !b.querySelector("a.scheduleCourse")){ return false; }

    const textInParenthesesRegex = / *\([^)]*\)/g;

    let aITxt = a.querySelector("div.scheduleTableCourse > div").innerText;
    aITxt = aITxt.split(".  ")[1].split("\n").slice(0,2).join("\n"); // remove period № and hours
    aITxt = aITxt.replace(textInParenthesesRegex, ""); // remove text in parentheses

    let bITxt = b.querySelector("div.scheduleTableCourse > div").innerText;
    bITxt = bITxt.split(".  ")[1].split("\n").slice(0,2).join("\n"); // remove period № and hours
    bITxt = bITxt.replace(textInParenthesesRegex, ""); // remove text in parentheses
    
    return aITxt == bITxt;
}

function merge(table) {
    let lists = Array.from(table.querySelectorAll("div.scheduleTableColumn > div.scheduleTableBody"));
    for(const list of lists){
        let classes = {
            1: list.querySelector("div.scheduleTableCell[schedule-hour=\"1\"]"),
            2: list.querySelector("div.scheduleTableCell[schedule-hour=\"2\"]"),
            3: list.querySelector("div.scheduleTableCell[schedule-hour=\"3\"]"),
            4: list.querySelector("div.scheduleTableCell[schedule-hour=\"4\"]"),
            5: list.querySelector("div.scheduleTableCell[schedule-hour=\"5\"]"),
            6: list.querySelector("div.scheduleTableCell[schedule-hour=\"6\"]"),
            7: list.querySelector("div.scheduleTableCell[schedule-hour=\"7\"]"),
            8: list.querySelector("div.scheduleTableCell[schedule-hour=\"8\"]"),
        }
        for(let i = 1; i <= 7; i+= 2){
            if(classesTheSame(classes[i], classes[i+1])){
                classes[i  ].classList.add("shkolo-blockove-block-top");
                classes[i+1].classList.add("shkolo-blockove-block-bottom");
            }
        }
    }
    log("schedule merged.");
}

let waitfor_diaryShow_interval;
let tab_schedule = document.querySelector("div#tab_schedule");
function waitForMerge() {
    if (!tab_schedule.classList.contains("shkolo-blockove-merged")) {
        waitfor_diaryShow_interval = setInterval(function() {
            log("waiting for schedule to load...");

            let table = tab_schedule.querySelector("div.scheduleTable.clearfix");
            let loading = (document.querySelector("div.page-loader").style.display == "block");

            if(!!table && !loading){ // bug when it merges on the old date before the new one's schedule loads
                clearInterval(waitfor_diaryShow_interval); 
                log("schedule loaded - merging...");
                merge(table);
                tab_schedule.classList.add("shkolo-blockove-merged");
            }
        }, 500);
    }
}

function launch(){
    GM_addStyle(`
div.shkolo-blockove-block-top:not(.taken-shi) {
    border-bottom-color: white;
}
div.shkolo-blockove-block-top.taken-shi {
    border-bottom-color: #abdb97;
}

div.shkolo-blockove-block-bottom:not(.taken-shi) {
    border-top-color: white;
}
div.shkolo-blockove-block-bottom.taken-shi {
    border-top-color: #abdb97;
}
    `);
    waitForMerge();
    let weekSelector = document.querySelector("#tab_schedule > div > div.pull-right.hidden-print > div.weekSelector");
    if(weekSelector){
        weekSelector.addEventListener("click", ()=>{
            tab_schedule.classList.remove("shkolo-blockove-merged");
            clearInterval(waitfor_diaryShow_interval);
            waitForMerge();
        })
    }
}

if (location.hash == "#tab_schedule") {
    launch();
}

window.addEventListener("hashchange", e => {
    if (e.newURL.endsWith("#tab_schedule")) {
        launch();
    }
});
