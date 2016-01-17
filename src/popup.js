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
    document.getElementById("listContainer").addEventListener("click", gotoTab);
    document.getElementById("listContainerRecent").addEventListener("click", gotoTab);
    //document.getElementById("listContainer").addEventListener('mousemove', processCapture);
});



function doSearch() {
    chrome.tabs.query({},
        function(tabs){
            var max_length = 120;
            var max_title_length = 60;

            var text_search_tokens = document.getElementById("searchTab").value.toLowerCase().split(" ");
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

                    var countHist = 0, countOther = 0;

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
                        } else {
                            listContainer.appendChild(div);
                            countOther += 1;
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
                        separator.parentNode.removeChild(separator);
                    }
                });
        });
}


function gotoTab() {
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
    if (chosenNode) {
        chrome.tabs.update(chosenNode.value[0], {active: true});
        chrome.windows.update(chosenNode.value[1], {focused: true});
    }
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


N_tab_history_keep = 5;

function RingStore(n) {
    if (n < 3) {
        this.N = 3;
    } else {
        this.N = n;
    }

    this.data = new Array(this.N);
    this.iStart = this.N;
    this.iEnd = this.N-1;
    this.iCurrent = this.N-1;
    this.length = 0;

    this.addItem = function (item) {
        this.iStart -= 1;
        if (this.iStart < 0) {
            this.iStart = this.N-1;
        }
        this.data[this.iStart] = item;
        if (this.iStart == this.iEnd) {
            this.iEnd -= 1;
            if (this.iEnd < 0) {
                this.iEnd = this.N-1;
            }
        }
        this.iCurrent = this.iStart;
        this.length += 1;
        if (this.length > this.N) {
            this.length = this.N;
        }
    };

    this.fromArray = function (arr) {
        if (arr.constructor === Array) {
            if (arr.length > 0) {
                this.iStart = this.N;
                this.iEnd = this.N-1;
                this.iCurrent = this.N-1;
                this.length = 0;
                for (var i=arr.length-1; i>=0; --i) {
                    this.addItem(arr[i]);
                }
            }
        }
    };

    this.replaceItem = function (idx, item) {
        this.assert();
        var i = transIdx(idx);
        this.data[i] = item;
    };

    this.removeItem = function (item) {
        this.assert();
        this.iCurrent = this.iStart-1;
        for (var i=0; i < this.length; ++i) {
            if (this.nextItem() === item) {
                var idx = this.iCurrent;
                if (this.iStart <= idx) {
                    for (var j=idx-1; j>=this.iStart; --j) {
                        this.data[j+1] = this.data[j];
                    }
                    this.iStart += 1;
                    if (this.iStart >= this.N) {
                        this.iStart = 0;
                    }
                } else {
                    for (var j=idx+1; j<=this.iEnd; ++j) {
                        this.data[j-1] = this.data[j];
                    }
                    this.iEnd -= 1;
                    if (this.iEnd < 0) {
                        this.iEnd = this.N-1;
                    }
                }
                this.iCurrent = this.iStart;
                this.length -= 1;
                if (this.length < 0) {
                    this.length = 0;
                }
                return;
            }
        }
    };

    this.transIdx = function (idx) {
        var i = idx + this.iStart;
        if (i >= this.N) {
            i -= this.N;
        }
        this.assertIdx(i);
        return i;
    }

    this.getItem = function (idx) {
        this.assert();
        return this.data[this.transIdx(idx)];
    };

    this.firstItem = function () {
        this.assert();
        return this.data[this.iStart];
    };

    this.lastItem = function () {
        this.assert();
        return this.data[this.iEnd];
    };

    this.nextItem = function () {
        this.assert();
        var idx = this.iCurrent + 1;
        if (idx >= this.N) {
            idx = 0;
        }
        this.iCurrent = idx;
        return this.data[idx];
    };

    this.assert = function() {
        if (this.iStart == this.N) {
            throw "No item in the storeage!";
        }
    };

    this.assertIdx = function(idx) {
        var valid_cases = 
           ((this.iStart < this.iEnd) && (this.iStart <= idx) && (idx <= this.N)) || 
           ((this.iStart > this.iEnd) && (0 <= idx) && (idx <= this.N));
        if (!valid_cases) {
            console.log(idx, this.iStart, this.iEnd, this.length, this.N);
            throw "Invalid index!";
        }
    };

    this.flatten = function () {
        if (this.length == 0) {
            return [];
        }
        var fData = new Array(this.length);
        for (var i=0; i < this.length; ++i) {
            fData[i] = this.data[this.transIdx(i)];
        }
        return fData;
    };
}



// Test
var n = 5;
var ring = new RingStore(n);
ring.addItem(1);
ring.addItem(2);
ring.addItem(3);
ring.addItem(4);
ring.addItem(5);
ring.addItem(6);
//ring.removeItem(49);
//ring.removeItem(100);
//ring.removeItem(225);
//ring.removeItem(64);
//ring.removeItem(36);
//ring.removeItem(121);
//ring.removeItem(81);
console.log(ring.data);
console.log(ring.flatten());
console.log(ring.iStart);
console.log(ring.iEnd);
console.log(ring.length);
