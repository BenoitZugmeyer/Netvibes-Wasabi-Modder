
var tabs = require("tabs");

var script = '{{ compress netvibes.js }}';

var css = '{{ compress netvibes.css }}';


tabs.onReady = function(tab) {
    var location = tab.location;
    var privatepage = /^http:\/\/(www\.)?netvibes.com\/privatepage\//;
    if(privatepage.test(location)) {
        var document = tab.contentDocument,
            window = tab.contentWindow;
        if(document.getElementById('modder_script')) return;

        var el = document.createElement('script');
        el.type = 'text/javascript';
        el.textContent = script;
        el.id = 'modder_script';
        document.body.appendChild(el);

        el = document.createElement('style');
        el.type = 'text/css';
        el.textContent = css;
        document.body.appendChild(el);
    }
}
