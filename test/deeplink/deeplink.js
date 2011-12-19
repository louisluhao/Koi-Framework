/**
 * KOI deeplink
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
        describe("deeplink event resolution", function () {

            it("can execute events", function () {
                var triggered = false;

                KOI.routes({
                    "/change": function () { triggered = true; },
                });

                // cheating a bit, but it's not my fault hashchanges are async
                KOI.executeRoute('/change'); 

                expect(triggered).to(be_true);
            });

            it("can extract variables from a route", function () {
                var total = 0, test_string = '';

                KOI.routes({
                    "/add/:value/to/total": function () { total += parseInt(this.value, 10); },
                    "/set/string/to/:string": function() { test_string = this.string; }
                });

                KOI.executeRoute('/add/5/to/total');
                KOI.executeRoute('/add/10/to/total');
                KOI.executeRoute('/set/string/to/worked');

                expect(total).to(equal, 15);
                expect(test_string).to(equal, 'worked');
            });

            it("gracefully handles bad routes", function () {
                KOI.executeRoute('/add/10/but/not/to/total');
                KOI.executeRoute('/im/a/bad/route/');
            });

        });
    });
}());

