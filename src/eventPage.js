N_tab_history_keep = 10;

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
//var n = 15;
//var ring = new RingStore(n);
//for (var i=0; i<6; ++i) {
//    ring.addItem(i);
//}
//for (var i=0; i<20; ++i) {
//    ring.addItem(i*i);
//}
//ring.removeItem(49);
//ring.removeItem(100);
//ring.removeItem(225);
//ring.removeItem(64);
//ring.removeItem(36);
//ring.removeItem(121);
//ring.removeItem(81);
//ring.addItem("A");
//ring.addItem("B");
//ring.addItem("C");
//console.log(ring.data);
//console.log(ring.iStart);
//console.log(ring.iEnd);
//console.log(ring.length);



function updateIcon(tabId, changeInfo, tab) {
    chrome.tabs.query({},
        function(tabs){

            var ntabs = tabs.length;
            var ntabs_str = ntabs.toString();
            var ntabs_warn = 100;

            chrome.browserAction.setBadgeText({text: ntabs_str});
            chrome.browserAction.setBadgeBackgroundColor({color:
                [Math.floor(Math.min(1.0, ntabs/ntabs_warn)*255), 60, Math.floor(Math.min(1.0, ntabs_warn/ntabs)*255), 127]});
        });
}

//function initTabList() {
//    tabList = [];
//    chrome.tabs.query({},
//        function(tabs){
//            var ntabs = tabs.length;
//            for (tab in tabs) {
//                tabList.push(tab.url, tab.title, tab.favIconUrl, tab.Loading, tab.incognito, tab.id, tab.index, tab.windowId, tab.active);
//            }
//        });
//}

function recordRecentTabs(activeInfo) {
    chrome.storage.local.get({"tabHistory": []},
        function(items) {
            chrome.storage.local.get({"tabRemoved": -1},
                function(removed) {
                    var ringHistory = new RingStore(N_tab_history_keep);
                    var arr = items["tabHistory"];
                    if (arr.length > 0) {
                        ringHistory.fromArray(arr);
                        ringHistory.removeItem(activeInfo.tabId);
                        if (removed["tabRemoved"] != -1) {
                            ringHistory.removeItem(removed["tabRemoved"]);
                        }
                    }
                    ringHistory.addItem(activeInfo.tabId);
                    chrome.storage.local.set({"tabHistory": ringHistory.flatten()});
                });
        });
}

function removeFromRecentTabs(tabId, removeInfo) {
    chrome.storage.local.set({"tabRemoved": tabId});
}


chrome.tabs.onCreated.addListener(updateIcon);
chrome.tabs.onRemoved.addListener(updateIcon);
chrome.tabs.onReplaced.addListener(updateIcon);

chrome.tabs.onActivated.addListener(recordRecentTabs);
chrome.tabs.onRemoved.addListener(removeFromRecentTabs);

updateIcon();
