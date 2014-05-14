var DEFAULT_SETTINGS = {
    maxSize: 4,
    ghostCards: true,
    labelCards: true,
	showCardNumbers: false
}

var settings = DEFAULT_SETTINGS;
var boardId = undefined;
var currentTab = undefined;


//make sure the page action is shown when a trello url is opened
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    currentTab = tabId;
    trelloScrumUrlSpecificActions(tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        currentTab = tab.id;
        trelloScrumUrlSpecificActions(tab);
    });
});

function trelloScrumUrlSpecificActions(tab) {
    showSettingsIcon(tab);
    applySettings(tab);
}

function getTrelloLocation(url) {
    if (url.indexOf('https://trello.com/b/') === 0) {
        return "board";
    }
    if (url.indexOf('https://trello.com/c/') === 0) {
        return "card";
    }
    else {
        return "other";
    }
}

function getBoardId(url) {
    var location = getTrelloLocation(url);
    try {
        if (location === "board") {
            return url.match(/trello.com\/b\/[^\/]+\/([0-9a-f]+)/)[1];
        }
        else {
            return url.match(/trello.com\/c\/[^\/]+\/([0-9a-f]+)/)[1];
        }
    } catch (e) {
        throw new Error("can't get board id from '" + url + "'");
    }
}

function applySettings(tab) {
    if (getTrelloLocation(tab.url) !== "other") {
        boardId = getBoardId(tab.url);
        if (!localStorage[boardId]) {
            settings = DEFAULT_SETTINGS;
            localStorage[boardId] = JSON.stringify(settings);
        } else {
            settings = JSON.parse(localStorage[boardId]);
        }
        chrome.tabs.sendMessage(tab.id, {type: "settings", content: settings, forBoard: boardId });
    }
}

function showSettingsIcon(tab) {
    //don't show the icon on settings pages or non-trello pages
    if (getTrelloLocation(tab.url) !== "other") {
        chrome.pageAction.show(tab.id);
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "getSettings") {
        sendResponse(settings);
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "settingUpdated") {
        settings[message.name] = message.value;
        localStorage[boardId] = JSON.stringify(settings);
        chrome.tabs.sendMessage(currentTab, {type: "settings", content: settings });
    }
});