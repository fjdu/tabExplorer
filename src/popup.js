searchStr_prev = null;

nKeyDown = 0;

tabChosen_now = null;

document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({currentWindow: true},
        function(tabs){
            var ntabs = tabs.length;
            document.getElementById("thisWindow").innerHTML = ntabs.toString();
        });
    chrome.tabs.query({},
        function(tabs){
            var ntabs = tabs.length;
            document.getElementById("totalNum").innerHTML = ntabs.toString();
        });

    doSearch();

    document.getElementById("searchTab").addEventListener("keyup", doSearch);
    document.getElementById("listContainer").addEventListener("mousemove", onMouseMove);
    document.getElementById("listContainerRecent").addEventListener("mousemove", onMouseMove);
    document.getElementById("listContainer").addEventListener("click", processMouseClick);
    document.getElementById("listContainerRecent").addEventListener("click", processMouseClick);
    //document.getElementById("listContainer").addEventListener('mousemove', processCapture);
});


function doSearch(e) {

    searchStr = document.getElementById("searchTab").value.toLowerCase();
    if (searchStr == searchStr_prev) {
        processKeyPress(e);
        return;
    }

    searchStr_prev = searchStr;

    nKeyDown = 0;
    tabChosen_now = null;

    tabList_hist = [];
    tabList_other = [];
    countHist = 0;
    countOther = 0;

    chrome.tabs.query({},
        function(tabs){
            var max_length = 120;
            var max_title_length = 60;

            var text_search_tokens = searchStr.split(" ");
            console.log(text_search_tokens);

            // Clear the previous tab list.
            var divs = document.getElementsByClassName("tabInfo");
            while (divs.length > 0) {
                divs[0].parentNode.removeChild(divs[0]);
            }

            chrome.storage.local.get({"tabHistory": []}, function(items){

                    tabHistory = items["tabHistory"];
                    console.log(tabHistory);

                    var listContainer = document.getElementById("listContainer");
                    var listContainerRecent = document.getElementById("listContainerRecent");

                    var ntabs = tabs.length;

                    for (var i=ntabs-1; i>=0; --i) {
                        var thisTab = tabs[i];

                        var url = thisTab.url;
                        var title = thisTab.title;

                        var iUrl = [], iTitle = [];
                        var notFound = false;

                        if (text_search_tokens.length >= 1) {
                            for (var iMatch=0; iMatch<text_search_tokens.length; ++iMatch) {
                                iUrl.push(url.toLowerCase().search(text_search_tokens[iMatch]));
                                iTitle.push(title.toLowerCase().search(text_search_tokens[iMatch]));
                                if ((iUrl[iMatch] == -1) && (iTitle[iMatch] == -1)) {
                                    notFound = true;
                                    break;
                                }
                            }
                        }

                        if (notFound) {
                            continue;
                        }

                        //urlDisp.setAttribute("style", "vertical-align: middle;");
                        //urlDisp.size = 40;

                        var div = document.createElement("div");
                        div.className = "tabInfo"

                        div.value = [thisTab.id, thisTab.windowId];

                        var favIcon = document.createElement("img");
                        favIcon.className = "favIcon";
                        favIcon.width = 15;
                        var favIconUrl = thisTab.favIconUrl;
                        //console.log(favIconUrl);
                        if ((typeof(favIconUrl) != "undefined") && (favIconUrl.substring(0,6) != "chrome")) {
                            favIcon.src = favIconUrl;
                        } else {
                            //favIcon.src = "";
                            //favIcon.style.display = "";
                        }
                        div.appendChild(favIcon);

                        var urlDisp = document.createElement("input");
                        urlDisp.className = "urlDisp";
                        div.appendChild(urlDisp);
                        urlDisp.type = "text";
                        urlDisp.readOnly = true;

                        var url_short = url.length <= max_length ? url : url.substring(0,max_length) + "...";
                        var title_short = title.length <= max_title_length ? title : title.substring(0, max_title_length);

                        urlDisp.value = title_short + ": " + url_short;
                        urlDisp.setAttribute("style", "width: 280px;");
                        //urlDisp.setAttribute("style", "z-index: 0;");

                        var inHistory = false;
                        for (var j=0; j < tabHistory.length; ++j) {
                            if (tabHistory[j] == thisTab.id) {
                                inHistory = true;
                                break;
                            }
                        }
                        if (inHistory) {
                            listContainerRecent.appendChild(div);
                            countHist += 1;
                            tabList_hist.push(div);
                        } else {
                            listContainer.appendChild(div);
                            countOther += 1;
                            tabList_other.push(div);
                        }
                    }

                    var separator = document.getElementById("separator");
                    if ((countHist > 0) && (countOther > 0)) {
                        if (!separator) {
                            var separator = document.createElement('hr');
                            separator.id = "separator";
                            document.getElementById("separatorContainer").appendChild(separator);
                        }
                    } else {
                        if (separator) {
                            separator.parentNode.removeChild(separator);
                        }
                    }
                });
        });
}



function processKeyPress(e) {
    var key = e.which || e.keyCode;
    var DOWN = 40, UP = 38, ENTER = 13;

    if (key == ENTER) {

        if ((countHist + countOther) == 0) {
            return;
        }

        if (tabChosen_now == null) {
            var iDiv = nKeyDown;
            nKeyDown = 0;
            if (iDiv > 0) {
                iDiv -= 1;
            }
            if (iDiv < countHist) {
                tabChosen_now = tabList_hist[iDiv];
            } else {
                iDiv -= countHist;
                tabChosen_now = tabList_other[iDiv];
            }
        }
        chrome.tabs.update(tabChosen_now.value[0], {active: true});
        chrome.windows.update(tabChosen_now.value[1], {focused: true});
        return;
    }

    var updown = false;
    if (key == DOWN) {
        updown = true;
        nKeyDown += 1;
    } else if (key == UP) {
        updown = true;
        nKeyDown -= 1;
    }

    if (updown) {
        if (nKeyDown < 0) {
            nKeyDown += (countHist + countOther + 1);
        }
        if (nKeyDown > (countHist + countOther)) {
            nKeyDown -= (countHist + countOther);
        }
        if (nKeyDown == 0) {
            nKeyDown = countHist + countOther;
        }
        var iDiv = nKeyDown - 1;
        var chosenTab;
        if (iDiv < countHist) {
            chosenTab = tabList_hist[iDiv];
        } else {
            chosenTab = tabList_other[iDiv-countHist];
        }
    console.log(nKeyDown, iDiv, countHist, countOther);

        if (tabChosen_now != null) {
            unHighlightTab(tabChosen_now);
        }
        tabChosen_now = chosenTab;

        highlightTab(chosenTab);
        chosenTab.scrollIntoView(false);
    }
}


function getTabAtPointer() {
    var x = event.clientX,
        y = event.clientY,
        elementMouseIsOver = document.elementFromPoint(x, y);
    var chosenNode;
    if (elementMouseIsOver.className == "tabInfo") {
        chosenNode = elementMouseIsOver;
    } else if (elementMouseIsOver.parentNode.className == "tabInfo") {
        chosenNode = elementMouseIsOver.parentNode;
    } else {
        chosenNode = false;
    }
    return chosenNode;
}


function processMouseClick() {
    var chosenNode = getTabAtPointer();
    if (chosenNode) {
        chrome.tabs.update(chosenNode.value[0], {active: true});
        chrome.windows.update(chosenNode.value[1], {focused: true});
    }
}


function onMouseMove() {
    var chosenNode = getTabAtPointer();
    if (chosenNode) {
        if (tabChosen_now != null) {
            if (tabChosen_now != chosenNode){
                unHighlightTab(tabChosen_now);
                tabChosen_now = chosenNode;
                highlightTab(chosenNode);
            }
        } else {
            tabChosen_now = chosenNode;
        }
    }
}


function highlightTab(t) {
    t.style.borderWidth = "1px";
    t.style.borderStyle = "solid";
    t.style.borderColor = "rgb(230,160,0)";
}

function unHighlightTab(t) {
    t.style.borderWidth = "0px";
}

/*
function processCapture(e) {
    var elementMouseIsOver = e.srcElement;
    var chosenNode;
    if (elementMouseIsOver.className == "tabInfo") {
        chosenNode = elementMouseIsOver;
    } else if (elementMouseIsOver.parentNode.className == "tabInfo") {
        chosenNode = elementMouseIsOver.parentNode;
    } else {
        chosenNode = false;
    }
    if (chosenNode) {
        var tabId = chosenNode.value[0];
        chrome.tabCapture.capture(tabId, {"format": "png"}, drawCapture);
    }
}

function drawCapture(dataUrl) {
    var imgCap = document.createElement("img");
    imgCap.src = dataUrl;
}
*/
