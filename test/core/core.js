/**
 * KOI core
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
		describe("type detection", function () {
			it("detects arrays", function () {
				expect(KOI.getType([])).to(equal, "array");
				expect(KOI.isOfType([], "array")).to(be_true);
			});
			it("detects objects", function () {
				expect(KOI.getType({})).to(equal, "object");
				expect(KOI.isOfType({}, "object")).to(be_true);
			});
			it("detects functions", function () {
				expect(KOI.getType(function () {})).to(equal, "function");
				expect(KOI.isOfType(function () {}, "function")).to(be_true);
			});
			it("detects numbers", function () {
				expect(KOI.getType(0)).to(equal, "number");
				expect(KOI.isOfType(0, "number")).to(be_true);
			});
			it("detects strings", function () {
				expect(KOI.getType("a")).to(equal, "string");
				expect(KOI.isOfType("a", "string")).to(be_true);
			});
			it("detects regular expressions", function () {
				expect(KOI.getType(/a/)).to(equal, "regexp");
				expect(KOI.isOfType(/a/, "regexp")).to(be_true);
			});
			it("detects dates", function () {
				expect(KOI.getType(new Date())).to(equal, "date");
				expect(KOI.isOfType(new Date(), "date")).to(be_true);
			});
			it("detects booleans", function () {
				expect(KOI.getType(true)).to(equal, "boolean");
				expect(KOI.isOfType(false, "boolean")).to(be_true);
			});
		});
		describe("type checking", function () {
			it("tests nulls", function () {
				expect(KOI.isNull(null)).to(be_true);
				expect(KOI.isNull(undefined)).to(be_false);
				expect(KOI.isNull("")).to(be_false);
			});
			it("tests undefineds", function () {
				expect(KOI.isUndefined(undefined)).to(be_true);
				expect(KOI.isUndefined(null)).to(be_false);
				expect(KOI.isUndefined("")).to(be_false);
			});
			it("tests for validity", function () {
				expect(KOI.isValid(undefined)).to(be_false);
				expect(KOI.isValid(null)).to(be_false);
				expect(KOI.isValid("")).to(be_true);
				expect(KOI.isValid(false)).to(be_true);
			});
			it("tests for arrays", function () {
				expect(KOI.isArray([])).to(be_true);
				expect(KOI.isArray({})).to(be_false);
				expect(KOI.isArray("")).to(be_false);
			});
			it("tests for objects", function () {
				expect(KOI.isObject({})).to(be_true);
				expect(KOI.isObject([])).to(be_false);
				expect(KOI.isObject("")).to(be_false);
			});
			it("tests for functions", function () {
				expect(KOI.isFunction(function () {})).to(be_true);
				expect(KOI.isFunction([])).to(be_false);
				expect(KOI.isFunction("")).to(be_false);
			});
			it("tests for numbers", function () {
				expect(KOI.isNumber(0)).to(be_true);
				expect(KOI.isNumber([])).to(be_false);
				expect(KOI.isNumber("")).to(be_false);
			});
			it("tests for intergers", function () {
				expect(KOI.isInterger(0)).to(be_true);
				expect(KOI.isInterger(0.25)).to(be_false);
				expect(KOI.isInterger("a")).to(be_false);
				expect(KOI.isInterger("0")).to(be_false);
			});
			it("tests for floats", function () {
				expect(KOI.isFloat(0.25)).to(be_true);
				expect(KOI.isFloat(1)).to(be_false);
				expect(KOI.isFloat("a")).to(be_false);
				expect(KOI.isFloat("0.25")).to(be_false);
			});
			it("tests for strings", function () {
				expect(KOI.isString("")).to(be_true);
				expect(KOI.isString([])).to(be_false);
				expect(KOI.isString(0)).to(be_false);
			});
			it("tests for regular expressions", function () {
				expect(KOI.isRegExp(/a/)).to(be_true);
				expect(KOI.isRegExp([])).to(be_false);
				expect(KOI.isRegExp(0)).to(be_false);
				expect(KOI.isRegExp("")).to(be_false);
			});
			it("tests for booleans", function () {
				expect(KOI.isBoolean(true)).to(be_true);
				expect(KOI.isBoolean(false)).to(be_true);
				expect(KOI.isBoolean(null)).to(be_false);
				expect(KOI.isBoolean(0)).to(be_false);
				expect(KOI.isBoolean("")).to(be_false);
			});
			it("tests for emptyness", function () {
				expect(KOI.isEmpty([])).to(be_true);
				expect(KOI.isEmpty("")).to(be_true);
				expect(KOI.isEmpty({})).to(be_true);
				expect(KOI.isEmpty(["a"])).to(be_false);
				expect(KOI.isEmpty({a: "b"})).to(be_false);
				expect(KOI.isEmpty("a")).to(be_false);
			});
		});
		describe("utility method: each", function () {
			it("can iterate through objects", function () {
				var iterations = 0;
				KOI.each({a: "b"}, function (key, value) {
					expect(key).to(equal, "a");	
					expect(value).to(equal, "b");	
					iterations += 1;
				});
				expect(iterations).to(equal, 1);
			});
			it("can iterate through arrays", function () {
				var iterations = 0;
				KOI.each(["a", "b"], function (index, value) {
					if (index === 0) {
						expect(value).to(equal, "a");	
					} else if (index === 1) {
						expect(value).to(equal, "b");	
					}

					iterations += 1;
				});
				expect(iterations).to(equal, 2);
			});
			it("can iterate over strings", function () {
				var iterations = 0;
				KOI.each("ab", function (index, value) {
					if (index === 0) {
						expect(value).to(equal, "a");	
					} else if (index === 1) {
						expect(value).to(equal, "b");	
					}

					iterations += 1;
				});
				expect(iterations).to(equal, 2);
			});
			it("can iterate a given number of times", function () {
				var iterations = 0;
				KOI.each(3, function (index, value) {
					expect(index).to(equal, value);	
					iterations += 1;
				});
				expect(iterations).to(equal, 3);
			});
			it("can run a function until stopped", function () {
				var iterations = 0;
				KOI.each(function () {
					iterations += 1;

					if (iterations === 5) {
						return false;
					}
				});
				expect(iterations).to(equal, 5);
			});
			it("doesn't error with bad sources", function () {
				var error,
					iterations = 0;
				try {
					KOI.each(null, function () {
						iterations += 1;
					});
				} catch (e) {
					error = e;
				}
				expect(iterations).to(equal, 0);
				expect(error).to(be_undefined);
			});
			it("doesn't error with bad iterators", function () {
				var error;
				try {
					KOI.each(["a", "b"], null);
				} catch (e) {
					error = e;
				}
				expect(error).to(be_undefined);
			});
		});
		describe("utility methods: indexOf, inArray", function () {
			it("can find items in arrays", function () {
				expect(KOI.indexOf("a", ["b", "a"])).to(equal, 1);
				expect(KOI.indexOf("a", ["b"])).to(equal, -1);
			}); 
			it ("can determine if items are in arrays", function () {
				expect(KOI.inArray("a", ["b", "a"])).to(be_true);
				expect(KOI.inArray("a", ["b"])).to(be_false);
			});
		});
		describe("utility method: expose", function () {
			it("exposes via KOI", function () {
				KOI.expose({
					testVar: "testVar",
					testMethod: function () {
						return "testMethod";
					}
				});
				expect(KOI.testMethod).to_not(be_undefined);
				expect(KOI.testVar).to_not(be_undefined);
				expect(KOI.isFunction(KOI.testMethod)).to(be_true);
				expect(KOI.isString(KOI.testVar)).to(be_true);
				expect(KOI.testMethod()).to(equal, "testMethod");
				expect(KOI.testVar).to(equal, "testVar");
			}); 
			it("exposes via namespaces", function () {
				KOI.expose({
					testVar: "testVar",
					testMethod: function () {
						return "testMethod";
					}
				}, "testname");
				expect(KOI.testname).to_not(be_undefined);
				expect(KOI.testname.testMethod).to_not(be_undefined);
				expect(KOI.testname.testVar).to_not(be_undefined);
				expect(KOI.isFunction(KOI.testname.testMethod)).to(be_true);
				expect(KOI.isString(KOI.testname.testVar)).to(be_true);
				expect(KOI.testname.testMethod()).to(equal, "testMethod");
				expect(KOI.testname.testVar).to(equal, "testVar");
			}); 
			it("allows overriding of methods", function () {
				KOI.expose({a: function () {
					return "a";
				}});
				KOI.expose({a: function () {
					return "b";
				}}, null, true);
				expect(KOI.a).to_not(be_undefined);
				expect(KOI.a()).to(equal, "b");
			});
			it("allows default overriding of properties", function () {
				KOI.expose({c: "c"});
				KOI.expose({c: "d"});
				expect(KOI.c).to(equal, "d");
			});
			it("allows objects as namespaces", function () {
				var obj = {};
				KOI.expose({a: "b"}, obj);
				expect(obj.a).to_not(be_undefined);
				expect(obj.a).to(equal, "b");
			});
			it("allows multiple exposure for a namespace", function () {
				KOI.expose({c: function () {}}, "namespacetest");
				KOI.expose({d: function () {}}, "namespacetest");
				expect(KOI.c).to(equal, "d");
			});
			it("does not overwrite defined methods", function () {
				var error;
				try {
					KOI.expose({expose: function () {}});
				} catch (e) {
					error = e;
				}
				expect(error).to(equal, "expose is already exposed");
			});
			it("does not allow namespace collision", function () {
				var error;
				try {
					KOI.expose({a: ""}, "expose");
				} catch (e) {
					error = e;
				}
				expect(error).to(equal, "expose is not a namespace");
			});
		});
	});

}());

