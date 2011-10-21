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
                KOI.bind("test-event", function () {
                    executed = true;
                });
                KOI.trigger("test-event");
                expect(executed).to(be_true);
            });
            it("can bind and trigger an event multiple times", function () {
                var executed = 0;
                KOI.bind("test-multi-event", function () {
                    executed += 1;
                });
                KOI.trigger("test-multi-event");
                KOI.trigger("test-multi-event");
                KOI.trigger("test-multi-event");
                expect(executed).to(equal, 3);
            });
            it("can bind and trigger an event once", function () {
                var executed = 0;
                KOI.one("test-single-event", function () {
                    executed += 1;
                });
                KOI.trigger("test-single-event");
                KOI.trigger("test-single-event");
                expect(executed).to(equal, 1);
            });
            it("can bind and unbind", function () {
                var executed = false,
                    listener = function () {
                        executed = true;
                    };
                KOI.bind("test-unbind-event", listener);
                KOI.unbind("test-unbind-event", listener);
                KOI.trigger("test-unbind-event");
                expect(executed).to(be_false);
            });
            it("can purge bound events", function () {
                var executed = 0;
                KOI.bind("test-purge-event", function () {
                    executed += 1;
                });
                KOI.bind("test-purge-event", function () {
                    executed += 1;
                });
                KOI.purge("test-purge-event");
                KOI.trigger("test-purge-event");
                expect(executed).to(equal, 0);
            });
        });
        describe("multiple event binding", function () {
            it("can bind multiple events with one call", function () {
                var executed = 0;
                KOI.bind("event-1 event-2 event-3", function () {
                    executed += 1;
                });
                KOI.trigger("event-1");
                KOI.trigger("event-2");
                KOI.trigger("event-3");
                expect(executed).to(equal, 3);
            });
            it("can bind multiple events and unbind instances", function () {
                var executed = 0,
                    listener = function () {
                        executed += 1;
                    };
                KOI.bind("unevent-1 unevent-2 unevent-3", listener);
                KOI.unbind("unevent-2", listener);
                KOI.trigger("unevent-1");
                KOI.trigger("unevent-2");
                KOI.trigger("unevent-3");
                expect(executed).to(equal, 2);
            });
        });
        describe("event parameters", function () {
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
    });

}());

