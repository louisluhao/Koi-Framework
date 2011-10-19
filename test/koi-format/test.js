/**
 * String Formatting 
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
        describe("trims strings", function () {
            it("left trims", function () {
                expect(KOI.ltrim("   a   ")).to(equal, "a   ");
            }); 
            it("right trims", function () {
                expect(KOI.rtrim("   a   ")).to(equal, "   a");
            }); 
            it("trims", function () {
                expect(KOI.trim("   a   ")).to(equal, "a");
            }); 
        });
        describe("pads strings", function () {
            it("left pads strings", function () {
                expect(KOI.lpad("a", "b", 5)).to(equal, "bbbba");             
            }); 
            it("right pads strings", function () {
                expect(KOI.rpad("a", "b", 5)).to(equal, "abbbb");             
            }); 
            it("center pads strings", function () {
                expect(KOI.pad("a", "b", 5)).to(equal, "bbabb");             
                expect(KOI.pad("a", "b", 6)).to(equal, "bbabbb");             
            }); 
        });
        describe("position string formatting", function () {
            it("supports implicitly positioned replacements", function () {
                expect(KOI.format("{}{}", "a", "b")).to(equal, "ab");
            });
            it("supports explicitly positioned replacements", function () {
                expect(KOI.format("{0}{1}", "a", "b")).to(equal, "ab");
            });
            it("supports explcitit non-respective replacements", function () {
                expect(KOI.format("{1}{0}", "b", "a")).to(equal, "ab");
            });
            it("supports non-respective explicit replacements", function () {
                expect(KOI.format("{1}", "a", "b")).to(equal, "b");
            });
            it("supports unused replacement values", function () {
                expect(KOI.format("{0}", "a", "b")).to(equal, "a");
            });
            it("supports collapsed mode position parameters", function () {
                expect(KOI.format(true, "{}{}", ["a", "b"])).to(equal, "ab");
            });
        });
        describe("named string formatting", function () {
            it("supports named replacements", function () {
                expect(KOI.format(true, "{a}", {a: "b"})).to(equal, "b");
            }); 
        });
        describe("mixed string formatting", function () {
            it("supports implicit and named replacements", function () {
                expect(KOI.format(true, "{}{a}", {a: "b"}, "c"))
                    .to(equal, "cb");
            }); 
            it("supports explicit and named replacements", function () {
                expect(KOI.format(true, "{0}{a}", {a: "b"}, "c"))
                    .to(equal, "cb");
            }); 
            it("supports position and named replacement objects", function () {
                expect(KOI.format(false, "{}{}{a}", {a: "b"}, ["c", "d"]))
                    .to(equal, "cdb");
            }); 
        });
        describe("complex value formatting", function () {
            it("supports non-strings as values", function () {
                expect(KOI.format("{}", {})).to(equal, "[object Object]");
            }); 
            it("supports and coerces numbers as string values", function () {
                expect(KOI.format("{}", 100)).to(equal, "100");
            }); 
            it("supports object keys", function () {
                expect(KOI.format("{.a}", {a: "b"})).to(equal, "b");
            }); 
            it("supports nested paramters", function () {
                expect(KOI.format("{.a.b}", {a: {b: "c"}})).to(equal, "c");
            }); 
        });
        describe("interger formatting spec", function () {
            it("formats as binary", function () {
                expect(KOI.format("{0:b}", 10)).to(equal, "1010");
            });
            it("formats as characters", function () {
                expect(KOI.format("{0:c}", 55)).to(equal, "7");
            });
            it("formats as octal", function () {
                expect(KOI.format("{0:o}", 10)).to(equal, "12");
            });
            it("formats as lowercase hex", function () {
                expect(KOI.format("{0:x}", 225)).to(equal, "e1");
            });
            it("formats as uppercase hex", function () {
                expect(KOI.format("{0:X}", 225)).to(equal, "E1");
            });
            it("formats as decimal", function () {
                expect(KOI.format("{0:d}", 0xe1)).to(equal, "225");
            });
            it("formats as decimal by default", function () {
                expect(KOI.format("{0}", 0xe1)).to(equal, "225");
            });
        });
        describe("float formatting spec", function () {
            it("formats as exponents", function () {
                expect(KOI.format("{0:e}", 25.60)).to(equal, "2.560000e+1");
            });
            it("formats as uppercase exponents", function () {
                expect(KOI.format("{0:E}", 25.60)).to(equal, "2.560000E+1");
            });
            it("formats as fixed point", function () {
                expect(KOI.format("{0:f}", 25.60)).to(equal, "25.600000");
                expect(KOI.format("{0:F}", 25.60)).to(equal, "25.600000");
            });
            it("formats as general", function () {
                expect(KOI.format("{0:g}", 500000)).to(equal, "500000");
                expect(KOI.format("{0:g}", 5000000)).to(equal, "5e+6");
            });
            it("formats as uppercase general", function () {
                expect(KOI.format("{0:G}", 500000)).to(equal, "500000");
                expect(KOI.format("{0:G}", 5000000)).to(equal, "5E+6");
            });
            it("formats as percent", function () {
                expect(KOI.format("{0:%}", 0.8)).to(equal, "80%");
                expect(KOI.format("{0:%}", 8)).to(equal, "800%");
            });
            it("formats as interger by default", function () {
                expect(KOI.format("{0}", 500000.0)).to(equal, "500000");
                expect(KOI.format("{0}", 5000000.0)).to(equal, "5000000");
            });
            it("handles precision", function () {
                expect(KOI.format("{0:.0e}", 25.60)).to(equal, "3e+1");
                expect(KOI.format("{0:.1e}", 25.60)).to(equal, "2.6e+1");
                expect(KOI.format("{0:.2e}", 25.60)).to(equal, "2.56e+1");
            });
        });
        describe("string formatting spec", function () {
            it("formats as string", function () {
                expect(KOI.format("{0:s}", 1)).to(equal, "1");
                expect(KOI.format("{0:s}", "a")).to(equal, "a");
            }); 
            it("handles string precision", function () {
                expect(KOI.format("{0:.3}", "abcdef")).to(equal, "abc");
                expect(KOI.format("{0:.3}", "a")).to(equal, "a");
            }); 
            it("handles padding", function () {
                expect(KOI.format("{0:5}", "a")).to(equal, "a    ");
                expect(KOI.format("{0:<5}", "a")).to(equal, "a    ");
                expect(KOI.format("{0:>5}", "a")).to(equal, "    a");
                expect(KOI.format("{0:^5}", "a")).to(equal, "  a  ");
                expect(KOI.format("{0: ^5}", "a")).to(equal, "  a  ");
            });
            it("handles filling", function () {
                expect(KOI.format("{0:b<5}", "a")).to(equal, "abbbb");
                expect(KOI.format("{0:b>5}", "a")).to(equal, "bbbba");
                expect(KOI.format("{0:b^5}", "a")).to(equal, "bbabb");
            });
        });
        describe("number formatting spec", function () {
            it("handles zero padding", function () {
                expect(KOI.format("{0:05}", 5)).to(equal, "00005");
            });
            it("handles nan values", function () {
                expect(KOI.format("{0}", NaN)).to(equal, "NaN");
            });
            it("handles infinities", function () {
                expect(KOI.format("{0}", Infinity)).to(equal, "Infinity");
                expect(KOI.format("{0}", -Infinity)).to(equal, "-Infinity");
            });
            it("handles number signs for negatives", function () {
                expect(KOI.format("{0:-}", -50)).to(equal, "-50");
                expect(KOI.format("{0:+}", -50)).to(equal, "-50");
                expect(KOI.format("{0: }", -50)).to(equal, "-50");
            }); 
            it("handles number signs for positives", function () {
                expect(KOI.format("{0:-}", 50)).to(equal, "50");
                expect(KOI.format("{0:+}", 50)).to(equal, "+50");
                expect(KOI.format("{0: }", 50)).to(equal, " 50");
            }); 
            it("handles padding with signs", function () {
                expect(KOI.format("{0:=-05}", 50)).to(equal, "00050");
                expect(KOI.format("{0:=+05}", 50)).to(equal, "+0050");
                expect(KOI.format("{0:= 05}", 50)).to(equal, " 0050");
                expect(KOI.format("{0:< 05}", 50)).to(equal, "00 50");
            }); 
            it("handles alternate format printing", function () {
                expect(KOI.format("{0:#b}", 16)).to(equal, "0b10000");
                expect(KOI.format("{0:#o}", 16)).to(equal, "0o20");
                expect(KOI.format("{0:#x}", 16)).to(equal, "0x10");
                expect(KOI.format("{0:#X}", 16)).to(equal, "0X10");
            });
        });
        describe("field in spec formatting", function () {
            it("handles field in spec formatting", function () {
                expect(KOI.format("{0:{1}}", "abc", 6)).to(equal, "abc   ");
            });
            it("handles spec in field in spec formatting", function () {
                // binary format (bad -> b)
                expect(KOI.format("{0:{1:.1}}", 3, "bad")).to(equal, "11");
                // decimal format (dad -> d)
                expect(KOI.format("{0:{1:.1}}", 3, "dad")).to(equal, "3");
            });
            it("handles interspersed field spec formatting", function () {
                expect(KOI.format("{0:#{1}.2}", "abcd", 3)).to(equal, "ab ");
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
            it("supports escaped brackets", function () {
                expect(KOI.format("a{{")).to(equal, "a{");
                expect(KOI.format("a}}")).to(equal, "a}");
                expect(KOI.format("{{b")).to(equal, "{b");
                expect(KOI.format("}}b")).to(equal, "}b");
                expect(KOI.format("a{{b")).to(equal, "a{b");
            });
        });
        describe("errors", function () {
            it("errors on mixed explicit/implicit counting", function () {
                var error = "";
                try {
                    KOI.format("{}{0}", "a", "b");
                } catch (e) {
                    error = e;
                }
                expect(error)
                    .to(equal, "cannot mix explicit and implicit counting");
            });
            it("errors on field/value mismatch", function () {
                var error = "";
                try {
                    KOI.format("{}");
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, "field out of range");
            });
            it("errors on missing name", function () {
                var error = "";
                try {
                    KOI.format(true, "{n}", {});
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, "key error: n");
            });
            it("errors on missing key", function () {
                var error = "";
                try {
                    KOI.format("{.a}", {});
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, "key error: a");
            });
            it("errors with unclosed replacement field", function () {
                var error = "";
                try {
                    KOI.format("{0}{0", "");
                } catch (e) {
                    error = e;
                }
                expect(error)
                    .to(equal, "Single '{' encountered in format string");
            });
            it("errors with unopened replacement field", function () {
                var error = "";
                try {
                    KOI.format("{0}0}", "");
                } catch (e) {
                    error = e;
                }
                expect(error)
                    .to(equal, "Single '}' encountered in format string");
            });
            it("errors with nested format spec fields", function () {
                var error = "";
                try {
                    KOI.format("{0:{1:{2}}}", 1, 8);
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, "Max string recursion exceeded");
            });
            it("errors with improper formatting characters", function () {
                var error = "";
                try {
                    KOI.format("{0:d}", "a");
                } catch (e) {
                    error = e;
                }
                expect(error)
                    .to(equal, "invalid formatting type (d) for: string");
            });
            it("errors with invalid formatting characters", function () {
                var error = "";
                try {
                    KOI.format("{0:w}", "a");
                } catch (e) {
                    error = e;
                }
                expect(error).to(equal, "invalid format spec: w");
            });
        });
    });

}());

