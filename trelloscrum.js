(function () {
    "use strict";
    var mutationListeners = [];
    var MAX_SIZE = 4;

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.type === "settings") {
            applySettings(message.content);
        }
    });

    chrome.runtime.sendMessage({type: "getSettings"}, function (response) {
        applySettings(response);
    });

    function applySettings(settings) {
        if (settings.ghostCards) {
            document.body.classList.add("trelloScrum-ghostCards-enabled");
        } else {
            document.body.classList.remove("trelloScrum-ghostCards-enabled");
        }
        if (settings.labelCards) {
            document.body.classList.add("trelloScrum-labelCards-enabled");
            document.body.classList.remove("trelloScrum-labelCards-disabled");
        } else {
            document.body.classList.add("trelloScrum-labelCards-disabled");
            document.body.classList.remove("trelloScrum-labelCards-enabled");
        }
        if(settings.showCardNumbers) {
            showCardNumbers();
        } else {
            removeCardNumbers();
        }
        if (!isNaN(settings.maxSize*1)) {
            MAX_SIZE = settings.maxSize*1;
            $(".trelloScrum-points").each(function() {
                if (this.innerText*1 > MAX_SIZE) {
                    this.classList.add("trelloScrum-big");
                } else {
                    this.classList.remove("trelloScrum-big");
                }
            });
        }
    }

    //******************************************************************************************************************
    //  A method that allows you to register a callback that is called whenever the text of a specific element changes
    //    nodetype: a lowercase node type (a, h2, div etc.) is used to speed up the listener
    //    selector: the jquery selector to indicate the exact element you are looking for
    //    callback: a callback that is called whenever the text changes and once at the start
    //******************************************************************************************************************

    //a listener for when certain elements are added and removed
        //registers the text change listener to those elements
        //and removes it in time

    function TextChangeListener(nodeType, selector, callback) {
        var self = this;
        self.registered = [];
        self.callback = function () {
            //remove this pointer to the TextChangeListener, it is not needed
            callback.apply(null, arguments);
        }
        $(selector).map(function () {
            self.callback(this);
        })
        mutationListeners.push(new MutationSummary({
            queries: [{ element: nodeType }],
            callback: function elementUpdate(summaries) {
                summaries[0].added.map(function (elm) {
                    if ($(elm).is(selector)) {
                        self.registerElement(elm);
                    }
                })
            }
        }));
    }
    TextChangeListener.prototype.registerElement = function (elm) {
        var self = this;
        if (self.registered.indexOf(elm) === -1) {
            self.registered.push(elm);
            mutationListeners.push(new MutationSummary({
                rootNode: elm,
                queries: [{ characterData: true }],
                callback: function charData(newData) {
                    function directChildElmIn (property) {
                        return newData[0][property].filter(function (textElm) { return textElm.parentElement === elm; }).length > 0;
                    }

                    if (directChildElmIn("added") || directChildElmIn("removed") || directChildElmIn("valueChanged")) {
                        self.callback(elm);
                    }
                }
            }));
            self.callback(elm);
        }
    }

    //******************************************************************************************************************
    //  A method for showing the point totals in the list header
    //******************************************************************************************************************
    function initList(list) {
        $(list).prepend("<span class='trelloScrum-pointsTotal'></span>");
    }

    $("div.list-header").map(function () {
        initList(this);
    })

    mutationListeners.push(new MutationSummary({
        queries: [{ element: "div.list-header" }],
        callback: function (summaries) {
            summaries[0].added.map(initList);
        }
    }));

    function recalcList($listElm) {
        //recalc list Total
        var pointsLabel = $listElm.find(".js-list-header .trelloScrum-pointsTotal");
        if (pointsLabel.length === 0) {
            pointsLabel = $("<span class='trelloScrum-pointsTotal'></span>");
            $listElm.find(".js-list-header").prepend(pointsLabel);
        }
        var total = $listElm.find(".trelloScrum-points:not(.trelloScrum-questionMark)").toArray().reduce(function (a,b) { return a + b.innerText*1}, 0);
        var roundedTotal = Math.round(total*10)/10;
        if ($listElm.find(".trelloScrum-questionMark").length > 0) {
            roundedTotal += "?";
        }
        pointsLabel.text(roundedTotal);
        var ghostLabel = $listElm.find(".js-list-header .trelloScrum-ghostTotal");
        if (ghostLabel.length === 0) {
            ghostLabel = $("<span class='trelloScrum-ghostTotal'></span>");
            $listElm.find(".js-list-header").prepend(ghostLabel);
        }
        var total = $listElm.find(".trelloScrum-ghostcard").length;
        ghostLabel.text(total ? total : "");
    }

    mutationListeners.push(new MutationSummary({
        queries: [{ element: "div.list-card" }],
        callback: function (newData) {
            var lists,
                elements = newData[0].reparented.concat(newData[0].removed);
            lists = elements.map(function (elm) { return $(elm).closest(".list")});
            lists = lists.concat(elements.map(function (elm) { return $(newData[0].getOldParentNode(elm)).closest(".list"); }))
            lists.map(recalcList);
        }
    }));

    mutationListeners.push(new MutationSummary({
        queries: [{ element: "span.card-label" }],
        callback: function elementUpdate(newData) {
            newData[0].reparented.concat(newData[0].removed).map(function (elm) {
                var labelContainer = newData[0].getOldParentNode(elm);
                var card = newData[0].getOldParentNode(labelContainer);
                if (card.classList.contains("trelloScrum-seperator")) {
                    var color;
                    if (elm.classList.contains("card-label-green")){
                        color = "green";
                    } else if (elm.classList.contains("card-label-yellow")){
                        color = "yellow";
                    } else if (elm.classList.contains("card-label-orange")){
                        color = "orange";
                    } else if (elm.classList.contains("card-label-red")){
                        color = "red";
                    } else if (elm.classList.contains("card-label-purple")){
                        color = "purple";
                    } else if (elm.classList.contains("card-label-blue")){
                        color = "blue";
                    }
                    $(card).removeClass("trelloScrum-seperator-" + color);
                }
            });
            newData[0].added.map(function (elm) {
                var color;
                if (elm.classList.contains("card-label-green")){
                    color = "green";
                } else if (elm.classList.contains("card-label-yellow")){
                    color = "yellow";
                } else if (elm.classList.contains("card-label-orange")){
                    color = "orange";
                } else if (elm.classList.contains("card-label-red")){
                    color = "red";
                } else if (elm.classList.contains("card-label-purple")){
                    color = "purple";
                } else if (elm.classList.contains("card-label-blue")){
                    color = "blue";
                }
                $(elm).closest(".list-card").addClass("trelloScrum-seperator-" + color);
            });
        }
    }));
    $("div.card-label").map(function () {
        var color;
        if (this.classList.contains("card-label-green")){
            color = "green";
        } else if (this.classList.contains("card-label-yellow")){
            color = "yellow";
        } else if (this.classList.contains("card-label-orange")){
            color = "orange";
        } else if (this.classList.contains("card-label-red")){
            color = "red";
        } else if (this.classList.contains("card-label-purple")){
            color = "purple";
        } else if (this.classList.contains("card-label-blue")){
            color = "blue";
        }
        $(this).closest(".list-card").addClass("trelloScrum-seperator-" + color);
    });

    //******************************************************************************************************************
    //  Track list titles and show lists differently if they end if (B) or (D) (for Backlog and done)
    //******************************************************************************************************************
    new TextChangeListener("h2", "h2.js-list-name", function (elm) {
        var title = elm.innerText.trim(),
            list = $(elm).closest(".list"),
            stateID = title.substr(-3);

        if (stateID === "(B)" || stateID === "(D)") {
            list.addClass("trelloScrum-inactive")
        } else {
            list.removeClass("trelloScrum-inactive")
        }
    });

    //******************************************************************************************************************
    //  Track card titles and show their point total or change them into a seperator
    //******************************************************************************************************************
    var findStorypoints = /\((\x3f|\d*\.?\d+)\)/;

    function isSeperator(title) {
        return (title.substr(0,3) === "***" && title.substr(-3) === "***") || title.substr(0,2) === "# ";
    }

    function hasPoints(title) {
        return title.search(findStorypoints) !== -1;
    }

    function updatePoints($card, title) {
        var pointsLabel = $card.find(".trelloScrum-points");
        if (pointsLabel.length === 0) {
            pointsLabel = $("<div class='trelloScrum-points'></div>");
            $card.prepend(pointsLabel)
        }
        if (hasPoints(title)) {
            var points = title.match(findStorypoints)[1];
            pointsLabel.toggleClass("trelloScrum-questionMark", points === "?")
                .toggleClass("trelloScrum-big", points > MAX_SIZE)
                .text(points);
            $card.removeClass("trelloScrum-ghostcard");
        } else {
            pointsLabel.text("")
                .removeClass("trelloScrum-questionMark")
                .removeClass("trelloScrum-big");
            $card.addClass("trelloScrum-ghostcard");
        }
    }

    //track card-titles
    new TextChangeListener("a", "a.js-card-name", function (elm) {
        var title = elm.innerText.trim(),
            $card = $(elm).closest(".list-card");

        if (isSeperator(title)) {
            $card.addClass("trelloScrum-seperator");
            $card.removeClass("trelloScrum-ghostcard");
            $card.find(".trelloScrum-points")
                .removeClass("trelloScrum-questionMark")
                .removeClass("trelloScrum-big")
                .text("");
        } else {
            $card.removeClass("trelloScrum-seperator");
            updatePoints($card, title);
        }
        recalcList($(elm).closest(".list"))
    });

    //******************************************************************************************************************
    //  Show the edit information button more prominently
    //******************************************************************************************************************
    function makeDescButtonMoreVisible(descBtn) {
        descBtn.appendChild ($("<span class='board-header-btn-text'>Project info</span>")[0]);
    }

    $(".js-open-desc").map(function () {
        makeDescButtonMoreVisible(this);
    })

    mutationListeners.push(new MutationSummary({
        queries: [{ element: ".desc-btn" }],
        callback:     function (newData) {
            newData[0].added.map(makeDescButtonMoreVisible);
        }
    }));

    //******************************************************************************************************************
    //  Display the ticket numbers if they are not seperator labels
    //******************************************************************************************************************
    function showCardNumbers() {
        $(".card-short-id").each(function(){
            if(!(($(this).parent().html().indexOf("***")) > - 1)) {
                $(this).removeClass("hide").addClass("shownCardNumber")
            }
        });
    }

    function removeCardNumbers() {
        $(".card-short-id").removeClass("shownCardNumber").addClass("hide");
    }
}());