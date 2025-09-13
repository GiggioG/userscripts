// ==UserScript==
// @name         shkolo_schedule_fix
// @namespace    https://github.com/GiggioG/userscripts
// @version      1.0.0
// @description  Allows for custom fixes to a schedule in certain time ranges. See example.
// @author       Gigo_G
// @updateURL    https://github.com/GiggioG/userscripts/raw/main/shkolo_schedule_fix.user.js
// @downloadURL  https://github.com/GiggioG/userscripts/raw/main/shkolo_schedule_fix.user.js
//
// @match        https://app.shkolo.bg/diary*
// @match        https://app.shkolo.bg/user*
// ==/UserScript==

const CONFIGS = [
    { /// example
        changes: [
            { day: 2, class: 4, search: "Math", replace: "Calculus" }, /// tuesday, 4th period
            { day: 5, class: 2, search: "Math", replace: "Geometry" }, /// friday, 2nd period
        ],
        range: {
            from: "01.09.2022",
            to: "30.06.2023"
        }
    }
];

function log(...args){
    console.log("[shkolo-schedule-fix]", ...args);
}

function classSelector(table, day, period){
    let sel = `div:nth-child(${day}) > div.scheduleTableBody > div:nth-child(${period})`;
    return table.querySelector(sel);
}

function replaceHTML(el, search, replace){
    if(!el){ return; }
    el.innerHTML = el.innerHTML.replace(search, replace);
}

function compareHumanDates(a, b){
    let arrA = a.match(/(\d+)\.(\d+).(\d\d\d?\d?)/).slice(1, 4).map(e => Number(e));
    let arrB = b.match(/(\d+)\.(\d+).(\d\d\d?\d?)/).slice(1, 4).map(e => Number(e));
    if(arrA[2] < 2000){ arrA[2] += 2000; }
    if(arrB[2] < 2000){ arrB[2] += 2000; }
    for(let i = 3-1; i >= 0; i--){
        if(arrA[i] > arrB[i]){ return +1; }
        if(arrA[i] < arrB[i]){ return -1; }
    }
    return 0;
}

function fix(table) {
    const dates = Array.from(table.children).map(e=>e.querySelector("span").innerText.split(" / ")[1]);
    for(let day = 1; day <= 5; day++){
        let date = dates[day-1];
        for(let cfg of CONFIGS){
            if(compareHumanDates(cfg.range.from, date) <= 0 && compareHumanDates(cfg.range.to, date) >= 0){
                for(let change of cfg.changes.filter(c => c.day == day)){
                    replaceHTML(classSelector(table, change.day, change.class)?.querySelector("div > div > a"), change.search, change.replace);
                }
                break;
            }
        }
    }
    log("schedule fixed.")
}

let waitfor_diaryShow_interval = null;
let tab_schedule = document.querySelector("div#tab_schedule");
function waitForMerge() {
    if (!tab_schedule.classList.contains("shkolo-schedule-fix-fixed")) {
        waitfor_diaryShow_interval = setInterval(function() {
            log("waiting for schedule to load...");

            let table = tab_schedule.querySelector("div.scheduleTable.clearfix");
            let loading = (document.querySelector("div.page-loader").style.display == "block");

            if(!!table && !loading){ // bug when it merges on the old date before the new one's schedule loads
                clearInterval(waitfor_diaryShow_interval); 
                log("schedule loaded - fixing...");
                fix(table);
                tab_schedule.classList.add("shkolo-schedule-fix-fixed");
            }
        }, 500);
    }
}

function launch(){
    waitForMerge();
    let weekSelector = document.querySelector("#tab_schedule > div > div.pull-right.hidden-print > div.weekSelector");
    if(weekSelector){
        weekSelector.addEventListener("click", ()=>{
            tab_schedule.classList.remove("shkolo-schedule-fix-fixed");
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
