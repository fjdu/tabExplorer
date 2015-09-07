function updateIcon(tabId, changeInfo, tab) {
    chrome.tabs.query({},
        function(tabs){
            var icon_size = 19;

            var canvas = document.createElement('canvas');
            canvas.id     = "NewIcon";
            canvas.width  = icon_size; //https://developer.chrome.com/extensions/browserAction
            canvas.height = icon_size;

            var ctx = canvas.getContext("2d");
            ctx.rect(0, 0, icon_size, icon_size);
            ctx.fillStyle="rgb(255,222,255)";
            ctx.fill();
            ctx.font="10px Georgia";  //http://www.w3schools.com/tags/canvas_filltext.asp

            var ntabs = tabs.length;
            var ntabs_max = 150;
            var val_r = Math.round(Math.min(1.0, ntabs / ntabs_max) * 255);
            var val_b = Math.round(val_r/2);
            var val_g = 90;
            ctx.fillStyle = "rgb(" + val_r.toString() + "," + val_g.toString() + "," + val_b.toString() + ")";

            ctx.textAlign="center";
            ctx.textBaseline="middle";

            var ntabs_str = ntabs.toString();
            var icenter = Math.round(icon_size/2);
            ctx.fillText(ntabs_str, icenter, icenter);

            //console.log(val_r, val_g, val_b);
            //console.log(ctx.fillStyle);

            var img_data = ctx.getImageData(0, 0, icon_size, icon_size);
            chrome.browserAction.setIcon({imageData: img_data});
        });
}

chrome.tabs.onCreated.addListener(updateIcon);
chrome.tabs.onRemoved.addListener(updateIcon);
chrome.tabs.onReplaced.addListener(updateIcon);

updateIcon();
