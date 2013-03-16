/*******************************************************************************
 * Copyright (C) 2013 David Pratten
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/


$(document).ready(function () {
    "use strict";
    // object to hold all app-wide state
    var todotxttdi = {};
    todotxttdi.resizetimer = null;
    todotxttdi.reviewtimer = null;
    todotxttdi.savertimer = null;
    todotxttdi.filtertimer = null;
    todotxttdi.helpon = false;
    todotxttdi.isDirty = false;
    todotxttdi.currFilter = "1";
    todotxttdi.prevwindowMode = null;
    todotxttdi.windowMode = null;
    todotxttdi.client = null;
    todotxttdi.versionTag = null;
    todotxttdi.nondirtykeys = [16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 91, 92, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145, 233]; //see http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

    $.fn.setCursor = function (newPosition) {
        return this.each(function () {
            this.focus();
            this.setSelectionRange(newPosition, newPosition);
        });
    };

    Date.prototype.dropboxDateTolocalDateString = function () {
        var localDate = new Date(),
            work = new Date();
        work.setTime(this.getTime());
        function pad(n) { return n < 10 ? "0" + n : n; }
        work.setMinutes(work.getMinutes() - localDate.getTimezoneOffset()); //hack to return dropbox UTC date to local date
        return work.getFullYear() + "-"
            + pad(work.getMonth() + 1) + "-"
            + pad(work.getDate()) + " "
            + pad(work.getHours()) + ":"
            + pad(work.getMinutes()) + ":"
            + pad(work.getSeconds());
    };

    Array.prototype.getUnique = function () {
        var o = {},
            a = [],
            i = 0,
            e;
        e = this[i];
        while (e) {
            o[e] = 1;
            i += 1;
            e = this[i];
        }
        for (e in o) {
            if (o.hasOwnProperty(e)) {
                a.push(e);
            }
        }
        return a;
    };

    function resizet1() {
        var t1windowdiff = 172; //$(window).height()-$("#t1").height();
        $("#t1").height($(window).height() - t1windowdiff);
    }

    function compareByRegex(a, b, SortRegEx, capture) {
        capture = capture !== undefined ? capture : 1;  // default to compare regexes first capture

        // any task will sort higher than a completed task 
        if ((a.substring(0, 2) === "x " && b.substring(0, 2) !== "x ") || (a.substring(0, 2) !== "x " && b.substring(0, 2) === "x ")) {
            if (a.substring(0, 2) === "x ") {
                return 1;
            }
            return -1;
        }
        var aval = a.match(SortRegEx),
            bval = b.match(SortRegEx);

        if (aval !== null && bval !== null) {
            if (aval[capture] === bval[capture]) {
                return 0;
            }
            if (aval[capture] > bval[capture]) {
                return 1;
            }
            return -1;
        }
        if (aval === null && bval === null) {
            return 0;
        }
        if (aval !== null) {
            return -1;
        }
        return 1;
    }

    function checkalerts(inString) {
        var myString = inString,
            myRegexp = / #(today|past|tomorrow)\b/g,
            todaystr = Date.parse("today").toString("yyyy-MM-dd"),
            tomorrowstr = Date.parse("tomorrow").toString("yyyy-MM-dd"),
            ContentArr = null,
            idresults = [],
            OutArr = [],
            newReady = false;
        myString = myString.replace(myRegexp, "");
        // add in alerts based on due dates
        myRegexp = /due\:(\d{4}\-\d{2}\-\d{2})/g; //[\-\.a-zA-Z0-9_]+

        myString = myString.replace(myRegexp,

            function (str, p1, offset, s) {
                //console.log(todaystr);
                var newAlert = null;
                if (todaystr > p1) {
                    newAlert = " #past";
                } else if (todaystr === p1) {
                    newAlert = " #today";
                } else if (tomorrowstr === p1) {
                    newAlert = " #tomorrow";
                }
                return str + (newAlert || "");
            });

        //  check for lines that have all the after links cleared
        myRegexp = / #ready\b/g; //[\-\.a-zA-Z0-9_]+
        myString = myString.replace(myRegexp, "");
        ContentArr = myString.split(/[\f\n\r]+/);

        // capture all active id: s  
        myRegexp = /id\:(\S*[a-z0-9_])/i;
        ContentArr.forEach(function (x) {
            var match = myRegexp.exec(x);
            if (match && x.substring(0, 2) !== "x ") {
                if (!idresults[match[1]]) {
                    idresults[match[1]] = true;
                }
            }
        });

        myRegexp = /after\:(\S*[a-z0-9_])/g; //[\-\.a-zA-Z0-9_]+
        ContentArr.forEach(function (x) {
            var found = false,
                hasafters = false,
                match = null;
            match = myRegexp.exec(x);
            while (match) {
                hasafters = true;
                if (idresults[match[1]]) { // always keep completed items in the set not meeting the filter
                    found = true;
                    break;
                }
                match = myRegexp.exec(x);
            }
            OutArr.push(x + (hasafters && !found ? " #ready" : ""));
            if (hasafters && !found) {newReady = true; }
        });

        if (newReady) {
            $("#after_msg").html("<strong>#ready</strong> items are at the top of your list.");
        } else {
            $("#after_msg").text("");
        }
        return OutArr.join("\r\n");

    }

    function filtert1() {
        // check alerts before filtering
        var myString = checkalerts($("#t1").val()),
            ContentArr = null,
            FilterString = null,
            FilterStringArr = [],
            FilterRegEx = [],
            InArr = [],
            OutArr = [],
            PreArr = [];

        if (myString.length === 0) {return; }

        ContentArr = myString.split(/[\f\n\r]+/);
        FilterString = $("#filter" + todotxttdi.currFilter).val();

        // reset all backgrounds
        $("#filter1").css("background-color", "white");
        $("#filter2").css("background-color", "white");
        $("#filter3").css("background-color", "white");
        $("#filter" + todotxttdi.currFilter).css("background-color", "#f0fff0");

        FilterStringArr = FilterString.split(" ");

        FilterStringArr.forEach(function (x) {
            var plainx = "",
                negation = false;
            try {
                if (x.substring(0, 1) === "-") {
                    if (x.length === 1) {throw "can't negate air"; }
                    plainx = x.substring(1, 1000);
                    negation = true;
                } else if (x.substring(0, 1) === "~") {
                    throw "ignore this one";
                } else {
                    plainx = x;
                    negation = false;
                }
                FilterRegEx.push([new RegExp(plainx, "i"), negation]);
                $("filter_error_msg").text("");
            } catch (e) {
                $("filter_error_msg").text("Filter is not valid");
                return;
            }
        });

        localStorage.setItem("filter1", $("#filter1").val());
        localStorage.setItem("filter2", $("#filter2").val());
        localStorage.setItem("filter3", $("#filter3").val());
        localStorage.setItem("currFilter", todotxttdi.currFilter);
        ContentArr.forEach(function (x) {
            if (/ #ready/.test(x)) {
                PreArr.push(x);
            } else if (x.substring(0, 2) === "x ") { // completed always outArr
                if (x.length > 0) {OutArr.push(x); }
            } else {
                if (FilterRegEx.length === 0) {
                    if (x.length > 0) {InArr.push(x); }
                } else {
                    var matched = true;
                    FilterRegEx.forEach(function (regex) {
                        //console.log(regex);
                        if (regex[1]) { // negated
                            matched = matched && !(regex[0].test(x)); //  
                        } else {
                            matched = matched && regex[0].test(x); //  
                        }
                    });
                    if (matched) {
                        InArr.push(x);
                    } else {
                        if (x.length > 0) {OutArr.push(x); }
                    }
                }
            }
        });
        if (PreArr.length + InArr.length + OutArr.length > 0) {$("#t1").val((PreArr.length > 0 ? PreArr.join("\r\n") + "\r\n\r\n" : "") + InArr.join("\r\n") + "\r\n\r\n\r\n" + OutArr.join("\r\n")); }
    }

    function reviewt1() {
        var myString = $("#t1").val(),
            match = null,
            myRegexp = /due\:([\-\+a-z 0-9]*);/i,
            newDate = null,
            dupl = false,
            idresults = {},
            results = [],
            uniqueresults = null;

        // if there is a due:date to format then reformat it and return without other processing
        match = myRegexp.exec(myString);
        if (match) {
            newDate = Date.parse(match[1] === "" ? "today" : match[1]); // default the empty date to today
            if (newDate) { // pass the date literal to datejs from http://www.datejs.com/ to attempt to interpret.
                $("#t1").val(myString.replace(myRegexp, "due:" + newDate.toString("yyyy-MM-dd"))).setCursor(match.index + 14);
                return;
            }
        }

        // if there is a x date to format then reformat it and return without other processing
        myRegexp = /^x ([\-\+a-z 0-9]*);/im; //[\-\.a-zA-Z0-9_]+
        newDate = null;
        match = myRegexp.exec(myString);
        if (match) {
            newDate = Date.parse(match[1] === "" ? "today" : match[1]); // pass the date literal to datejs from http://www.datejs.com/ to attempt to interpret.
            if (newDate) {
                $("#t1").val(myString.replace(myRegexp, "x " + newDate.toString("yyyy-MM-dd"))).setCursor(match.index + 12);
                return;
            }
        }

        // check all id:s are unique  
        myRegexp = /id\:(\S*[a-z0-9_])/g;
        match = myRegexp.exec(myString);
        while (match) {
            if (!idresults[match[1]]) {
                idresults[match[1]] = true;
            } else {
                dupl = true;
                break;
            }
            match = myRegexp.exec(myString);
        }
        if (dupl) {
            $("#duplid_error_msg").text("\"id:" + match[1] + "\" is duplicated.");
        } else {
            $("#duplid_error_msg").text("");
        }

        // add remove sort buttons
        myRegexp = /(^| )([a-zA-Z][a-zA-Z0-9_]+)\:[\-\+a-z0-9_]/gm;
        match = myRegexp.exec(myString);
        while (match) {
            results.push(match[2]);
            match = myRegexp.exec(myString);
        }

        uniqueresults = results.getUnique();

        // remove unnecessary sort buttons
        $("#sortbuttons button").each(function () {
            var extname = null;
            if ($(this).attr("id")) {extname = $(this).attr("id").match(/sortbyext(\w+)/); }
            if (extname) {
                if ($.inArray(extname[1], uniqueresults) === -1) {
                    $("#sortbyext" + extname[1]).remove();
                }
            }
        });

        // add required sort buttons
        uniqueresults.forEach(function (x) {
            if (!$("#sortbyext" + x).length) {
                //create button
                $("#sortbuttons").append("<button id=\"sortbyext" + x + "\">" + x + ":</button>");
                // hook to sorting function
                $("#sortbyext" + x).click(function (event) {
                    var myString = $("#t1").val(),
                        ContentArr = myString.split(/[\f\n\r]+/),
                        SortRegEx = new RegExp("(^| )" + x + ":([\\-\\+a-z0-9_]+)\\b", "i"); // \ needs to be double escaped 
                    ContentArr.sort(
                        function (a, b) {
                            return compareByRegex(a, b, SortRegEx, 2);
                        }
                    );
                    $("#t1").val(ContentArr.join("\r\n"));
                    filtert1();
                    event.preventDefault();
                });
            }
        });

    }

    function switchWindowMode(mode, message) {
        todotxttdi.prevwindowMode = todotxttdi.windowMode;
        todotxttdi.windowMode = mode;
        if (mode === "welcome") {
            $("#welcome").show();
            $("#todotxt").hide();
            $("#helptxt").hide();
            $("#helplink").hide();
            $("#saving_status_msg").text("");
            $("#saving_status_msg").show();
            $("#logout").hide();
            $("#dropboxfail").hide();
            $("#footer").hide();
        } else if (mode === "help") {
            $("#welcome").hide();
            $("#todotxt").hide();
            $("#helptxt").show();
            $("#helplink").attr("src", "cute_ball_stop_help.png");
            $("#helplink").attr("title", "Return to Todo.txt");
            $("#helplink").show();
            $("#saving_status_msg").hide();
            $("#logout").hide();
            $("#dropboxfail").hide();
            $("#footer").hide();
        } else if (mode === "error") {
            $("#welcome").hide();
            $("#todotxt").hide();
            $("#helptxt").hide();
            $("#helplink").hide();
            $("#saving_status_msg").hide();
            $("#logout").hide();
            $("#reportedmsg").text(message);
            $("#dropboxfail").show();
            $("#footer").hide();
        } else if (mode === "use") {
            $("#welcome").hide();
            $("#todotxt").show();
            $("#helptxt").hide();
            $("#helplink").attr("src", "cute_ball_help.png");
            $("#helplink").attr("title", "Show Help");
            $("#helplink").show();
            $("#saving_status_msg").text("");
            $("#saving_status_msg").show();
            $("#logout").show();
            $("#dropboxfail").hide();
            $("#footer").show();
        }
    }

    function dropBoxFailError(error) {
        var errormsg;
        if (error.response) {
            errormsg = error.response.error;
        } else {
            errormsg = error.responseText;
        }
        todotxttdi.isDirty = false; // we abandon the few keystrokes that are unsaved.
        switchWindowMode("error", errormsg);
    }

    function checkonline(msg) {
        todotxttdi.client.stat("todo.txt", function (error, stat) {
            if (error) {
                dropBoxFailError(error);
                return;
            }
        });
    }

    function loadit() {
        todotxttdi.client.readFile("todo.txt", null, function (error, data, stat) {
            if (error) {
                if (error.response.error === "File has been deleted" || error.response.error === "File not found") {
                    todotxttdi.client.writeFile("todo.txt", "", function (error, stat) {
                        if (error) {
                            dropBoxFailError(error);
                            return;
                        }
                        switchWindowMode("use");
                        todotxttdi.isDirty = false;
                        $("#saving_status_msg").text("Created todo.txt in the /Apps/todotxttdi folder");
                        todotxttdi.versionTag = stat.versionTag;
                    });
                } else {
                    dropBoxFailError(error);
                    return;
                }
            } else {
                switchWindowMode("use");
                if (data) {
                    $("#t1").val(data);
                    todotxttdi.isDirty = false;
                    todotxttdi.versionTag = stat.versionTag;
                    reviewt1();
                    filtert1();
                    $("#saving_status_msg").text("Latest (" + stat.modifiedAt.dropboxDateTolocalDateString() + ") version retrieved from Dropbox.");

                }
            }
        });

    }


    function authandload() {
        todotxttdi.client = new Dropbox.Client({
            key: todotxttdi_key,
            sandbox: true
        });
        todotxttdi.client.authDriver(new Dropbox.Drivers.Redirect({
            rememberUser: true
        }));

        todotxttdi.client.authenticate(function (error, client) {
            if (error) {
                dropBoxFailError(error);
                return;
            }
            if (!(client.isAuthenticated())) { // an interactive authentication is required.
                switchWindowMode("welcome");
                return;
            }
            loadit();
            $("#logout").append('<img src="dropbox_stop32.png" title="Disconnect from Dropbox" id="logoutbutton" />');
            $("#logoutbutton").click(
                function (event) {
                    if (todotxttdi.isDirty) {
                        if (!confirm("You have unsaved changes in your todo list. Do you wish to disconnect from Dropbox?")) {
                            return;
                        }
                    }
                    todotxttdi.isDirty = false; // prevent the window from also catching this.
                    todotxttdi.client.signOff(function () {
                        switchWindowMode("welcome");
                        localStorage.setItem("userRequestedAuthentication", "false");
                    });
                    event.preventDefault();
                }
            );
        });
    }

    function saveit() {
        // save to dropbox 
        if ($("#t1").val() !== "" && todotxttdi.client.isAuthenticated()) {
            todotxttdi.client.stat("todo.txt", function (error, stat) {
                if (error) {
                    dropBoxFailError(error);
                    return;
                }
                if (stat.versionTag === todotxttdi.versionTag) {
                    todotxttdi.client.writeFile("todo.txt", $("#t1").val(), function (error, stat) {
                        if (error) {
                            dropBoxFailError(error);
                            return;
                        }
                        todotxttdi.isDirty = false;
                        $("#saving_status_msg").text("All changes saved in Dropbox (" + stat.modifiedAt.dropboxDateTolocalDateString() + ")");
                        todotxttdi.versionTag = stat.versionTag;
                    });
                } else {
                    $("#saving_status_msg").text("Retrieving...");
                    alert("Your todo.txt has been changed using another browser. Retrieving most recent version ... (" + stat.modifiedAt.dropboxDateTolocalDateString() + ")");
                    loadit();
                }
            });
        }

    }

    window.onbeforeunload = function () {
        if (todotxttdi.isDirty) {
            return "You have unsaved changes in your todo list.";
        }
    };

    // resize window and set up resizer
    resizet1();
    $(window).resize(function () {
        clearTimeout(todotxttdi.resizetimer);
        todotxttdi.resizetimer = setTimeout(resizet1, 250);
    });

    // restore filters from local storage
    if (localStorage.getItem("filter1")) {$("#filter1").val(localStorage.getItem("filter1")); }
    if (localStorage.getItem("filter2")) {$("#filter2").val(localStorage.getItem("filter2")); }
    if (localStorage.getItem("filter3")) {$("#filter3").val(localStorage.getItem("filter3")); }
    if (localStorage.getItem("currFilter")) {todotxttdi.currFilter = localStorage.getItem("currFilter"); }

    //auth to dropbox
    $("#connecttodropbox").click(function (event) {
        localStorage.setItem("userRequestedAuthentication", "true");
        authandload();
        event.preventDefault();
    });
    if (localStorage.getItem("userRequestedAuthentication") === "true") {
        authandload();
    } else {
        switchWindowMode("welcome"); 
    }

    $("#t1").keydown(function (e) {
        if ($.inArray(e.which, todotxttdi.nondirtykeys) !== -1) { return; }
        todotxttdi.isDirty = true;
        $("#saving_status_msg").text("Saving...");
        clearTimeout(todotxttdi.reviewtimer);
        todotxttdi.reviewtimer = setTimeout(reviewt1, 500);
        clearTimeout(todotxttdi.savertimer);
        todotxttdi.savertimer = setTimeout(saveit, 5000);
    });

    $("#filter1").keydown(function (e) {
        if ($.inArray(e.which, todotxttdi.nondirtykeys) !== -1) { return; }
        clearTimeout(todotxttdi.filtertimer);
        todotxttdi.currFilter = "1";
        todotxttdi.filtertimer = setTimeout(filtert1, 500);
    });
    $("#filter1").focus(function () {
        clearTimeout(todotxttdi.filtertimer);
        todotxttdi.currFilter = "1";
        todotxttdi.filtertimer = setTimeout(filtert1, 500);
    });

    $("#filter2").keydown(function (e) {
        if ($.inArray(e.which, todotxttdi.nondirtykeys) !== -1) { return; }
        clearTimeout(todotxttdi.filtertimer);
        todotxttdi.currFilter = "2";
        todotxttdi.filtertimer = setTimeout(filtert1, 500);
    });
    $("#filter2").focus(function () {
        clearTimeout(todotxttdi.filtertimer);
        todotxttdi.currFilter = "2";
        todotxttdi.filtertimer = setTimeout(filtert1, 500);
    });

    $("#filter3").keydown(function (e) {
        if ($.inArray(e.which, todotxttdi.nondirtykeys) !== -1) { return; }
        clearTimeout(todotxttdi.filtertimer);
        todotxttdi.currFilter = "3";
        todotxttdi.filtertimer = setTimeout(filtert1, 500);

    });
    $("#filter3").focus(function () {
        clearTimeout(todotxttdi.filtertimer);
        todotxttdi.currFilter = "3";
        todotxttdi.filtertimer = setTimeout(filtert1, 500);
    });

    $(window).focus(function () {
        if (todotxttdi.windowMode === "use") {checkonline(""); }
    });

    $("#helplink").click(function (event) {
        if (todotxttdi.helpon) {
            switchWindowMode("use");
            todotxttdi.helpon = false;
        } else {
            switchWindowMode("help");
            todotxttdi.helpon = true;
        }
        event.preventDefault();
    });

    $("#sortalphanumeric").click(function (event) {
        var myString = $("#t1").val(),
            ContentArr = myString.split(/[\f\n\r]+/);
        //alert(ContentArr[3]);
        ContentArr.sort();
        $("#t1").val(ContentArr.join("\r\n"));
        filtert1();
        event.preventDefault();
    });

    $("#sortbyproject").click(function (event) {
        var myString = $("#t1").val(),
            ContentArr = myString.split(/[\f\n\r]+/),
            SortRegEx = /(^| )\+(\S*[a-z0-9_])\b/i;
        ContentArr.sort(function (a, b) {
            return compareByRegex(a, b, SortRegEx, 2);
        });
        $("#t1").val(ContentArr.join("\r\n"));
        filtert1();
        event.preventDefault();
    });

    $("#sortbypriority").click(function (event) {
        var myString = $("#t1").val(),
            ContentArr = myString.split(/[\f\n\r]+/),
            SortRegEx = /^\(([A-Z])\) /;
        ContentArr.sort(function (a, b) {
            return compareByRegex(a, b, SortRegEx);
        });
        $("#t1").val(ContentArr.join("\r\n"));
        filtert1();
        event.preventDefault();
    });

    $("#sortbycreation").click(function (event) {
        var myString = $("#t1").val(),
            ContentArr = myString.split(/[\f\n\r]+/),

        //matches the `` creation dates below
        //    x 2012-09-01 `2011-09-08` @gp checkup on blood sugars due:2012-10-03
        //    `2011-09-08` @gp checkup on blood sugars due:2012-10-03
        //    (D) `2011-09-08` @gp checkup on blood sugars due:2012-10-03


            SortRegEx = /^(?:\([A-Z]\) )?(?:x \d{4}\-\d{2}\-\d{2} )?(\d{4}\-\d{2}\-\d{2})/;
        ContentArr.sort(function (a, b) {
            return compareByRegex(a, b, SortRegEx);
        });
        $("#t1").val(ContentArr.join("\r\n"));
        filtert1();
        event.preventDefault();
    });

    $("#sortbycontext").click(function (event) {
        var myString = $("#t1").val(),
            ContentArr = myString.split(/[\f\n\r]+/),
            SortRegEx = /(^| )@(\S*[a-z0-9_])\b/i;
        ContentArr.sort(function (a, b) {
            return compareByRegex(a, b, SortRegEx, 2);
        });
        $("#t1").val(ContentArr.join("\r\n"));
        filtert1();
        event.preventDefault();
    });

    $("#sortbyhashtag").click(function (event) {
        var myString = $("#t1").val(),
            ContentArr = myString.split(/[\f\n\r]+/),
            SortRegEx = /(^| )#(\S*[a-z0-9_])\b/i;
        ContentArr.sort(function (a, b) {
            return compareByRegex(a, b, SortRegEx, 2);
        });
        $("#t1").val(ContentArr.join("\r\n"));
        filtert1();
        event.preventDefault();
    });
});