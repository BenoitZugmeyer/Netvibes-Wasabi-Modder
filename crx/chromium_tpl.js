/*
{{ text README }}
*/

(function() {
    if(document.getElementById('modder_script')) return;

    var script = '{{ compress netvibes.js }}';
    var css = '{{ compress netvibes.css }}';

    var el = document.createElement('script');
    el.type = 'text/javascript';
    el.textContent = script;
    el.id = 'modder_script';
    document.body.appendChild(el);

    el = document.createElement('style');
    el.type = 'text/css';
    el.textContent = css;
    document.body.appendChild(el);
})();
