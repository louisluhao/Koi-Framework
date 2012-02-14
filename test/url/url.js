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
			it("can encode scalar values", function () {
				expect(KOI.toParameters({a: "b", c: "d"}))
					.to(equal, "a=b&c=d");
			});
			it("can encode non scalar values", function () {
				var o = {a: ["b", ["c"]], d: {e: "f"}, g: 1};
				expect(decodeURIComponent(KOI.toParameters(o)))
					.to(equal, "a[]=b&a[1][]=c&d[e]=f&g=1");
			});
			it("can decode scalar values", function () {
				expect(KOI.parseParameters("a=b&c=d"))
					.to(equal, {a: "b", c: "d"});
			});
			it("can decode non scalar values", function () {
				var o = {a: ["b", ["c"]], d: {e: "f"}, g: 1},
					params = KOI.parseParameters("a[]=b&a[1][]=c&d[e]=f&g=1");
				expect(params.g).to(equal, "1");
			});
		});
		describe("url", function () {
			it("can create window.location equivalent objects", function () {
				var href = "http://a.b/c/d/?e=f#g=h",
					l = KOI.locationEquivalent(href);

				expect(l.href).to(equal, href);
				expect(l.protocol).to(equal, "http:");
				expect(l.host).to(equal, "a.b");
				expect(l.hostname).to(equal, "a.b");
				expect(l.port).to(equal, "");
				expect(l.pathname).to(equal, "/c/d/");
				expect(l.search).to(equal, "?e=f");
				expect(l.hash).to(equal, "#g=h");
			});
			it("can handle ports", function () {
				expect(KOI.locationEquivalent("http://a.b:50/").port)
					.to(equal, "50");
				expect(KOI.locationEquivalent("http://a.b/", true).port)
					.to(equal, "80");
				expect(KOI.locationEquivalent("https://a.b/", true).port)
					.to(equal, "443");
			});
			it("can test for local URLs", function () {
				expect(KOI.isLocal("http://a.b/")).to(be_false);
				expect(KOI.isLocal("file://a.b/")).to(be_true);
				expect(KOI.isLocal("about://a.b/")).to(be_true);
			});
			it("can test for cross domain", function () {
				var src = "https://a.b/";
				expect(KOI.isCrossDomain(src, src)).to(be_false);
				expect(KOI.isCrossDomain("http://a.b/", src)).to(be_true);
				expect(KOI.isCrossDomain("https://c.d/", src)).to(be_true);
				expect(KOI.isCrossDomain("https://z.a.b/", src)).to(be_true);
			});
		});
	});

}());

