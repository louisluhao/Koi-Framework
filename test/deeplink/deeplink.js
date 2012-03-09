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
			it("handles routes", function () {
				var triggered = false;
				KOI.route("/change/", function () {
					triggered = true;
				});
				KOI.executeRoute("/change");

				expect(triggered).to(be_true);
			});
			it("supports multiple route listeners", function () {
				var t1 = false,
					t2 = false;
				KOI.route("/a", function () {
					t1 = true;
				});
				KOI.route("/a", function () {
					t2 = true;
				});
				KOI.executeRoute("/a");

				expect(t1).to(be_true);
				expect(t2).to(be_true);
			});
			it("is insentitive to trailing and leading slashes", function () {
				var t1 = false,
					t2 = false,
					t3 = false;
				KOI.route("/b", function () {
					t1 = true;
				});
				KOI.route("b/", function () {
					t2 = true;
				});
				KOI.route("/b/", function () {
					t3 = true;
				});
				KOI.executeRoute("b");

				expect(t1).to(be_true);
				expect(t2).to(be_true);
				expect(t3).to(be_true);
			});
			it("triggers errors on missing paths", function () {
				var errored = false,
					path = "/bad/path";
				KOI.bind("deeplink-error", function (e, r) {
					if (e === "not_found" && r === path) {
						errored = true;
					}
				});
				KOI.executeRoute(path);

				expect(errored).to(be_true);
			});
			it("can extract variables from a route", function () {
				var total = 0,
					test_string;
				KOI.routes({
					"/add/:value/to/total": function (p) {
						total += parseInt(p.value, 10);
					},
					"/set/string/to/:string": function(p) {
						test_string = p.string;
					}
				});
				KOI.executeRoute("/add/5/to/total");
				KOI.executeRoute("/add/10/to/total");
				KOI.executeRoute("/set/string/to/worked");

				expect(total).to(equal, 15);
				expect(test_string).to(equal, "worked");
			});
			it("can handle multiple variable matches", function () {
				var t1 = 0,
					t2 = 0,
					last_action;
				KOI.routes({
					"/:action/:value/": function (p) {
						var v = parseInt(p.value, 10);
						if (p.action === "inc") {
							t1 += v;
						} else if (p.action === "dec") {
							t1 -= v;
						}
						last_action = p.action;
					},
					"/inc/:value": function (p) {
						t2 += parseInt(p.value, 10);
					},
					"/dec/:value": function (p) {
						t2 -= parseInt(p.value, 10);
					}
				});
				KOI.executeRoute("/inc/8");
				KOI.executeRoute("/dec/3");

				expect(t1).to(equal, 5);
				expect(t1).to(equal, t2);
				expect(last_action).to(equal, "dec");
			});
		});
	});
}());

