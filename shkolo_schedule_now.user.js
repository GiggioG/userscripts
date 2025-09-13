// ==UserScript==
// @name         shkolo_schedule_now
// @namespace    https://github.com/GiggioG/userscripts
// @version      1.0.0
// @description  Highlights the current class in the schedule.
// @author       Gigo_G
// @updateURL    https://github.com/GiggioG/userscripts/raw/main/shkolo_schedule_now.user.js
// @downloadURL  https://github.com/GiggioG/userscripts/raw/main/shkolo_schedule_now.user.js
//
// @match        https://app.shkolo.bg/diary*
// @match        https://app.shkolo.bg/user*
// @grant        GM_addStyle
// ==/UserScript==

function log(...args) {
    console.log("[shkolo-schedule-now]", ...args);
}

function classSelector(table, day, period) {
    let sel = `div:nth-child(${day}) > div.scheduleTableBody > div:nth-child(${period})`;
    return table.querySelector(sel);
}

function replaceHTML(el, search, replace) {
    if (!el) { return; }
    el.innerHTML = el.innerHTML.replace(search, replace);
}

function hourToDate(hr, d) {
    let h = Number(hr.split(':')[0]);
    let m = Number(hr.split(':')[1]);
    let date = new Date(d);
    date.setHours(h);
    date.setMinutes(m);
    date.setSeconds(0, 0);
    return date;
}


const textInParenthesesRegex = / *\([^)]*\)/g;
function checkPeriodAndHighlight(el, nextEl, d) {
    let time = el.querySelector("span.scheduleSecondary:not(.secondaryFirst)").innerText;
    let interval = time.trim().split(" - ").map(e => hourToDate(e, d));

    let nextBegin = null;
    if (nextEl) {
        nextBegin = hourToDate(
            nextEl.querySelector("span.scheduleSecondary:not(.secondaryFirst)").innerText
                .trim().split(" - ")[0],
            d);
    }

    if (interval[0] <= d && interval[1] >= d) {
        el.querySelector(".scheduleTableCourse").classList.add("shkolo-schedule-now-current");
        el.querySelector(".scheduleTableCourse").classList.remove("shkolo-schedule-now-before-break");
    } else {
        el.querySelector(".scheduleTableCourse").classList.remove("shkolo-schedule-now-current");
        if (nextEl && d > interval[1] && d < nextBegin) {
            el.querySelector(".scheduleTableCourse").classList.add("shkolo-schedule-now-before-break");
        } else {
            el.querySelector(".scheduleTableCourse").classList.remove("shkolo-schedule-now-before-break");
        }
    }
}

function highlightNow(table) {
    let date = new Date();
    let today = date.getDay();
    if(today == 0 || today == 6){ return; } /// weekend
    {
        let tableColumnDate = table.children[today - 1].querySelector("span").innerText.split("/ ")[1];
        let nowDate = date.toLocaleDateString("bg").replace(" г.", "").padStart(10, '0');
        if (tableColumnDate != nowDate) { return; } // if on another date
    }
    for (let i = 1; i <= 8; i++) {
        let el = classSelector(table, today, i);
        let nextEl = classSelector(table, today, i + 1);
        if (!el || !el.querySelector("a.scheduleCourse")) { continue; }
        checkPeriodAndHighlight(el, nextEl, date);
    }
}

let tab_schedule = document.querySelector("div#tab_schedule");
let refreshInterval = null;
function beginRefreshInterval() {
    GM_addStyle(`
.shkolo-schedule-now-current {
    border: 2px solid red;
}
.shkolo-schedule-now-before-break {
    border-bottom: 2px solid red;
}
    `);
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(function () {
        let table = tab_schedule.querySelector("div.scheduleTable.clearfix");
        let loading = (document.querySelector("div.page-loader").style.display == "block");

        if (!!table && !loading) {
            highlightNow(table);
        }
    }, 1000);
}

function launch() {
    log("beginning to keep track of the current class.")
    beginRefreshInterval();
}

if (location.hash == "#tab_schedule") {
    launch();
}

window.addEventListener("hashchange", e => {
    if (e.newURL.endsWith("#tab_schedule")) {
        launch();
    }
});
