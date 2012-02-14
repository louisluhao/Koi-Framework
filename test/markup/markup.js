/**
 * KOI markup
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
		describe("shorthand parsing", function () {
			it("creates elements", function () {
				expect(KOI.markup("a")).to(be_element_type, "a");
				expect(KOI.markup("div")).to(be_element_type, "div");
			});
			it("supports an id", function () {
				expect(KOI.markup("a#id-test")).to(have_id, "id-test");
				expect(KOI.markup("a#id-test#id2")).to(have_id, "id2");
			});
			it("supports classes", function () {
				expect(KOI.markup("a.test")).to(have_classes, "test");
				expect(KOI.markup("a.b.c")).to(have_classes, ["b", "c"]);
			});
			it("supports attributes", function () {
				expect(KOI.markup("a[href=#123]").getAttribute("href"))
					.to(equal, "#123");
				expect(KOI.markup("div[id=x-x]")).to(have_id, "x-x");
			});
			it("creates elements from arrays", function () {
				var e = KOI.markup(["a", "em"]);
				expect(e.childNodes[0]).to(be_element_type, "a");
				expect(e.childNodes[1]).to(be_element_type, "em");
			});
		});
		describe("trees", function () {
			it("creates siblings", function () {
				var f = KOI.markup("a.a1", "a.a2", "span.s1");
				expect(f.childNodes).to(have_length, 3);
				expect(f.childNodes[0]).to(be_element_type, "a");
				expect(f.childNodes[1]).to(be_element_type, "a");
				expect(f.childNodes[2]).to(be_element_type, "span");
				expect(f.childNodes[0]).to(have_classes, "a1");
				expect(f.childNodes[1]).to(have_classes, "a2");
				expect(f.childNodes[2]).to(have_classes, "s1");
			});
			it("creates children", function () {
				var e = KOI.markup("div", [
						"span",
						"div.container", [
							"span#target"
						]
					]);
				expect(e).to(be_element_type, "div");
				expect(e.children).to(have_length, 2);
				expect(e.children[0]).to(be_element_type, "span");
				expect(e.children[1]).to(be_element_type, "div");
				expect(e.children[1]).to(have_classes, "container");
				expect(e.children[1].children).to(have_length, 1);
				expect(e.children[1].children[0]).to(be_element_type, "span");
				expect(e.children[1].children[0]).to(have_id, "target");
			});
		});
	});

}());
