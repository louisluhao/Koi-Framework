/**
 * Koi Event Tests
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *   MIT: http://www.opensource.org/licenses/mit-license.php
 *   GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint regexp: true, browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function ($) {

    Screw.Unit(function () {
        describe("events", function () {
            it("can bind and unbind listeners", function () {
                KOI.bind("testEvent", $.noop);

                var events = KOI.eventDelegate.data("events");
                expect(events.testEvent).to(have_length, 1);

                KOI.unbind("testEvent");
                expect(events.testEvent).to(be_undefined);
            });
            it("can bind and unbind namespaced listeners", function () {
                KOI.bind("testEvent.screw", $.noop);
                KOI.bind("testEvent", $.noop);

                var events = KOI.eventDelegate.data("events");
                expect(events.testEvent).to(have_length, 2);

                KOI.unbind(".screw");
                expect(events.testEvent).to(have_length, 1);

                KOI.unbind("testEvent");
                expect(events.testEvent).to(be_undefined);
            });
            it("can trigger bound events", function () {
                var did_trigger = false;
                KOI.bind("testEvent", function () {
                    did_trigger = true;
                });
                KOI.trigger("testEvent");
                expect(did_trigger).to(be_true);
            });
            it("can trigger bound events once using `one`", function () {
                var triggered = 0;
                KOI.one("testEvent", function () {
                    triggered += 1;
                });
                KOI.trigger("testEvent");
                KOI.trigger("testEvent");
                expect(triggered).to(equal, 1);
            });
        });    
    });

}(window.jQuery));

