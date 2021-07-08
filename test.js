function addHeadsToListTest(){
    describe("addHeadsToListTest.html", function() {   
        describe("copyNode", function() {
                let testNode;
                beforeEach(function() {
                    testNode = {
                        id: "root",
                        cat: "phi",
                        children: [
                            {id: "kid1", cat: "w",},
                            {id: "kid2", cat: "w",},
                            {
                                id: "intermediate",
                                cat: "phi",
                                children: [
                                    {id: "kid3", cat: "w",},
                                    {id: "kid4", cat: "w",},
                                    {id: "kid5", cat: "w",},
                                ],
                            },
                        ],
                    };
                });

                it("notEqual", function () {
                    assert.notEqual(testNode, copyNode(testNode));
                });

                it("but deepEqual", function () {
                    assert.deepEqual(testNode, copyNode(testNode));
                });

                it("and don't follow eachother", function () {
                    let nodeCopy = copyNode(testNode);
                    testNode.head = true;
                    assert.isUndefined(nodeCopy.head);

                    nodeCopy.cat = 'i';
                    assert.equal(testNode.cat, 'phi');
                });

                it("Recursive copy", function () {
                    assert.notEqual(testNode.children[0], copyNode(testNode).children[0]);
                });
            });

            describe("isHeaded", function() {
                let testNode;

                beforeEach(function() {
                    testNode = {
                        id: "root",
                        cat: "phi",
                        children: [
                            {id: "kid1", cat: "w",},
                            {id: "kid2", cat: "w",},
                            {id: "kid3", cat: "w",},
                            {id: "kid4", cat: "w",},
                            {id: "kid5", cat: "w",},
                        ],
                    };
                });

                it("Identifies left-headed node", function () {
                    testNode.children[0].head = true;
                    assert.isTrue(isHeaded(testNode));
                });

                it("Identifies right-headed node", function () {
                    testNode.children[4].head = true;
                    assert.isTrue(isHeaded(testNode));
                });
                it("Identifies middle-headed node", function () {
                    testNode.children[2].head = true;
                    assert.isTrue(isHeaded(testNode));
                });

                it("Identifies unheaded node", function () {
                    assert.isFalse(isHeaded(testNode));
                });
            });

            describe("addLeftHead", function() {
                let testNode;

                beforeEach(function() {
                    testNode = addLeftHead({
                        id: "root",
                        cat: "phi",
                        children: [
                            {id: "kid1", cat: "w",},
                            {id: "kid2", cat: "w",},
                            {id: "kid3", cat: "w",},
                            {id: "kid4", cat: "w",},
                            {id: "kid5", cat: "w",},
                        ],
                    });
                });

                it("Result is Headed", function () {
                    assert.isTrue(isHeaded(testNode));
                });
                
                it("Left node is head", function () {
                    assert.isTrue(testNode.children[0].head);
                });

                it("Non-left nodes are not headed", function () {
                    for(let child of testNode.children.slice(1)) {
                        assert.isUndefined(child.head);
                    }
                });

                it("Does not break if given terminal", function () {
                    assert.isOk(addLeftHead(testNode.children[4]));
                });

                it("Does not bread if given an already left-headed node", function () {
                    assert.isOk(addLeftHead(testNode));
                });
            });

            describe("addRightHead", function() {
                let testNode;

                beforeEach(function() {
                    testNode = addRightHead({
                        id: "root",
                        cat: "phi",
                        children: [
                            {id: "kid1", cat: "w",},
                            {id: "kid2", cat: "w",},
                            {id: "kid3", cat: "w",},
                            {id: "kid4", cat: "w",},
                            {id: "kid5", cat: "w",},
                        ],
                    });
                });

                it("Result is Headed", function () {
                    assert.isTrue(isHeaded(testNode));
                });
                
                it("Right node is head", function () {
                    assert.isTrue(testNode.children[4].head);
                });

                it("Non-right nodes are not headed", function () {
                    for(let child of testNode.children.slice(0, 4)) {
                        assert.isUndefined(child.head);
                    }
                });

                it("Does not break if given terminal", function () {
                    assert.isOk(addRightHead(testNode.children[0]));
                });

                it("Does not break if given an already right-headed node", function () {
                    assert.isOk(addRightHead(testNode));
                });
            });

            describe("getMinimalNodes", function() {
                it("{(a) b}", function () {
                    let testList = getMinimalNodes({id: 'root', cat: 'i', children: [
                        {
                            id: 'intermediate',
                            cat: 'phi',
                            children: [{id: "a", cat: "w",}],
                        },
                        {id: "b", cat: "w",},
                    ]});
                    assert.lengthOf(testList, 1);
                    assert.equal(testList[0].children[0].id, 'a');
                });

                it("(a (b (c)))", function () {
                    let testList = getMinimalNodes({
                        id: 'root',
                        cat: 'phi',
                        children: [
                            {id: 'a', cat: 'w'},
                            {
                                id: 'intermediate',
                                cat: 'phi',
                                children: [
                                    {id: 'b', cat: 'w'},
                                    {
                                        id: 'minimal',
                                        cat: 'phi',
                                        children: [
                                            {id: 'c', cat: 'w'}
                                        ]
                                    }
                                ]
                            }
                        ]
                    });
                    assert.lengthOf(testList, 1);
                    assert.equal(testList[0].children[0].id, 'c')
                });
            });

            describe("genHeadsForTree", function() {
                let testTrees = {
                    '(a)': {id: 'root', cat: 'phi', children: [
                            {id: "a", cat: "w",},
                        ],
                    },
                    '(a b c)': {id: 'root', cat: 'phi', children: [
                            {id: "a", cat: "w",},
                            {id: "b", cat: "w",},
                            {id: "c", cat: "w",},
                        ],
                    },
                    '{(a) b}': {id: 'root', cat: 'i', children: [
                            {
                                id: 'intermediate',
                                cat: 'phi',
                                children: [{id: "a", cat: "w",}],
                            },
                            {id: "b", cat: "w",},
                        ],
                    },
                };

                it("Correct length for (a): (a*)", function () {
                    assert.lengthOf(genHeadsForTree(testTrees['(a)']), 1);
                });

                it("All headed for (a)", function () {
                    for(let tree of genHeadsForTree(testTrees['(a)'])) {
                        assert.isTrue(isHeaded(tree));
                    };
                });

                it("Original (a) unchanged", function () {
                    node = testTrees['(a)'];
                    assert.isUndefined(node.head);
                });

                it("Correct length of (a b c): (a* b c) and (a b c*)", function () {
                    assert.lengthOf(genHeadsForTree(testTrees['(a b c)']), 2);
                });

                it("All headed for (a b c)", function () {
                    for(let tree of genHeadsForTree(testTrees['(a b c)'])) {
                        assert.isTrue(isHeaded(tree));
                    };
                });

                it("All one-headed for (a b c)", function () {
                    let tree1, tree2;
                    for(let tree of genHeadsForTree(testTrees['(a b c)'])) {
                        let numOfHeads = 0;
                        for(let terminal of tree.children) {
                            numOfHeads += terminal.head ? 1 : 0;
                        }
                        assert.equal(numOfHeads, 1);
                    }
                });

                it("All unique for (a b c)", function () {
                    let tree1, tree2;
                    [tree1, tree2] = genHeadsForTree(testTrees['(a b c)']);
                    assert.notDeepEqual(tree1, tree2);
                });

                it("Doesn't break when non-exhaustive", function () {
                    assert.lengthOf(genHeadsForTree(testTrees['{(a) b}']), 1);
                });

                it("Works for {(a b) (c d) (e f) (g h) (i j)}", function () {
                    var aj = {
                        "id": "CP1",
                        "cat": "cp",
                        "children": [
                            {
                                "cat": "phi",
                                "id": "XP_11",
                                "children": [
                                    {
                                        "id": "a",
                                        "cat": "x0"
                                    },
                                    {
                                        "id": "b",
                                        "cat": "x0"
                                    }
                                ]
                            },
                            {
                                "cat": "phi",
                                "id": "XP_12",
                                "children": [
                                    {
                                        "id": "c",
                                        "cat": "x0"
                                    },
                                    {
                                        "id": "d",
                                        "cat": "x0"
                                    }
                                ]
                            },
                            {
                                "cat": "phi",
                                "id": "XP_13",
                                "children": [
                                    {
                                        "id": "e",
                                        "cat": "x0"
                                    },
                                    {
                                        "id": "f",
                                        "cat": "x0"
                                    }
                                ]
                            },
                            {
                                "cat": "phi",
                                "id": "XP_14",
                                "children": [
                                    {
                                        "id": "g",
                                        "cat": "x0"
                                    },
                                    {
                                        "id": "h",
                                        "cat": "x0"
                                    }
                                ]
                            },
                            {
                                "cat": "phi",
                                "id": "XP_15",
                                "children": [
                                    {
                                        "id": "i",
                                        "cat": "x0"
                                    },
                                    {
                                        "id": "j",
                                        "cat": "x0"
                                    }
                                ]
                            }
                        ]
                    }
                    var expectedAJoutputString = '[{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":true},{"id":"j","cat":"x0"}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":true},{"id":"h","cat":"x0"}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":true},{"id":"f","cat":"x0"}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":true},{"id":"d","cat":"x0"}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":true},{"id":"b","cat":"x0"}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]},{"id":"CP1","cat":"cp","children":[{"cat":"phi","id":"XP_11","children":[{"id":"a","cat":"x0","head":false},{"id":"b","cat":"x0","head":true}]},{"cat":"phi","id":"XP_12","children":[{"id":"c","cat":"x0","head":false},{"id":"d","cat":"x0","head":true}]},{"cat":"phi","id":"XP_13","children":[{"id":"e","cat":"x0","head":false},{"id":"f","cat":"x0","head":true}]},{"cat":"phi","id":"XP_14","children":[{"id":"g","cat":"x0","head":false},{"id":"h","cat":"x0","head":true}]},{"cat":"phi","id":"XP_15","children":[{"id":"i","cat":"x0","head":false},{"id":"j","cat":"x0","head":true}]}]}]';
                    assert.equal(expectedAJoutputString, JSON.stringify(genHeadsForTree(aj)));
                });
            });

            describe("genHeadsForList", function() {
                let testTrees, testGENoutput, expectedOutput;
                beforeEach(function() {
                    testTrees = [
                        {id: 'root', cat: 'phi', children: [
                            {id: 'supra-a', cat: 'phi', children: [
                                {cat: 'w', id: 'a'}
                            ]},
                            {cat: 'w', id: 'b'},
                            {id: 'supra-c', cat: 'phi', children: [
                                {cat: 'w', 'id': 'c'}
                            ]}
                        ]},
                        {id: 'root', cat: 'i', children: [
                            {id: 'supra-a', cat: 'phi', children: [
                                {cat: 'w', id: 'a'}
                            ]},
                            {cat: 'w', id: 'b'},
                            {id: 'supra-c', cat: 'phi', children: [
                                {cat: 'w', 'id': 'c'}
                            ]}
                        ]},
                    ]
                    testGENoutput = [[{}, testTrees[0]], [{}, testTrees[1]]]
                    expectedOutput = [
                        {id: 'root', cat: 'phi', children: [
                            {id: 'supra-a', cat: 'phi', children: [
                                {cat: 'w', id: 'a', head: true}
                            ]},
                            {cat: 'w', id: 'b'},
                            {id: 'supra-c', cat: 'phi', children: [
                                {cat: 'w', 'id': 'c', head: true}
                            ]}
                        ]},
                        {id: 'root', cat: 'i', children: [
                            {id: 'supra-a', cat: 'phi', children: [
                                {cat: 'w', id: 'a', head: true}
                            ]},
                            {cat: 'w', id: 'b'},
                            {id: 'supra-c', cat: 'phi', children: [
                                {cat: 'w', 'id': 'c', head: true}
                            ]}
                        ]},
                    ]
                });
                it("works for gen output (pairs of trees)", function () {
                    var expectedPairsOutput = [];
                    for(let i in expectedOutput){
                        expectedPairsOutput.push([{}, expectedOutput[i]]);
                    }
                    assert.deepEqual(expectedPairsOutput, genHeadsForList(testGENoutput));
                });

                it("works for list of trees", function () {
                    assert.deepEqual(expectedOutput, genHeadsForList(testTrees));
                });
            });
        });
}

addHeadsToListTest();//When a test is failed, message() will return information about the options, stree, and ptree being used in the test.
// Helper for Mocha testing. No tests in this file.

function message(stree, ptree, options) {
        options = options || {"no options": 0};
        return `with ${Object.keys(options)},\
        \n\t${parenthesizeTree(stree)} --> ${parenthesizeTree(ptree)}`;
    }

//Same as message(), but also returns the direction of the align constraint (left or right).
function messageAlign(stree, ptree, d, options) {
        options = options || {"no options": 0};
        return `align with direction ${d} and ${Object.keys(options)},\
        \n\t${parenthesizeTree(stree)} --> ${parenthesizeTree(ptree)}`;
    }


function messageGEN(treePairs, expectedPairs, options){
    options = options || {"no options": 0};
    return `with ${Object.keys(options)},\
        \n\tExpected ${convertTreePairsListToString(treePairs)} \n\tto equal ${convertTreePairsListToString(expectedPairs)}`;
}

function convertTreePairsListToString(treeList){
    var pairStringList = [];
    for(let i=0; i<treeList.length; i++){
        let sp = [parenthesizeTree(treeList[i][0]), parenthesizeTree(treeList[i][1])].join(', ');
        pairStringList = pairStringList.concat(sp);
    }
    return pairStringList.join('; ');
}

  
var assert;

function setUpMocha(tag = "save-load-section", index = 0, arg = "tag"){
    mocha.setup('bdd');
    assert = chai.assert;

    const mochaDiv = document.createElement("div");
    mochaDiv.setAttribute("id", "mocha");

    var notResults;
    if (arg === "tag"){
        notResults = document.getElementById(tag); 
    }else{
        notResults = document.getElementsByClassName(tag)[index];
    }
    notResults.insertBefore(mochaDiv, notResults.firstChild);
}// Interface testing with mocha and chai for input validation for string generation.
// Doesn't get auto-tested in the console at present because it requires the interface.

function _rStringInputValidationTest() {
    describe("stringInputValidationTest.js", function(){
        window.confirm = async function(){ //automatically returning true for confirm prompts
           return true;
        }
        describe("Generate trees", function() {
            this.timeout(15000); //timeout at 15000ms
            //override timeout - write done inside the parenthesis of function() 
            //setTimeout(done, #timeout time in ms) for the test you want to change timeout
            it("Generate combinations and permutations not added", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "";
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = [""];
                genTerminalStrings(); 
                assert.equal(document.getElementById("warning").style.display, "none", "Displayed warning when there is none!");
            });

            it("Generate combinations and permutations closed", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "j";
                document.getElementById("spotForm")["genStringsMin"].value = 3;
                document.getElementById("spotForm")["genStringsMax"].value = 3;
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = [""];
                genTerminalStrings();
                assert.equal(document.getElementById("warning").style.display, "block", "Displayed warning not showing!");
            });

            for(let i = 0; i < 11; i++){
                it("Generate number: " + i, function() {
                    document.getElementById("error").style.display = "none";
                    document.getElementById("spotForm")["genStringsInput"].value = "j";
                    document.getElementById("spotForm")["genStringsMin"].value = i;
                    document.getElementById("spotForm")["genStringsMax"].value = i;
                    document.getElementById("spotForm")["genStringsInput"].length = undefined;
                    document.getElementById("stringGeneration").classList = ["open"];
                    genTerminalStrings();
                    if (i == 0 || i == 10){
                        assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
                    }else{
                        assert.equal(document.getElementById("error").style.display, "none", "Displayed error when there is none!");
                    }
                });
            }

            it("Generate no min or max present number", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "j";
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = ["open"];
                genTerminalStrings();
                assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
            });

            it("Generate min or max present not number", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "j";
                document.getElementById("spotForm")["genStringsMin"].value = "j";
                document.getElementById("spotForm")["genStringsMax"].value = "j";
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = ["open"];
                genTerminalStrings();
                assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
            });

            it("Generate min greater than max", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "j"
                document.getElementById("spotForm")["genStringsMin"].value = 5;
                document.getElementById("spotForm")["genStringsMax"].value = 3;
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = ["open"];
                genTerminalStrings();
                assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
            });
        });

        describe("Generate terminal strings", function() {
            this.timeout(15000);
            it("Input not added", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "";
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = ["open"];
                genTerminalStrings(); 
                assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
            });

            for(let i = 0; i < 11; i++){
                it("Generate number: " + i, function() {
                    document.getElementById("error").style.display = "none";
                    document.getElementById("spotForm")["genStringsInput"].value = "j"
                    document.getElementById("spotForm")["genStringsMin"].value = i;
                    document.getElementById("spotForm")["genStringsMax"].value = i;
                    document.getElementById("spotForm")["genStringsInput"].length = undefined;
                    document.getElementById("stringGeneration").classList = ["open"];
                    genTerminalStrings();
                    if (i == 0 || i == 10){
                        assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
                    }else{
                        assert.equal(document.getElementById("error").style.display, "none", "Displayed error when there is none!");
                    }
                });
            }

            it("Generate no min or max present number", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "j";
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = ["open"];
                genTerminalStrings();
                assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
            });

            it("Generate min or max present not number", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "j";
                document.getElementById("spotForm")["genStringsMin"].value = "j";
                document.getElementById("spotForm")["genStringsMax"].value = "j";
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = ["open"];
                genTerminalStrings();
                assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
            });

            it("Generate min greater than max", function() {
                document.getElementById("spotForm")["genStringsInput"].value = "j"
                document.getElementById("spotForm")["genStringsMin"].value = 5;
                document.getElementById("spotForm")["genStringsMax"].value = 3;
                document.getElementById("spotForm")["genStringsInput"].length = undefined;
                document.getElementById("stringGeneration").classList = ["open"];
                genTerminalStrings();
                assert.equal(document.getElementById("error").style.display, "block", "Displayed error not showing!");
            });
        });
    });
}

function runStringInputValidationTest() {
    setUpMocha();
    _rStringInputValidationTest();
    mocha.run();
}// Interface testing with mocha and chai. Tests save/load/clear for string generation on the interface.
// Doesn't get auto-tested in the console at present because it requires the interface.

function _rStringTest() {
    describe("stringTest.js", function(){
        describe("String Generation save/load/clear test", function(){
            var testSettings = '';
            var numOfInputs = 0;
            const arbitraryStrings = ["9000", "9001", "9002", "9003", "4", "3",
             "9006", "5", "2", "9009"]; //strings you would not find anywhere else in the saved analysis
             //apart from 4, 3, 5 and 2, which were needed to avoid messing up the input validation in terminal string generation. They are used as max and min values in the tests "Load with one / two strings"
            var unusedStrings, listDiv, inputs; //assigned beforeEach below


            beforeEach(function() {
                //runs before each "it" block (hence, beforeEach)
                unusedStrings = arbitraryStrings.slice(); //shallow copy, fyi
                listDiv = document.getElementById("listOfTerminals");
                inputs = listDiv.getElementsByTagName("input"); //reset b/c inputs added/removed

                changeInputTabs('goButton', 'inputButton');
            });

            it("Save with one string", function(){
                for(let input of inputs) {
                    // assign an arbitrary string to each input
                    if(input.type === 'text') {
                        numOfInputs ++;
                        input.value = unusedStrings.pop();
                    }
                }
                let savedString = record_analysis();
                testSettings = JSON.parse(savedString).myTrees;
                //object is more useful than string later on. should not change until "two strings" tests

                for(let i = 0; i < numOfInputs.length; i++){
                    //all we need to know now is that the arbitrary strings all ended up in the saved analysis
                    let regex = new RegExp(arbitraryStrings[arbitraryStrings.length - i]);
                    assert(savedString.search(regex) > 0, "Input number " + i + " was not saved");
                }
            });

            it("Clear with one string", function() {
                clearAnalysis();
                for(let input of inputs) {
                    assert(input.value == '', input.name + " is not cleared");
                }
            });

            it("Load with one string", function() {
                //console.log(testSettings);
                //load earlier saved string
                my_built_in_analysis({}, false, testSettings, []);
                //{id:'root', cat:'cp'}, {id:'root', cat:'xp'}
                for(let input of inputs) {
                    //we know the order arbitraryStrings were assigned, check that the same order is preserved
                    assert(input.value === unusedStrings.pop(), input.name + " did not load correctly");
                }
            });
            it("Save with two strings", function() {
                /*All we have to do now is click the "add list of terminals" button to get
                   more terminal string inputs and run the exact same three testcases above.
                   I don't want to factor out the copied code, though, because then clicking
                   on the test case in mocha would be less useful.*/
                
                document.getElementById("addList").click();
                for(let input of inputs) {
                    if(input.type === 'text') {
                        numOfInputs ++;
                        input.value = unusedStrings.pop();
                    }
                }
                let savedString = record_analysis();
                testSettings = JSON.parse(savedString).myTrees;

                for(let i = 0; i < numOfInputs.length; i++){
                    let regex = new RegExp(arbitraryStrings[arbitraryStrings.length - i]);
                    assert(savedString.search(regex) > 0, "Input number " + i + " was not saved");
                }
            });
            it("Clear with two strings", function() {
                clearAnalysis();
                for(let input of inputs) {
                    assert(input.value == '', input.name + " is not cleared");
                }
            });
            it("Load with two strings", function() {
                //console.log(testSettings);
                my_built_in_analysis({}, false, testSettings, []);
                for(let input of inputs) {
                    assert(input.value === unusedStrings.pop(), input.name + " did not load correctly");
                }
            });
        });
    });
}

function runStringTest() {
    setUpMocha();
    _rStringTest();
    mocha.run();
}
