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
                var e = KOI.getElements("#test-parent");
                expect(KOI.hasClass(e, "test-2")).to(be_true);
                expect(KOI.hasClass(e, "foo")).to(be_false);
            });
        });
        describe("element data", function () {
            it("provides element specific data stores", function () {
                var e1 = KOI.getElements("#header-1"),
                    e2 = KOI.getElements("#header-2");
                KOI.elementData(e1).a = "1";
                KOI.elementData(e2).a = "2";
                expect(KOI.elementData(e1).a).to(equal, "1");
                expect(KOI.elementData(e2).a).to(equal, "2");
            });
            it("provides namespaces in data stores", function () {
                var e = KOI.getElements("#header-1");
                expect(KOI.elementData(e).testns).to(be_undefined);
                expect(KOI.isObject(KOI.elementData(e, "testns"))).to(be_true);
                expect(KOI.isObject(KOI.elementData(e).testns)).to(be_true);
            });
        });
        describe("processors", function () {
            it("can update element text", function () {
                var e = KOI.getElements("#header-1");
                expect(e.innerHTML).to(equal, "");
                KOI.processors.text(e, "Test Value");
                expect(e.innerHTML).to(equal, "Test Value");
                KOI.processors.text(e, "<strong>Test Value</strong>");
                expect(e.innerHTML).to(equal, "<strong>Test Value</strong>");
            });
            it("can change element classes", function () {
                var e = KOI.getElements("#header-1");
                expect(e.className).to(equal, "test-1");
                KOI.processors.classes(e, "b c");
                expect(e).to(have_classes, ["test-1", "b", "c"]);
                KOI.processors.classes(e, ["d", "e"]);
                expect(e).to_not(have_classes, ["b", "c"]);
                expect(e).to(have_classes, ["test-1", "d", "e"]);
                KOI.processors.classes(e);
                expect(e).to_not(have_classes, ["d", "e"]);
                expect(e.className).to(equal, "test-1");
            });
            it("can add classes", function () {
                var e = KOI.getElements("#header-1");
                KOI.processors.addClasses(e, "l m");
                KOI.processors.addClasses(e, "n o");
                expect(e).to(have_classes, ["l", "m", "n", "o"]);
            });
            it("can remove classes", function () {
                var e = KOI.getElements("#header-1");
                KOI.processors.addClasses(e, "l m");
                KOI.processors.removeClasses(e, "m");
                expect(e).to(have_classes, ["l"]);
                expect(e).to_not(have_classes, ["m"]);
            });
            it("can add element data", function () {
                var e = KOI.getElements("#header-1");
                KOI.processors.data(e, {foo: "bar"});
                expect(KOI.elementData(e).foo).to(equal, "bar");
            });
            it("can set element attributes", function () {
                var e = KOI.getElements("#header-1");
                KOI.processors.attr(e, {
                    name: "x"
                });
                expect(e.getAttribute("name")).to(equal, "x");
            });
        });
        describe("update", function () {
            it("can update elements", function () {
                var update = {
                        classes: "x y z",
                        data: {
                            x: 1
                        }
                    },
                    e = KOI.updateElements("test-4", update);
                expect(e[0]).to(have_classes, ["x", "y", "z"]);
                expect(e[1]).to(have_classes, ["x", "y", "z"]);
                expect(e[2]).to(have_classes, ["x", "y", "z"]);
                expect(KOI.elementData(e[0]).x).to(equal, 1);
                expect(KOI.elementData(e[1]).x).to(equal, 1);
                expect(KOI.elementData(e[2]).x).to(equal, 1);
                update.classes = "x w";
                update.data = {x: 2};
                e = KOI.updateElements("test-4", update);
                expect(e[0]).to(have_classes, ["x", "w"]);
                expect(e[1]).to(have_classes, ["x", "w"]);
                expect(e[2]).to(have_classes, ["x", "w"]);
                expect(e[0]).to_not(have_classes, ["y", "z"]);
                expect(e[1]).to_not(have_classes, ["y", "z"]);
                expect(e[2]).to_not(have_classes, ["y", "z"]);
                expect(KOI.elementData(e[0]).x).to(equal, 2);
                expect(KOI.elementData(e[1]).x).to(equal, 2);
                expect(KOI.elementData(e[2]).x).to(equal, 2);
            });
            it("can update multiple differnet elements", function () {
                KOI.update({
                    "test-1": {
                        text: "bcde"
                    },
                    "test-3": {
                        classes: "f g h"
                    }
                });
                var e1 = KOI.getElements("test-1"),
                    e3 = KOI.getElements("test-3");
                expect(e1[0].innerHTML).to(equal, "bcde");
                expect(e1[1].innerHTML).to(equal, "bcde");
                expect(e3[0]).to(have_classes, ["f", "g", "h"]);
                expect(e3[1]).to(have_classes, ["f", "g", "h"]);
                expect(e3[2]).to(have_classes, ["f", "g", "h"]);
            });
        });
        describe("templates", function () {
            it("can create templates", function () {
                KOI.createTemplate("tpl-1", document.createElement("div"));
                expect(KOI.templates["tpl-1"]).to(be_element_type, "div");
            });
            it("can use templates", function () {
                KOI.createTemplate("tpl-2", document.createElement("div"));
                KOI.useTemplate("test-2", "tpl-2");
                expect(KOI.usesTemplate(KOI.getElements("test-2")))
                    .to(equal, "tpl-2");
            });
            it("can create and use templates in one call", function () {
                KOI.createTemplate("tpl-3", document.createElement("div"),
                    "#header-1");
                expect(KOI.usesTemplate(KOI.getElements("#header-1")))
                    .to(equal, "tpl-3");
            });
            it("creates templates when fetches occur", function () {
                KOI.createTemplate("li", document.createElement("li"), 
                    "#test-6");
                var x = KOI.getElements("template", "test-6", 3);
                expect(x).to(be_element_type, "li");
                expect(KOI.getElements("template", "test-6"))
                    .to(have_length, 4);
                KOI.updateElements("template", {text: "a"}, "test-6");
                expect(KOI.getElements("template", "test-6", 0).innerHTML)
                    .to(equal, "a");
            });
        });
    });

}());

