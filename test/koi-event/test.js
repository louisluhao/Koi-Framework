/**
 * KOI event
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint regexp: true, browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function () {
    "use strict";
   
    Screw.Unit(function () {
        describe("bind and triggering", function () {
            it("can bind and trigger an event", function () {
                var executed = false;
                KOI.bind("testEvent", function () {
                    executed = true;
                });
                KOI.trigger("testEvent");
                expect(executed).to(be_true);
            });
            it("can bind and trigger an event multiple times", function () {
                var executed = 0;
                KOI.bind("testMultiEvent", function () {
                    executed += 1;
                });
                KOI.trigger("testMultiEvent");
                KOI.trigger("testMultiEvent");
                KOI.trigger("testMultiEvent");
                expect(executed).to(equal, 3);
            });
            it("can bind and trigger an event once", function () {
                var executed = 0;
                KOI.one("testSingleEvent", function () {
                    executed += 1;
                });
                KOI.trigger("testSingleEvent");
                KOI.trigger("testSingleEvent");
                expect(executed).to(equal, 1);
            });
            it("can bind and unbind", function () {
                var executed = false,
                    listener = function () {
                        executed = true;
                    };
                KOI.bind("testUnbindEvent", listener);
                KOI.unbind("testUnbindEvent", listener);
                KOI.trigger("testUnbindEvent");
                expect(executed).to(be_false);
            });
            it("can purge bound events", function () {
                var executed = 0;
                KOI.bind("testPurgeEvent", function () {
                    executed += 1;
                });
                KOI.bind("testPurgeEvent", function () {
                    executed += 1;
                });
                KOI.purge("testPurgeEvent");
                KOI.trigger("testPurgeEvent");
                expect(executed).to(equal, 0);
            });
            it("supports toggle events", function () {
                KOI.toggleEvents.testToggle = false; 
                var triggered = 0;
                KOI.bind("testToggle", function () {
                    triggered += 1;
                });
                KOI.trigger("testToggle");
                expect(triggered).to(equal, 1);
                KOI.bind("testToggle", function () {
                    triggered += 1;
                });
                expect(triggered).to(equal, 2);
                KOI.trigger("testToggle");
                expect(triggered).to(equal, 2);
            });
            it("can trigger events with parameters", function () {
                var a, b, c;
                KOI.bind("params", function (v1, v2, v3) {
                    a = v1;
                    b = v2;
                    c = v3;
                });
                KOI.trigger("params", "a", "b", "c");
                expect(a).to(equal, "a");
                expect(b).to(equal, "b");
                expect(c).to(equal, "c");
            });
        });
        describe("multiple event binding", function () {
            it("can bind multiple events with one call", function () {
                var executed = 0;
                KOI.bind("event1 event2 event3", function () {
                    executed += 1;
                });
                KOI.trigger("event1");
                KOI.trigger("event2");
                KOI.trigger("event3");
                expect(executed).to(equal, 3);
            });
            it("can bind multiple events and unbind instances", function () {
                var executed = 0,
                    listener = function () {
                        executed += 1;
                    };
                KOI.bind("unevent1 unevent2 unevent3", listener);
                KOI.unbind("unevent2", listener);
                KOI.trigger("unevent1");
                KOI.trigger("unevent2");
                KOI.trigger("unevent3");
                expect(executed).to(equal, 2);
            });
        });
        describe("browser events", function () {
            it("can bind and trigger browser events", function () {
                var e = document.createElement("a"),
                    triggered = false;
                KOI.listen(e, "click", function () {
                    triggered = true; 
                });
                KOI.fire(e, "click");
                expect(triggered).to(be_true);
            });
            it("can bind a domready event", function () {
                KOI.bind("DOMReady", function () {
                    expect(KOI.isDOMReady).to(be_true);
                }); 
            });
            it("triggers koi-event links", function () {
                var e = document.createElement("a"),
                    triggered = false;
                e.setAttribute("rel", "elementTrigger");
                e.className = "koi-event";
                KOI.bind("elementTrigger", function () {
                    triggered = true;
                });
                KOI.bind("DOMReady", function () {
                    document.body.appendChild(e);
                    KOI.fire(e, "click");
                    expect(triggered).to(be_true);
                });
            });
        });
    });

}());

