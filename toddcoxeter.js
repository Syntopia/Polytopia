function Table(name, genList) {
    this.name = name;
    this.genList = genList;
    this.rows = [];
    this.rowCosets = [];
    this.firstEmpty = [];
    this.lastEmpty = [];
    this.rowForCoset = new Map();
    this.firstNonClosed = 0;
}

Table.prototype = {
    constructor: Relations,

    toHTML: function (symbolMapper) {
        var s = "<div id='table-scroll'><table class='blueTable'><thead><th>" + this.name + "</th>";
        for (var i = 0; i < this.genList.length; i++) {
            s += "<th>" + symbolMapper(this.genList[i]) + "</th>";
        }
        s += "</thead>";
        for (var i = 0; i < this.rows.length; i++) {
            s += "<tr><td>" + this.rowCosets[i] + "</td>";
            for (var j = 0; j < this.genList.length; j++) {
                var o = this.rows[i][j];
                s += "<td>" + (o == undefined ? "" : o) + "</td>";
            }
            s += "</tr>";
        }
        s += "</table></div>";
        return s;
    },

    getFirstNonClosed: function () {
        while (this.firstEmpty[this.firstNonClosed] == -1) {
            this.firstNonClosed++;
        }
        return this.firstNonClosed;
    },

    setAsCosetTable: function () {
        this.generatorCosetLookup = new Map();
    },

    setCosetEntry: function (cosetRow, g, newCoset) {
        this.rows[cosetRow][g] = newCoset;
        this.generatorCosetLookup.set(g * 100000 + newCoset, cosetRow);
    },

    // Check whether the coset table has an entry for generator 'g', which points to 'coset'.
    findRowPointingToCoset: function (g, coset) {
        return this.generatorCosetLookup.get(g * 100000 + coset);
    },


    addRow: function (coset) {
        this.rowCosets.push(coset);
        this.rowForCoset.set(coset, this.rowCosets.length - 1);
        this.rows.push(new Array(this.genList.length));

    },

    addRelationRow: function (coset) {
        if (this.isSubgroup) return;
        this.addRow(coset);
        var r = this.rows[this.rows.length - 1];
        r[r.length - 1] = coset;
        this.firstEmpty.push(0);
        this.lastEmpty.push(r.length - 2);
    },

    getCosetRow: function (coset) {
        return this.rowForCoset.get(coset);
    },

    set: function (row, col, value) {
        this.rows[row][col] = value;
        var closed = false;
        if (this.firstEmpty[row] == col) {
            if (this.rows[row][col + 1] == undefined) {
                this.firstEmpty[row] = col + 1;
            } else {
                this.firstEmpty[row] = -1;
                this.lastEmpty[row] = -1;
                closed = true;
            }
        }
        if (this.lastEmpty[row] == col) {
            if (col == 0) {
                throw "Unexpected";
            }
            if (this.rows[row][col - 1] == undefined) {
                this.lastEmpty[row] = col - 1;
            } else {
                this.firstEmpty[row] = -1;
                this.lastEmpty[row] = -1;
                closed = true;
            }
        }

        return closed;
    }
}

function parseString(generatorMap, string) {
    var rules = string.replace(/\s/g, ''); // strip whitespace
    rules = rules.split(",");
    var list = [];
    rules.forEach(function (r) {
        var rel = [];
        for (var i = 0; i < r.length; i++) {
            var genIndex = generatorMap.get(r[i]);
            rel.push(genIndex);
        }
        list.push(rel);
    });
    return list;
}

function Relations(relationString) {
    relationString = relationString.replace(/\s/g, ''); // strip whitespace
    console.log("Relations:", relationString);

    this.generators = [];
    var self = this;

    var set = new Set();
    var stripped = relationString.replace(/,/g, '');
    for (var i = 0; i < stripped.length; i++) set.add(stripped[i]);
    set.forEach(function (v) { self.generators.push(v) });


    this.genMap = new Map();
    for (var i = 0; i < this.generators.length; i++) {
        this.genMap.set(this.generators[i], i);
    }

    //	console.log("Generators:", this.generators);

    this.list = parseString(this.genMap, relationString);
    //this.printRelations();
}

Relations.prototype = {
    constructor: Relations,

    build: function () { },

    printRelations: function () {
        var self = this;
        this.list.forEach(function (r) {
            console.log(self.toSymbols(r));
        });
    },

    toSymbols: function (list) {
        var self = this;
        return list.reduce(function (s, e) { return s + self.generators[e] }, "");
    }
}

function ToddCoxeter(relationString, subgroupString) {
    relationString = relationString.replace(/;/g, ',');

    this.rels = new Relations(relationString);
    var gs = [];
    for (var i = 0; i < this.rels.generators.length; i++) gs.push(i);
    this.cosetTable = new Table("Coset", gs);
    this.cosetTable.setAsCosetTable();
    this.cosetTable.addRow(0);

    this.newInformation = [];

    this.relationTables = [];

    for (var i = 0; i < this.rels.list.length; i++) {
        var t = new Table("R" + i, this.rels.list[i]);
        t.addRelationRow(0);
        this.relationTables.push(t);
    }

    if (subgroupString != undefined) {
        subgroupString = subgroupString.replace(/;/g, ',');
        console.log("subgroupString:", subgroupString);
        var subgroupList = parseString(this.rels.genMap, subgroupString);

        for (var i = 0; i < subgroupList.length; i++) {

            var subgroup = subgroupList[i];
            if (subgroup.length == 1) {
                // No need to create a subgroup table - we will just fill in the coset table to begin with
                this.cosetTable.rows[0][subgroup[0]] = 0;
            } else {
                var t = new Table("Subgroup " + i, subgroup);
                t.addRelationRow(0);
                t.isSubgroup = true;
                this.relationTables.push(t);
            }
        }
    }

    //this.debugState();

}

ToddCoxeter.prototype = {
    constructor: ToddCoxeter,

    debugState: function () {
        var self = this;
        var mapper = function (e) { return self.rels.generators[e]; };
        var out = this.cosetTable.toHTML(mapper) ;

        for (var i = 0; i < this.relationTables.length; i++) {
            out += this.relationTables[i].toHTML(mapper) ;
        }

        document.getElementById('tables').innerHTML = out;

    },

    getTables: function() {
        var self = this;
        var mapper = function (e) { return self.rels.generators[e]; };
        var out = this.cosetTable.toHTML(mapper) ;
        
        for (var i = 0; i < self.relationTables.length; i++) {
            out += self.relationTables[i].toHTML(mapper) ;
        }
        return out;
    },

    addRow: function (coset) {
        this.rowCosets.push(coset);
        this.rows.push(new Array(this.genList.length));
    },

    solve: function () {
        var startTime = Date.now();
        
        var doIteration = this.initSolver();
        while (doIteration()) {};

        console.log("Elapsed: " + (Date.now() - startTime) + " ms. Cosets: " + this.cosetTable.rows.length);
        this.cosetCounts = this.cosetTable.rows.length;
        console.log(" ");
        return this.cosetCounts;
    },

    initSolver: function () {
        var cosetCounter = 1; // Initially we have one coset.
        var self = this;

        var firstEmptyCosetEntryX = 0;

        // Returns (row, coset, generatorIndex)
        function firstEmptyCosetEntry() {
            for (var row = firstEmptyCosetEntryX; row < self.cosetTable.rows.length; row++) {
                var coset = self.cosetTable.rowCosets[row];
                for (var col = 0; col < self.cosetTable.rows[row].length; col++) {
                    if (self.cosetTable.rows[row][col] == undefined) {
                        firstEmptyCosetEntryX = row;

                        return [row, coset, col];
                    }
                }
            }
            return undefined;
        }

        function updateRelationTable2() {
            for (var i = 0; i < self.relationTables.length; i++) {
                var rt = self.relationTables[i];

                for (var row = rt.getFirstNonClosed(); row < rt.rows.length; row++) {

                    var changes = true;

                    while (changes) {
                        changes = false;

                        // Check from left
                        var firstEmpty = rt.firstEmpty[row];
                        if (firstEmpty == -1) continue;

                        if (rt.rows[row][firstEmpty] !== undefined) throw "Inconsistent state";

                        var coset = (firstEmpty == 0 ? rt.rowCosets[row] : rt.rows[row][firstEmpty - 1]);
                        var gen = rt.genList[firstEmpty];

                        var cTableRow = self.cosetTable.getCosetRow(coset);
                        var newCoset = self.cosetTable.rows[cTableRow][gen];
                        if (newCoset != undefined) {
                            var closed = rt.set(row, firstEmpty, newCoset);
                            if (closed) {
                                // New information: newCoset * rt.genList[firstEmpty+1] = rt.rows[row][firstEmpty+1]
                                self.newInformation.push([newCoset, rt.genList[firstEmpty + 1], rt.rows[row][firstEmpty + 1]]);
                            } else {
                                changes = true;
                            }
                        }

                        // Check from right
                        if (rt.lastEmpty[row] == -1) continue;
                        var lastEmpty = rt.lastEmpty[row];
                        //if (rt.rows[row][lastEmpty] !== undefined) throw "Inconsistent state";

                        var newCoset = rt.rows[row][lastEmpty + 1];
                        var gen = rt.genList[lastEmpty + 1];

                        
                        var ctRow = self.cosetTable.findRowPointingToCoset(gen, newCoset);
                        if (ctRow != undefined) {
                            var closed = rt.set(row, lastEmpty, self.cosetTable.rowCosets[ctRow]);
                            if (closed) {
                                var coset = (lastEmpty > 0 ? rt.rows[row][lastEmpty - 1] : rt.rowCosets[row]);
                                if (coset == undefined) {
                                    debugger;
                                }
                                self.newInformation.push(
                                    [coset, rt.genList[lastEmpty], self.cosetTable.rowCosets[ctRow]]);

                            } else {
                                changes = true;
                            }
                        }

                    }
                }
            }
        }


        function addCoset(newCoset) {
            for (var i = 0; i < self.relationTables.length; i++) {
                var rt = self.relationTables[i];
                rt.addRelationRow(newCoset);
            }
            self.cosetTable.addRow(newCoset);
        }


        var f = function doIteration() {
            if (cosetCounter > 15000) {
                return false;
            }
            if (self.newInformation.length == 0) {
                // Find first empty entry in coset table.
                var entry = firstEmptyCosetEntry();
                if (entry == undefined) return false;

                var newCoset = cosetCounter++;
                var row = entry[0];
                var coset = entry[1];
                var g = entry[2];
                self.cosetTable.setCosetEntry(row, g, newCoset);
                //this.cosetTable.rows[row][g] = newCoset;

                addCoset(newCoset);

                // The reverse relation must be present as well.
                var newCosetRow = self.cosetTable.getCosetRow(newCoset);

                //this.cosetTable.rows[newCosetRow][g] = coset;
                self.cosetTable.setCosetEntry(newCosetRow, g, coset);

            } else {
                while (self.newInformation.length > 0) {
                    var i = self.newInformation.pop();

                    // coset*g = newCoset
                    var coset = i[0];
                    var g = i[1]; 
                    var newCoset = i[2];

                    var cosetRow = self.cosetTable.getCosetRow(coset);
                    var val = self.cosetTable.rows[cosetRow][g];

                    if (val == undefined) {
                        //this.cosetTable.rows[cosetRow][g] = newCoset;
                        self.cosetTable.setCosetEntry(cosetRow, g, newCoset);

                    } else {
                        if (val != newCoset) {
                            debugger;
                        }
                    }

                    // per symmetry: newCoset*g = coset
                    var cosetRow = self.cosetTable.getCosetRow(newCoset);
                    var val = self.cosetTable.rows[cosetRow][g];
                    if (val == undefined) {
                        //this.cosetTable.rows[cosetRow][g] = coset;
                        self.cosetTable.setCosetEntry(cosetRow, g, coset);

                    } else {
                        if (val != coset) {
                            debugger;
                        }
                    }


                }
            }

            updateRelationTable2();

            //	this.debugState();
            //	debugger;
            return true;
        }
        return f;
    },

    // Return first element in each coset.
    getRepresentiveForCoset: function (cosetIndex) {
        // Note: representatives are stored in reverse order, e.g. for generators r,g,b, the list [0,1,2,2] means bbrgH
        if (this.cosetTable.reps == undefined) {
            this.cosetTable.reps = new Array(this.cosetTable.rows.length);
            this.cosetTable.reps[0] = [];

            for (var i = 0; i < this.cosetTable.rows.length; i++) {
                if (this.cosetTable.reps[i] == undefined) { throw "unexpected"; }

                for (var j = 0; j < this.cosetTable.rows[i].length; j++) {
                    var coset = this.cosetTable.rows[i][j];
                    if (this.cosetTable.reps[coset] == undefined) {
                        var newRep = this.cosetTable.reps[i].slice(0);
                        newRep.push(j);

                        this.cosetTable.reps[coset] = newRep;
                        console.log("Settings coset " + coset + " to " + newRep + " = " + this.getRepresentiveString(newRep));
                    }
                }
            };
        };
        //	debugger;
        return this.cosetTable.reps[cosetIndex];
    },

    getRepresentivesForCosets: function () {
        var l = [];
        for (var i = 0; i < this.cosetTable.rows.length; i++) {
            l.push(this.getRepresentiveForCoset(i));
        }
        return l;
    },

    getRepresentiveString: function (list) {
        var s = "";
        for (var i = list.length - 1; i >= 0; i--) {
            s += this.rels.generators[list[i]];
        }
        return s;
    },

    // Note: representatives are stored in reverse order, e.g. for generators r,g,b, the list [0,1,2,2] means bbrgH
    getCosetForRepresentive: function (list, initial) {
        var coset = (initial == undefined ? 0 : initial);
        for (var i = 0; i < list.length; i++) {
            coset = this.cosetTable.rows[coset][list[i]];
        }
        return coset;
    },

    getCosetsForRepresentives: function (list) {
        var cosetList = [];
        for (var i = 0; i < list.length; i++) {
            cosetList.push(this.getCosetForRepresentive(list[i]));
        }
        return cosetList;
    }
    ,

    getCosetCounts: function () {
        return this.cosetCounts;
    },

    // If this instance use subset of symbols, get a map from subset to containing set.
    translate: function (listOfWords, newToddCoxeter) {
        var mapping = new Array(this.rels.generators.length);
        for (var i = 0; i < this.rels.generators.length; i++) {
            var newIndex = newToddCoxeter.rels.genMap.get(this.rels.generators[i]);
            if (newIndex == undefined) throw "Failed to find symbol " + this.rels.generators[i] + " in larger set";
            mapping[i] = newIndex;
        }

        var out = new Array(listOfWords.length);
        for (var i = 0; i < listOfWords.length; i++) {
            var newWord = new Array(listOfWords[i].length);
            for (var j = 0; j < listOfWords[i].length; j++)
                newWord[j] = mapping[listOfWords[i][j]];
            out[i] = newWord;
        }
        return out;
    },

    apply: function (wordList, cosetList) {
        var out = new Array(wordList.length);
        for (var i = 0; i < wordList.length; i++) {
            var transformedCosetList = new Array(cosetList.length);
            for (var j = 0; j < cosetList.length; j++) {
                transformedCosetList[j] = this.getCosetForRepresentive(wordList[i], cosetList[j]);
            }
            out[i] = transformedCosetList;
        }
        return out;
    }
}