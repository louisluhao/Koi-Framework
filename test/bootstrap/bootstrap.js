/**
 * KOI bootstrap
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
		describe("bootstrapping", function () {
			it("should complete loading successfully", function () {
				expect(window.__bootstrapped__).to(be_true);
			});
			it("should handle intra-library dependencies", function () {
				expect(KOI).to_not(be_null);
				expect(KOI.format).to_not(be_null);
			});
			it("should handle inter-library dependencies", function () {
				expect(KOI).to_not(be_null);
				expect(KOI.api).to_not(be_null);
				expect(window.__test_lib__).to(be_true);
				expect($("#blue-test-box").css("backgroundColor"))
					.to(equal, "rgb(0, 0, 255)");
			});
			it("should handle application css includes", function () {
				expect($("#red-test-box").css("backgroundColor"))
					.to(equal, "rgb(255, 0, 0)");
			});
			it("should handle application script includes", function () {
				expect(window.__included_script__).to(be_true);
			});
			it("should handle html loading", function () {
				expect(window.__KOI_HTML__.test.test)
					.to(equal, "<span>test</span>\n");
			});
		});
	});

}());

