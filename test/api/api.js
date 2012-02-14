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
			if (KOI.isLocal(window.location.toString())) {
				it("errors on local ajax", function () {
					KOI.api.create("local-call", "/a/");
					var error;
					try {
					   KOI.api.invoke("local-call");
					} catch (e) {
						error = e;
					}
					expect(error)
						.to(equal, "AJAX calls cannot be made locally");
				});
			}
		});
		describe("URL parameters", function () {
			it("supports URL parameters", function () {
				KOI.api.create("fooparm", "/:a/:b/:c?d=e&f=:g");
				var c = KOI.api.calls.fooparm;
				expect(c.urlParameters).to(have_length, 4);
				expect(c.urlParameters[0]).to(equal, ":a");
				expect(c.urlParameters[1]).to(equal, ":b");
				expect(c.urlParameters[2]).to(equal, ":c");
				expect(c.urlParameters[3]).to(equal, ":g");
			});
			it("errors if URL parameters aren't provided", function () {
				KOI.api.create("foofail", "/:a");
				var error1;
				try {
					KOI.api.invoke("foofail");
				} catch (e) {
					error = e;
				}
				expect(error).to(equal, "URL parameter missing: a");
			});
		});
		describe("JSONP", function () {
			it("can detect JSONP urls", function () {
				expect(KOI.api.usesJSONP("/a?cb=?")).to(be_true);
				expect(KOI.api.usesJSONP("/b")).to(be_false);
			});
			it("can handle JSONP calls", function () {
				KOI.api.create("jsonp", "/a?cb=?", "GET", "jsonp");
				var token = KOI.api.jsonpToken("jsonp"),
					data,
					fake = {a: "b", c: "d"};

				KOI.api.bind("jsonp", function (x) {
					data = x;
				});

				// Simulate a JSONP call
				window[token](fake);

				expect(KOI.isObject(data)).to(be_true);
				expect(data.a).to(equal, "b");
				expect(data.c).to(equal, "d");
			});
		});
	});

}());

