document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({currentWindow: true},
        function(tabs){
            var ntabs = tabs.length;
            document.getElementById("thisWindow").innerHTML = "Number of tabs opened in this window: " + ntabs.toString();
        });
    chrome.tabs.query({},
        function(tabs){
            var ntabs = tabs.length;
            document.getElementById("totalNum").innerHTML = "Number of tabs opened in Chrome: " + ntabs.toString();
        });
});
