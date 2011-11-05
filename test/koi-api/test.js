/**
 * KOI API
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
        describe("API calls", function () {
            it("can create API calls", function () {
                KOI.api.create("foo", "/a/b", "GET", "json", true, 
                    "application/json", "application/json");          
                var c = KOI.api.calls.foo;
                expect(c.url).to(equal, "/a/b");
                expect(c.method).to(equal, "GET");
                expect(c.dataType).to(equal, "json");
                expect(c.cache).to(be_true);
                expect(c.contentType).to(equal, "application/json");
                expect(c.accept).to(equal, "application/json");
            }); 
            it("can create API calls from defaults", function () {
                KOI.api.create("bar", "/c/d");
                var c = KOI.api.calls.bar;
                expect(c.url).to(equal, "/c/d");
                expect(c.method).to(equal, "GET");
                expect(c.dataType).to(equal, "json");
                expect(c.cache).to(be_false);
                expect(c.contentType)
                    .to(equal, "application/x-www-form-urlencoded");
                expect(c.accept)
                    .to(equal, "application/json, text/javascript");
            }); 
            it("can bind listeners to API calls", function () {
                var s = false,
                    f = false;
                KOI.api.create("baz", "/a/b/");
                KOI.api.bind("baz", function () { s = true }, 
                    function () { f = true; });
                // Simulate call finishing
                KOI.trigger("api-baz-success");
                expect(s).to(be_true);
                expect(f).to(be_false);
                KOI.trigger("api-baz-failure");
                expect(f).to(be_true);
            });
            it("errors when trying to invoke undefined calls", function () {
                var errored = false;
                try {
                    KOI.api.invoke("undef-call");
                } catch (e) {
                    errored = true;
                }
                expect(errored).to(be_true);
            });
            it("can create request proxies", function () {
                expect(KOI.isFunction(KOI.api.requestProxy("some-call")))
                    .to(be_true);
            });
        });
    });

}());

