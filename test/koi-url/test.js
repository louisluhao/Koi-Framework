/**
 * KOI format
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
        describe("parameters", function () {
            it("can encode a simple object", function () {
                expect(KOI.toParameters({a: "b", c: "d"}))
                    .to(equal, "a=b&c=d");
            });
            it("can encode a complex object", function () {
                var o = {
                        a: ["b", ["c"]], 
                        d: {e: "f"}, 
                        g: 1
                    };
                expect(decodeURIComponent(KOI.toParameters(o)))
                    .to(equal, "a[]=b&a[1][]=c&d[e]=f&g=1");
            });
        });
    });

}());

