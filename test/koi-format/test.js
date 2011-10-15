/**
 * String formatting 
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint regexp: true, browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function () {
    "use strict";
   
   /**
    * todo: formatting spec erros
    * todo: missing key errors
    * todo: missing named errors
    * todo: formatting spec
    * todo: field-in-spec formatting
    */

    Screw.Unit(function () {
        describe("position string formatting", function () {
            it("supports implicitly positioned replacements", function () {
                var str = "{} {}",
                    expected = "a b";
                expect(KOI.format(str, "a", "b")).to(equal, expected);
            });
            it("supports explicitly positioned replacements", function () {
                var str = "{0} {1}",
                    expected = "a b";
                expect(KOI.format(str, "a", "b")).to(equal, expected);
            });
            it("supports explcitit non-respective replacements", function () {
                var str = "{1} {0}",
                    expected = "a b";
                expect(KOI.format(str, "b", "a")).to(equal, expected);
            });
            it("supports non-respective explicit replacements", function () {
                var str = "{1}",
                    expected = "b";
                expect(KOI.format(str, "a", "b")).to(equal, expected);
            });
            it("supports unused replacement values", function () {
                var str = "{0}",
                    expected = "a";
                expect(KOI.format(str, "a", "b")).to(equal, expected);
            });
            it("supports collapsed mode position parameters", function () {
                var str = "{0} {1}",
                    expected = "a b",
                    values = ["a", "b"];
                expect(KOI.format(true, str, values)).to(equal, expected);
            });
        });
        describe("named string formatting", function () {
            it("supports named replacements", function () {
                var str = "{name} {date}",
                    values = {
                        name: "a",
                        date: "b"
                    },
                    expected = "a b";
                expect(KOI.format(true, str, values)).to(equal, expected);
            }); 
        });
        describe("mixed string formatting", function () {
            it("supports implicit and named replacements", function () {
                var str = "{} {name} {date}",
                    values = {
                        name: "a",
                        date: "b"
                    },
                    expected = "c a b";
                expect(KOI.format(true, str, values, "c")).to(equal, expected);
            }); 
            it("supports explicit and named replacements", function () {
                var str = "{0} {name} {date}",
                    values = {
                        name: "a",
                        date: "b"
                    },
                    expected = "c a b";
                expect(KOI.format(true, str, values, "c")).to(equal, expected);
            }); 
            it("supports position and named replacement objects", function () {
                var str = "{0} {1} {name} {date}",
                    values = {
                        name: "a",
                        date: "b"
                    },
                    positions = ["c", "d"],
                    expected = "c d a b";
                expect(KOI.format(false, str, values, positions)).to(
                    equal, expected);
            }); 
        });
        describe("complex value formatting", function () {
            it("supports functions as values", function () {
                var str = "{0}",
                    val = function () {
                        return "x";
                    };
                expect(KOI.format(str, val)).to(equal, "x");
            }); 
            it("supports non-strings as values", function () {
                var str = "{0}";
                expect(KOI.format(str, {})).to(equal, "[object Object]");
            }); 
            it("supports and coerces numbers as string values", function () {
                var str = "{0}";
                expect(KOI.format(str, 100)).to(equal, "100");
            }); 
            it("supports dot format paramters", function () {
                var str = "{0.a}";
                expect(KOI.format(str, {a: "b"})).to(equal, "b");
            }); 
            it("supports bracket format paramters", function () {
                var str = "{0[a]}";
                expect(KOI.format(str, {a: "b"})).to(equal, "b");
            }); 
            it("supports nested paramters", function () {
                var str = "{0.a.b.c}";
                expect(KOI.format(str, {a: {b: {c: "d"}}})).to(equal, "d");
            }); 
        });
        describe("formatting spec", function () {
            it("obeys string length spec", function () {
                var str = "{0:10}",
                    expected = "a         ";
                expect(KOI.format(str, "a")).to(equal, expected);
            }); 
        });
        describe("general formatting guidelines", function () {
            it("returns an empty string on invalid string", function () {
                expect(KOI.format(null)).to(equal, "");
                expect(KOI.format(undefined)).to(equal, "");
                expect(KOI.format({})).to(equal, "");
            });
            it("does not alter a string with no replacements", function () {
                var str = "a b";
                expect(KOI.format(str)).to(equal, str);
            });
            it("supports escaped replacements", function () {
                var str = "{{0}} {0} {{1}} {1}",
                    expected = "{0} a {1} b";
                expect(KOI.format(str, "a", "b")).to(equal, expected);
            });
            it("does not process escaped curly brace strings", function () {
                var str = "\\{0\\}";
                expect(KOI.format(str, "a")).to(equal, "\\0\\");
            });
        });
        describe("errors", function () {
            it("errors on mixed explicit/implicit counting", function () {
                var str = "{0} {}",
                    expected = "cannot mix explicit and implicit counting",
                    error;
                try {
                    KOI.format(str, "a", "b");
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, expected);
            });
            it("errors on field/value mismatch", function () {
                var str = "{}",
                    expected = "fields and values do not match",
                    error;
                try {
                    KOI.format(str);
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, expected);
            });
            it("errors on field/value mismatch", function () {
                var str = "{}",
                    expected = "fields and values do not match",
                    error;
                try {
                    KOI.format(str);
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, expected);
            });
            it("errors on mixed parameter syntax", function () {
                var str = "{0[a].b}",
                    expected = "cannot mix dot and bracket syntax",
                    error;
                try {
                    KOI.format(str);
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, expected);
            });
            it("errors with unclosed replacement field", function () {
                var str = "{0} {0",
                    expected = "single { detected",
                    error;
                try {
                    KOI.format(str);
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, expected);
            });
            it("errors with unopened replacement field", function () {
                var str = "{0} 0}",
                    expected = "single } detected",
                    error;
                try {
                    KOI.format(str);
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, expected);
            });
            it("errors with nested format spec fields", function () {
                var str = "{0:{1:{2}}}",
                    expected = "cannot nest format spec fields",
                    error;
                try {
                    KOI.format(str, 1, 8);
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, expected);
            });
        });
    });

}());

