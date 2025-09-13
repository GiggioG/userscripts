// ==UserScript==
// @name         arena_show_tags
// @namespace    https://github.com/GiggioG/userscripts
// @version      1.0.0
// @description  Shows the problem's tags on the competitive programming platform arena.
// @author       Gigo_G
// @updateURL    https://github.com/GiggioG/userscripts/raw/main/arena_show_tags.user.js
// @downloadURL  https://github.com/GiggioG/userscripts/raw/main/arena_show_tags.user.js
//
// @match        https://arena.olimpiici.com/*
// @match        https://arena.infosbg.com/*
// ==/UserScript==

function log(...args){
    console.log("[arena_show_tags]", ...args);
}

async function getTags(){
    const downloadLinkSelector = "body > jhi-main > div.container-fluid > div > jhi-problem-in-competition > div > div > div > dl > dd:nth-child(2) > a.btn.btn-primary"
    let problemId = document.querySelector(downloadLinkSelector).href.split('/').slice(-2)[0];
    return await (await fetch(`${location.origin}/api/problems/${problemId}/tags`)).json();
}

let button = null;

async function showProblemTags(){
    let tags = (await getTags()).map(t=>{
        let a = document.createElement("a");
        a.href = `https://arena.olimpiici.com/#/tag/${t.id}/view`;
        a.innerHTML = t.title;
        let li = document.createElement("li");
        li.appendChild(a);
        return li;
    });
    let ul = document.createElement("ul");
    tags.forEach(e=>ul.appendChild(e));

    button.replaceWith(ul);
};

let divSelector = "body > jhi-main > div.container-fluid > div > jhi-problem-in-competition > div > div > div"

function createButton(){
    button = document.createElement("button");
    button.classList.add("btn");
    button.style.marginTop = "15px"
    button.innerHTML = "Show Tags";
    button.addEventListener("click", showProblemTags);
    document.querySelector(divSelector).appendChild(button);
}

function launch(){
    createButton();
    log("Created button for showing tags.");
}

let waitingInterval = null;
function waitForDiv(){
    if(document.querySelector(divSelector)){
        launch();
        if(waitingInterval){ clearInterval(waitingInterval); }
    }else{
        waitingInterval = setTimeout(waitForDiv, 500);
    }
}

const hashRegex = /^#\/catalog\/\d+\/problem\/\d+$/;
if(hashRegex.test(location.hash)){
    log("waiting for page to load...");
    waitForDiv();
}
