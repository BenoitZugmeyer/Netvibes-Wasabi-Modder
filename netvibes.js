
var $, $$, App, Fx, _;


window.addEvent('domready', function() {
    var reader = App.SmartReader,
        o_loadIframe = reader.Feed.loadIframe.bind(reader.Feed);

    reader.Feed.loadIframe = function(C) {
        var f = reader.UI.Feeds.iFrame,
            src;
        if(f && f.sandbox) {
            f.destroy();
            reader.UI.Feeds.iFrame = null;
        }
        try {
            o_loadIframe(C);
        } catch(e) {
            console.log(e);
        }

        f = reader.UI.Feeds.iFrame;
        src = f.get('src');
        if(src.match(/^http:\/\/t37\.net/) || src.match(/FredericDeVillamilcom/)) {
            f.set('sandbox', 'allow-scripts allow-forms allow-same-origin');
        }
    };


    function makeToggleTop() {
        var topdiv = $('top'),
            addlink = $('addContentLink'),
        // Full height of the top bar
            height = addlink.getSize().y,

        // Animates the top menu on open / close
            fx = new Fx.Tween(topdiv),
            out = true,
            toggle = function() {
                fx.start('top', out ? -height : 0);
                button.set('class', out ? 'out': 'in');
                out = !out;
            },
        // Create the toggle button
            button = new Element('div', {
                id: 'topbar-button',
                'class': 'out',
                events: {
                    click: toggle
                }
            })
                .inject(topdiv);

        // Change the margin bottom of the top bar to make content positionning
        // on top of the page
        topdiv.setStyle('margin-bottom', -height);
        fx.set('top', -height);
        toggle();

        // Close the top menu on clicking the 'addContentLink'
        addlink.addEvent('click', function() { out = true; toggle(); });
    }

    function handleFilter() {
        var filterButton = $('smartreader-feeds-showFilter').getElement('a'),
            o_filterFct = filterButton.retrieve('events').click.keys[0],
            dummySpan = new Element('span', {
                text: parseInt(App.pageCustom.smartreader.onlyUnread) ?
                    _('Show all items') :
                    _('Show only unread items')
            }),
            filterToggle = function() {
                var text = dummySpan.get('text');
                filterButton.set({
                    title: text,
                    id: text == _('Show only unread items') ?
                        'display-unread' : 'display-all'
                });
            };
        filterButton
            .removeEvent('click', o_filterFct)
            .addEvent('click', function() {
                o_filterFct.apply(dummySpan);
                filterToggle();
            });

        filterToggle();
    }

    function scrollbarFix() {
        /*
        Fix for chromium (at least) :
        it does not preserve srcoll postion on hiding sidebar
        */
        if(!Browser.Engine.webkit) return;
        var o_displaySideBar = reader.UI.sidebarHandler
            .retrieve('events').mouseenter.keys[0],
            o_hideSideBar =
                reader.UI.sidebar.retrieve('events').mouseleave.keys[0],
            container = document.getElement('.nv-treeview-container'),
            scroll = 0;

        reader.UI.sidebarHandler
            .removeEvent('mouseenter', o_displaySideBar)
            .addEvent('mouseenter', function() {
                o_displaySideBar();
                container.scrollTo(0, scroll);
            });

        reader.UI.sidebar
            .removeEvent('mouseleave', o_hideSideBar)
            .addEvent('mouseleave', function() {
                scroll = container.getScroll().y;
                o_hideSideBar();
            });
    }


    function makeSmartReader() {
        if(!$('smartreader-container')) return;
        // Put the buttons in the headerTop
        var c = $('smartreader-feeds-headerBottom').getChildren(),
            viewSwitcher;
        c.reverse();
        c.inject($('smartreader-feeds-headerTop').getChildren()[0], 'after');
        $('smartreader-feeds-headerTop').getElements('a').each(function(el) {
            el.set('title', el.get('text'));
        });

        $('smartreader-feeds-markRead-dropdown').destroy();
        //$('smartreader-feeds-markUnread').destroy();

        viewSwitcher = $('smartreader-feeds-headerViewSwitcher')
            .inject($('top').getElement('.right'), 'top');

        viewSwitcher.getElement('.separator').inject(viewSwitcher, 'after');
        viewSwitcher.getElement('.separator').destroy();

        handleFilter();
        scrollbarFix();
    }

    function handleResize() {
        if(!App.SmartReader.UI) return;
        var o_resizeApp = reader.resizeApp.bind(reader),
            resize,
            srMain = App.SmartReader.UI.Feeds.main;

        reader.resizeApp = function() {
            var scsize = srMain.getScroll(), winheight;
            o_resizeApp();
            winheight = window.getSize().y;
            this.UI.Feeds.main
                .setStyle('height', winheight - this.UI.Feeds.main.getOffsets().y);
            this.UI.Feeds.container
                .setStyle('max-height',
                    winheight - this.UI.Feeds.container.getOffsets().y - 10);
            srMain.scrollTo(scsize.x, scsize.y);
        };

        resize = reader.resizeApp.bind(reader);

        window
            .removeEvents('resize')
            .removeEvents('load')
            .addEvents({
                resize: resize,
                load: function() {
                    resize();
                    resize.delay(1000);
                }
            });

        resize();
    }

    function makeTabs() {
        var divTabs = $('divTabs'),
            toggler, ul, hidden;

        if(!divTabs) return;

        ul = divTabs.getElement('ul');
        if(!ul) return;

        function toggle() {
            [ul, $('aNewTab')].each(function(el) {
                el.toggle();
            });
            hidden = ul.getStyle('display') == 'none';
            toggler.set('text', hidden ? '>' : '<');
            Cookie.write('NWM_HideTabs', hidden ? 'yes' : 'no', {duration: 365});
        }


        toggler = new Element('div', {
            id: 'tabsToggler',
            text: '<'
        })
            .inject(divTabs, 'top')
            .addEvent('click', toggle);

        hidden = Cookie.read('NWM_HideTabs');
        if(hidden == 'yes') {
            toggle();
        }
    }

    function redefine(o, fct, cb) {
//         console.log(o, fct, o[fct]);
        var old = o[fct].bind(o);
        o[fct] = cb(old);
    }

    function fullScreenOnWebView() {
        var srFeed = App.SmartReader.Feed,
            srMain = App.SmartReader.UI.Feeds.main;

        function doStuff(entry) {
            var scsize = srMain.getScroll();
            srMain.setStyle('overflow-y', 'hidden');
            srMain.scrollTo(scsize.x, scsize.y);
            reader.resizeApp();
        }

        function stopStuff() {
            srMain.setStyle('overflow-y', 'auto');
        }

        redefine(srFeed, 'closeActive', function(old) {
            return function() {
                var entry = App.SmartReader.UI.Feeds.container.getElement(".active");
                if(entry && entry.hasClass('websiteview')) {
                    stopStuff();
                }
                old();
            }
        });

        redefine(srFeed, 'putFocusOnEntry', function(old) {
            return function(entry, f) {
                old(entry, f);
                if(entry.hasClass('websiteview')) {
                    doStuff(entry);
                }
                else {
                    stopStuff();
                }
            }
        });

        redefine(srFeed, 'switchToWebsiteView', function(old) {
            return function(entry) {
                old(entry);
                doStuff(entry);
            }
        });

        redefine(srFeed, 'switchToFeedView', function(old) {
            return function(entry) {
                old(entry);
                stopStuff();
            }
        });

//         redefine(srFeed, 'scrollToEntry', function(old) {
//             return function (c, b, e) {
//                 // copy paste
//                 if (b && b.withoutScroll) {
//                     return
//                 }
//                 var a = c.getPosition(App.SmartReader.UI.Feeds.container).y - 1;
//                 if (b && b.smooth && this.datasource.current.view == "expanded") {
//                     var d = function () {
//                         if (e && typeof e == "function") {
//                             e()
//                         }
//                         App.SmartReader.UI.Feeds.main.fireEvent("scroll")
//                     };
//                     App.smoothScroll(App.SmartReader.UI.Feeds.main, a, d)
//                 } else {
//                     this.scrollView.backupAF = this.scrollView.options.autofocus;
//                     this.scrollView.options.autofocus = false;
//                     App.SmartReader.UI.Feeds.main.scrollTo(0, a);
//                     if (e && typeof e == "function") {
//                         e()
//                     }
//                 }
//             }
//         });

//         App.SmartReader.ScrollView.implement({
//             onContainerResize: function () {
//                 var entry = App.SmartReader.UI.Feeds.container.getElement(".active");
//                 if (entry && App.SmartReader.UI.Feeds.iFrame) {
//                     var footerSize = entry.getElement('.entry-footer').getSize().y,
//                         headerSize = entry.getElement('#header-websiteview').getSize().y,
//                         mainSize = App.SmartReader.UI.Feeds.main.getSize().y + 10;
//                     if(entry.getElement('.entry-podcastInner')) {
//                         mainSize -= entry.getElement('.entry-podcastInner').getSize().y;
//                     }
//                     if (this.datasource.current.view == "mosaic") {
//                         mainSize -= 185
//                     }
//                     App.SmartReader.UI.Feeds.iFrame.setStyle('height',
//                         mainSize - footerSize - headerSize);
//                 }
//
//             }
//
//         });
    }

    makeTabs();
    makeToggleTop();
    makeSmartReader();
    handleResize();
    fullScreenOnWebView();
});
// header-websiteview