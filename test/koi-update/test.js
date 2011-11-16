/**
 * KOI update
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
        describe("selection", function () {
            it("can select elements from id", function () {
                var e = KOI.getElements("#header-1");    
                expect(e).to(have_id, "header-1");
                expect(e).to(have_classes, "test-1");
            });
            it("can select elements from a class", function () {
                expect(KOI.getElements("test-1")).to(have_length, 2);
                expect(KOI.getElements("test-2")).to(have_id, "test-parent");
                expect(KOI.getElements("test-3")).to(have_length, 3);
            });
            it("can select elements contextually", function () {
                var e = KOI.getElements("#test-parent");
                expect(KOI.getElements("test-3", e)).to(have_length, 2);
                expect(KOI.getElements("test-3", e.id)).to(have_length, 2);
                expect(KOI.getElements("test-2", e.id)).to(have_id, e.id);
            });
            it("can select element instances", function () {
                expect(KOI.getElements("test-1", document, 1))
                    .to(have_id, "header-2");
                expect(KOI.getElements("test-1", document, 100)).to(be_null);
                expect(KOI.getElements("test-4", "test-parent", 1).innerHTML)
                    .to(equal, "c");
            });
            it("can test for classes", function () {
                expect(KOI.hasClass(KOI.getElements("#test-parent"), "test-2"))
                    .to(be_true);
            });
        });
    });

}());

