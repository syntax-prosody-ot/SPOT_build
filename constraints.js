/* For the specified lexical item(s), which are assumed to be clitics (category is not checked),
*  assign a violation for every terminal that intervenes between the right edge of the tree
*  and the lexical item.
*/

function alignMorpheme(stree, ptree, clitic, direction){
	if(ptree.cat !== "i" && ptree.cat !== 'iota'){
				displayWarning("You are calling alignMorpheme on a tree that is not rooted in i");
    }
    clitic = clitic.split(';');
    var leaves = getLeaves(ptree);
    var cliticPos = leaves.findIndex(function(element){return clitic.indexOf(element.id) >= 0;});
    if(cliticPos < 0){
				console.warn("alignMorpheme(): The specified morpheme "+clitic+" was not found in this tree");
        cliticPos = 0;
    }
    if (direction == "left"){
    	return cliticPos;
    }
    else{
    	return leaves.length - cliticPos - 1;
    }

}

/* For the specified lexical item(s), which are assumed to be clitics (category is not checked),
*  assign a violation for every terminal that intervenes between the left edge of the tree
*  and the lexical item.
*/

function alignLeftMorpheme(stree, ptree, clitic){
   return alignMorpheme(stree,ptree,clitic,"left");
}

/* For the specified lexical item(s), which are assumed to be clitics (category is not checked),
*  assign a violation for every terminal that intervenes between the right edge of the tree
*  and the lexical item.
*/

function alignRightMorpheme(stree, ptree, clitic){
    return alignMorpheme(stree, ptree, clitic,"right");
}
/* Assign a violation for every node in sTree of category sCat
whose d edge is not aligned with the d edge of a node in pTree
of the prosodic category corresponding to s

For every sCat node s in sTree, find a node p in pTree of the proper category
such that the first (for align-left) leaf dominated by s has the same id as
the first leaf dominated by p.
*/

/*
* Options (all boolean):
* requireLexical: To ignore non-lexical XPs give them an attribute func: true.
*	requireOvertHead: To ignore silently-headed XPs, give them an attribute silentHead: true
*	maxSyntax: If true, ignore non-maximal syntactic nodes (nodes of category c that are
*				dominated by another node of category c)
*	minSyntax: If true, ignore non-minimal syntactic nodes (nodes of category c that dominate
*				another node of category c)
*	nonMaxSyntax: If true, only look at non-maximal syntactic nodes
*	nonMinSyntax: If true, only look at non-minimal syntactic nodes
*	maxProsody: If true, the prosodic match needs to be maximal. Passed to hasMatch.
*	minProsody: If true, the prosodic match needs to be minimal. Passed to hasMatch.
*	nonMaxProsody: If true, the prosodic match must be non-maximal. Passed to hasMatch.
*	nonMinProsody: If true, the prosodic match must be non-minimal. Passed to hasMatch.
*	customPairings: A mapping of custom pairings. Passed to catsMatch.
*	*/
function alignSP(sTree, pTree, sCat, d, options){
	options = options || {};
	
	var getEdge = (d==="left") ? getLeftEdge : getRightEdge;
	var vCount = 0;
	
	walkTree(sTree, function(sNode){
		markMinMax(sNode);
		if((sNode.cat !== sCat)
			|| (options.requireLexical && sNode.func)
			|| (options.requireOvertHead && sNode.silentHead)
			|| (options.maxSyntax && !sNode.isMax)
			|| (options.minSyntax && !sNode.isMin)
			|| (options.nonMaxSyntax && sNode.isMax)
			|| (options.nonMinSyntax && sNode.isMin))	 // only go further if sNode has the category we're interested in
			return;
		var sEdge = getEdge(sNode);
		if(!sEdge)
			sEdge = sNode;	// If sNode is a leaf (which it probably shouldn't be but depending on the tree might be),
								// then look for a p-node that matches sNode itself. TODO is this a good idea?
		var noMatch = true;
		markMinMax(pTree);
		walkTree(pTree, function(pNode){
			if(!catsMatch(sCat, pNode.cat)
				|| (options.maxProsody && !pNode.isMax)
				|| (options.minProsody && !pNode.isMin)
				|| (options.nonMaxProsody && pNode.isMax)
				|| (options.nonMinProsody && pNode.isMin))
				return;
			var pEdge = getEdge(pNode);
			if(!pEdge)
				pEdge = pNode;	//I'm assuming the leaves are words...
			if(sEdge.id === pEdge.id){
				noMatch = false;
				return DONT_WALK_SUBTREES;
			}
		});
		if(noMatch){
				vCount++;
		}

	});
	return vCount;
}

function getLeftEdge(node){
	return getLeaves(node)[0];
}

function getRightEdge(node){
	var leaves = getLeaves(node);
	return leaves[leaves.length-1];
}

function alignPS(sTree, pTree, cat, d, options){
	options = options || {};
	var flippedOptions = {};
	flippedOptions.maxSyntax = options.maxProsody || false;
	flippedOptions.nonMaxSyntax = options.nonMaxProsody || false;
	flippedOptions.minSyntax = options.minProsody || false;
	flippedOptions.nonMinSyntax = options.nonMinProsody || false;
	flippedOptions.maxProsody = options.maxSyntax || false;
	flippedOptions.nonMaxProsody = options.nonMaxSyntax || false;
	flippedOptions.minProsody = options.minSyntax || false;
	flippedOptions.nonMinProsody = options.nonMinSyntax || false;
	flippedOptions.requireLexical = options.requireLexical || false;
	flippedOptions.requireOvertHead = options.requireOvertHead || false;
	return alignSP(pTree, sTree, cat, d, flippedOptions);
}

function alignLeft(sTree, pTree, sCat, options){
	options = options || {};
	return alignSP(sTree, pTree, sCat, 'left', options);
}

function alignRight(sTree, pTree, sCat, options){
	options = options || {};
	return alignSP(sTree, pTree, sCat, 'right', options);
}


function alignLeftPS(sTree, pTree, cat, options){
	options = options || {};
	return alignPS(sTree, pTree, cat, 'left', options);
}

function alignRightPS(sTree, pTree, cat, options){
	options = options || {};
	return alignPS(sTree, pTree, cat, 'right', options);
}

// custom align functions
function alignLeftCustom(sTree, pTree, cat, options){
	return alignSP(sTree, pTree, cat, 'left', options);
}
function alignRightCustom(sTree, pTree, cat, options){
	return alignSP(sTree, pTree, cat, 'right', options);
}
function alignLeftPSCustom(sTree, pTree, cat, options){
	return alignPS(sTree, pTree, cat, 'left', options);
}
function alignRightPSCustom(sTree, pTree, cat, options){
	return alignPS(sTree, pTree, cat, 'right', options);
}
function alignFocus(sTree, pTree, cat, d){
	var getEdge = (d==="left") ? getLeftEdge : getRightEdge;
	var vCount = 0;
	walkTree(sTree, function(sNode){
		if(!sNode.foc)	 // only go further if sNode is a focus node
			return;
		var sEdge = getEdge(sNode);
		if(!sEdge)
			sEdge = sNode;	// If sNode is a leaf (which it probably shouldn't be but depending on the tree might be),
								// then look for a p-node that matches sNode itself. TODO is this a good idea?
		var noMatch = true;
		walkTree(pTree, function(pNode){
			//!catsMatch(sCat, pNode.cat)
			if(pNode.cat !== cat)
				return;
			var pEdge = getEdge(pNode);
			if(!pEdge) 
				pEdge = pNode;	//I'm assuming the leaves are words...
			if(sEdge.id === pEdge.id){
				noMatch = false;
				return false;
			}
		});
		if(noMatch)
			vCount++;
	});
	return vCount;

}
function alignFocLeft(sTree, pTree, cat){
	return alignFocus(sTree, pTree, cat, 'left');
}
function alignFocRight(sTree, pTree, cat){
	return alignFocus(sTree, pTree, cat, 'right');
}
function wrap(sTree, pTree, cat){
	//options = options || {};
	var vCount = 0;
	walkTree(sTree, function(sNode){
		if(sNode.cat !== cat)
			return;
		var noMatch = true;
		sLeaves = getLeaves(sNode);
		walkTree(pTree, function(pNode){
			if(!catsMatch(cat, pNode.cat))
				return;
			if(containsIds(getLeaves(pNode), sLeaves)){	// if the current pNode wraps our sNode
				noMatch = false;
				return false;	 // stop looking for a match
			}
		});
		if(noMatch)
			vCount++;
	});
	return vCount;
}
function wrapPS(sTree, pTree, cat){
	return wrap(pTree, sTree, cat);
}

// Returns true if a contains b
// More precisely, if a contains a set of nodes whose ids are identical to the ids of the nodes in b.
function containsIds(a, b){
	for(var i=0; i<=(a.length-b.length); i++){
		var j=0;
		while((j<b.length)&&(a[i+j].id === b[j].id))
			j++;
		if(j===b.length)
			return true;
	}
	return false;
}
/* Function that takes a prosodic tree and returns a version annotated it with the phonological tones that it would have in Japanese or Lekeitio Basque.
Tones:
	A -> H*L
	left edge of phi -> LH on initial word. NB Here if there are multiple left-aligned phis, only one LH is annotated.
	H following H*L within a maximal phi -> !H (downstep)
Arguments:
	ptree = a prosodic tree
	parentCat = prosodic category of ptree's parent
	afterA = is there a preceding accent in this phi?
*/
function addJapaneseTones(ptree){
	
	function addJapaneseTonesInner(ptree, parentCat, afterA, firstInPhi){
		//Iota: No tonal diagnostics; just call recursively on the children
		if(ptree.cat==='i'){
			if(ptree.children && ptree.children.length){
				for(var child in ptree.children)
				{
					child = addJapaneseTonesInner(ptree.children[child], ptree.cat, false)[0];
				}
			}
		}
		//Phi: domain for downstep
		else if(ptree.cat==='phi'){
			//Non-maximal phi following a pitch-drop is assigned a downstepped LH
			if(parentCat === 'phi' && afterA && !firstInPhi){
				ptree.tones = 'L!H';
			}
			//Otherwise, LH is not downstepped
			else if(!firstInPhi){
				ptree.tones = 'LH';
			}
			
			if(ptree.children && ptree.children.length){			
				for(var child in ptree.children)
				{
					outputs = addJapaneseTonesInner(ptree.children[child], ptree.cat, afterA, child==0);
					child = outputs[0];
					afterA = outputs[1];
				}
			}
		}
		
		else if(ptree.cat === 'w'){
			//Unaccented w

			if(!ptree.hasOwnProperty('accent')){
				//ptree.accent = ptree.id.split('_')[0];
				//accentFromId() is defined in japaneseAccent.js
				ptree = accentFromId(ptree);
			}
			if(ptree.accent){
				ptree.tones = 'H*L';
				if(afterA)
					ptree.tones = '!H*L';
				afterA = true;
			}
			//Accented w
			else{
				ptree.tones = '-';
			}
			//this is only necessary if we have recursive prosodic words...
			// if(
			// outputs = addJapaneseTonesInner(child, ptree.cat, afterA);
			// child = outputs[0];
			// afterA = outputs[1];
		}
		
		else{
			console.log("Unrecognized prosodic category"+ptree.cat);
			ptree.tones = '-';
		}
		
		return [ptree, afterA];
	}
	
	return addJapaneseTonesInner(ptree)[0];
}

/* Function that takes a prosodic tree and returns a version annotated it with the phonological tones that it would have in Irish, according to Elfner (2012)'s diagnostics.
Tones:
	left edge of non-minimal phi: LH
	right edge of any phi: HL
	
Arguments:
	ptree = a prosodic tree
	parentCat = prosodic category of ptree's parent
	afterA = is there a preceding accent in this phi?
*/
function addIrishTones_Elfner(ptree){
	
	function addIrishTones_Elfner_Inner(ptree, getsRise, getsFall){
		//Iota: No tonal diagnostics; just call recursively on the children
		if(ptree.cat==='i'){
			if(ptree.children && ptree.children.length){
				for(var child in ptree.children)
				{
					addIrishTones_Elfner_Inner(ptree.children[child], false, false);
				}
			}
		}
		//Phi: domain for downstep
		else if(ptree.cat==='phi'){		
			if(ptree.children && ptree.children.length){
				
				for(var child = 0; child < ptree.children.length; child++)
				{
					var firstInNonMinPhi = (child === 0 && !isMinimal(ptree));
					var lastInPhi = (child == (ptree.children.length-1));
					//console.log(firstInNonMinPhi);
					addIrishTones_Elfner_Inner(ptree.children[child], (child===0 && (getsRise || firstInNonMinPhi)), lastInPhi);

				}
			}
		}
		
		else if(ptree.cat === 'w'){
			ptree.tones = '';
			if(getsRise){
				ptree.tones += 'LH';
			}
			if(getsFall){
				ptree.tones += 'HL';
			}
			else if(!getsRise && !getsFall){
				ptree.tones = '-';
			}
		}
		
		else{
			console.log("Unrecognized prosodic category"+ptree.cat);
			ptree.tones = '-';
		}
		
		return ptree;
	}
	
	return addIrishTones_Elfner_Inner(ptree);
}

/* Function that takes a prosodic tree and returns a version annotated it with the phonological tones that it would have in Irish, according to our revised diagnostics.
Tones:
	left edge of any phi: LH
	right edge of any phi: HL
	
Arguments:
	ptree = a prosodic tree
	parentCat = prosodic category of ptree's parent
	afterA = is there a preceding accent in this phi?
*/
function addIrishTones_Kalivoda(ptree){
	
	function addIrishTones_Kalivoda_Inner(ptree, getsRise, getsFall){
		//Iota: No tonal diagnostics; just call recursively on the children
		if(ptree.cat==='i'){
			if(ptree.children && ptree.children.length){
				for(var child in ptree.children)
				{
					child = addIrishTones_Kalivoda_Inner(ptree.children[child], false, false);
				}
			}
		}
		
		else if(ptree.cat==='phi'){
			
			if(ptree.children && ptree.children.length){			
				for(var child in ptree.children)
				{
					var firstInPhi = (child == 0);
					var lastInPhi = (child == (ptree.children.length-1));
					child = addIrishTones_Kalivoda_Inner(ptree.children[child], firstInPhi, lastInPhi);
				}
			}
		}
		
		else if(ptree.cat === 'w'){
			ptree.tones = '';
			if(getsRise){
				ptree.tones += 'LH';
			}
			if(getsFall){
				ptree.tones += 'HL';
			}
			if(!getsRise && !getsFall){
				ptree.tones = '-';
			}
		}
		
		else{
			console.log("Unrecognized prosodic category"+ptree.cat);
			ptree.tones = '-';
		}
		
		return ptree;
	}
	
	return addIrishTones_Kalivoda_Inner(ptree);
}
/* Assign a violation for every pair of adjacent sisters 
   with a parent of category cat
   that do not have the same number of children. 
*/
function balancedSistersAdj(stree, ptree, cat){
    var vcount = 0;
    if ((!ptree.children) || ptree.children.length === 0){
        return vcount;
    }

    else{
        if(ptree.cat===cat){
            for(var i = 0; i < ptree.children.length-1; i++){
                var sister1 = ptree.children[i];
                var sister2 = ptree.children[i+1];
                //Make sure there is a defined children array for each sister under consideration
                if(!sister1.children){
                    sister1.children = [];
                } 
                if(!sister2.children){
                    sister2.children = [];
                }
    
                //Assign a violation if the sisters do not have the same number of children
                if(sister1.children.length != sister2.children.length){
                    vcount++;
                }
            }
        }

        for(var j = 0; j<ptree.children.length; j++){
            vcount += balancedSistersAdj(stree, ptree.children[j], cat);
        }

        return vcount;
    }
}

/* Assign a violation for every set of sisters dominated by a node of category cat 
   that do not all have the same number of children.

   Update Oct. 2020: make category specification optional
*/
function balancedSisters(stree, ptree, cat){
    var vcount = 0;

    // Base case: no violation if there are no children
    if ((!ptree.children) || ptree.children.length === 0){
        return vcount;
    }

    else{
        if(!cat || ptree.cat===cat){
            
            // Base case: violation if the children have differing numbers of children
            var imbalanceFound = false;
            var i = 0;
            while(!imbalanceFound && i < ptree.children.length-1){
                var sister1 = ptree.children[i];
                var sister2 = ptree.children[i+1];
                //Make sure there is a defined children array for each sister under consideration
                if(!sister1.children){
                    sister1.children = [];
                } 
                if(!sister2.children){
                    sister2.children = [];
                }

                //Assign a violation if the sisters do not have the same number of children
                if(sister1.children.length != sister2.children.length){
                    imbalanceFound = true;
                }
                i++;
            }
            if(imbalanceFound){
                vcount++;
            }
        }

        // Recurse for every subtree
        for(var j = 0; j<ptree.children.length; j++){
            vcount += balancedSisters(stree, ptree.children[j], cat);
        }

        return vcount;
    }
}

function getChildrenOfCat(ptree, cat){
    if ((!ptree.children) || ptree.children.length === 0)
        return [];
    
    var catChildren = [];
    for(var i in ptree.children){
        if(ptree.children[i].cat===cat)
            catChildren.push(ptree.children[i]);
    }
    return catChildren;
}

/* Assign a violation for every set of sisters of category cat 
   that do not all have the same number of children.
*/
function balSisChildCat(stree, ptree, cat){
    var vcount = 0;

    // Base case: no violation if there are no children
    if ((!ptree.children) || ptree.children.length === 0){
        return vcount;
    }

    // If there are children:
    else
    {     
        // Base case: violation if the children have differing numbers of children
        var imbalanceFound = false;
        var catChildren = getChildrenOfCat(ptree, cat);
        var i = 0;
        while(!imbalanceFound && i < catChildren.length-1){
            var sister1 = catChildren[i];
            var sister2 = catChildren[i+1];
            //Make sure there is a defined children array for each sister under consideration
            if(!sister1.children){
                sister1.children = [];
            } 
            if(!sister2.children){
                sister2.children = [];
            }

            //Assign a violation if the sisters do not have the same number of children
            if(sister1.children.length != sister2.children.length){
                imbalanceFound = true;
            }
            i++;
        }

        if(imbalanceFound){
            vcount++;
        }
        

        // Recurse for every subtree
        for(var j = 0; j<ptree.children.length; j++){
            vcount += balSisChildCat(stree, ptree.children[j], cat);
        }
        
        return vcount;
    }
}/* Assign a violation for every node of category cat 
such that its rightmost child of category (cat-1) 
has more than two children.
*/

function binMaxRightmostBranches(s, ptree, cat) {
  var vcount = 0;
  //base case: we are at leaf && there are no children
  //make sure there is children
  if (ptree.children && ptree.children.length) {
    if (ptree.cat === cat) {
      //check rightmost child
      var rightMost = ptree.children.length - 1;
      var rightMostChild = ptree.children[rightMost];
      if (rightMostChild.children && rightMostChild.children.length > 2) {
        vcount++;
      }       
    }
    //check other nodes in ptree
    for(var i = 0; i < ptree.children.length; i++) {
      vcount += binMaxRightmostBranches(s, ptree.children[i], cat);
    }       
  }
  return vcount;
};

/* Assign a violation for every rightmost node x of category cat such that x dominates (at any level) more than two children of category cat such that x dominates (at any level) more than two children of category cat-1 */
function binMaxRightmostLeaves(s, ptree, cat) {
  //make parent_ptree static variable to keep track of the parent ptree
  if(typeof parent_ptree == 'undefined') {
    parent_ptree = null;
  }
  var vcount = 0;
  //if curr ptree has children
  if(ptree.children && ptree.children.length) {
    //and is the same cat as input cat
    if(ptree.cat === cat) {
      //if there is a parent and the current ptree is the rightmost child of that parent 
      //or if there is not parent but the cat is still the same as the input cat
      if((parent_ptree && ptree === parent_ptree.children[parent_ptree.children.length - 1]) || parent_ptree === null) {
	//count the leaves
        var leaves = findLeaves(ptree);
	//if the leaves exceed 2, increment vcount
	if(leaves > 2) {
          vcount++;
	}
      }
    }
    //code to recursively look through tree
    for(var i = 0; i < ptree.children.length; i++) {
      //set parent_ptree to the current ptree
      parent_ptree = ptree;
      //recursively call on children of ptree
      vcount += binMaxRightmostLeaves(s, ptree.children[i], cat);
    }
  }
  //remove everything in parent_ptree aka reset var to typeof undefined
  delete parent_ptree;
  return vcount;
};

/*helper function I created to count the leaves of a ptree*/
function findLeaves(ptree) {
  var leaves = 0;
  //if this ptree does not dominate another ptree with the same cat
  if(isMinimal(ptree) && ptree.children) {
    //add the number of leaves of the current ptree to the current amount of leaves
    leaves = leaves + ptree.children.length;
  }
  //if there are children
  if(ptree.children && ptree.children.length) {
    //for every children
    for(var i =0; i < ptree.children.length; i++){
      //if they are the same cat as the current ptree
      //count the leaves
      leaves+=findLeaves(ptree.children[i]);
    }
  }
  return leaves;
}


/* Assign a violation for every node of category cat 
such that its rightmost child of category (cat-1) 
has less than two children.
*/

function binMinRightmostBranches(s, ptree, cat) {
  var vcount = 0;
  //base case: we are at leaf && there are no children
  //make sure there is children
  if (ptree.children && ptree.children.length) {
    if (ptree.cat === cat) {
      //check rightmost child
      var rightMost = ptree.children.length - 1;
      var rightMostChild = ptree.children[rightMost];
      if (!rightMostChild.children) {
	rightMostChild.children = [];
      }
      if (rightMostChild.children.length < 2) {
        vcount++;
      }       
    }
    //check other nodes in ptree
    for(var i = 0; i < ptree.children.length; i++) {
      vcount += binMaxRightmostBranches(s, ptree.children[i], cat);
    }       
  }
  return vcount;
};
/* Binarity that cares about the number of branches */

//sensitive to the category of the parent only (2 branches of any type is acceptable)
function binMinBranches(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		if(ptree.cat === cat && ptree.children.length===1){
			//logreport("VIOLATION: "+ptree.id+" has only one child");
			vcount++;
		}
		for(var i = 0; i<ptree.children.length; i++){

			vcount += binMinBranches(s, ptree.children[i], cat);
		}
	}

	return vcount;
}

//This function stops counting the violations once it finds the first one
function binMinBranchesInit(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		if(ptree.cat === cat && ptree.children.length===1){
			//logreport("VIOLATION: "+ptree.id+" has only one child");
			vcount++;
		}
		for(var i = 0; i<ptree.children.length; i++){
			//these are some debugging print codes
			/*console.log("ptree.children.length: "+ ptree.children.length);
			console.log("i: "+ i);
			console.log(ptree.cat);
			console.log('vcount: '+vcount);
			console.log('word: '+ptree.id);
			*/
			if(i === 1){
				break;
			}
			vcount += binMinBranchesInit(s, ptree.children[i], cat);
		}

	}

	return vcount;
}
//sensitive to the category of the parent only (2 branches of any type is acceptable)
//categorical evaluation: 1 violation for every super-binary branching node
function binMaxBranches(s, ptree, cat, n){
	n = typeof(n)==='number'? n : 2;
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		if(ptree.cat === cat && ptree.children.length>n){
			//logreport("VIOLATION: "+ptree.id+" has "+ptree.children.length+" children!");
			vcount++;
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMaxBranches(s, ptree.children[i], cat, n);
		}
	}
	return vcount;
}


//A combined binarity constraint (branch-counting)
function binBranches(stree, ptree, cat, n){
	n = typeof(n)==='number'? n : 2;
	var minCount = binMinBranches(stree, ptree, cat);
	var maxCount = binMaxBranches(stree, ptree, cat, n);
	return minCount+maxCount;
}

/* Category-sensitive branch-counting constraint
* (first proposed by Kalivoda 2019 in "New Analysis of Irish Syntax-Prosody", ms.)
* Assign a violation for every node of category cat that immediately dominates
* more than 2 children of category cat-1
*/
function binMaxBrCatSensitive(s, ptree, cat){
	var vcount = 0;
	var childcat = pCat.nextLower(cat);
	if(ptree.children && ptree.children.length){
		var categorySensitiveBranchCount = 0;
		if(ptree.cat === cat && ptree.children.length>2){
			//logreport("VIOLATION: "+ptree.id+" has "+ptree.children.length+" children!");
			for(var j=0; j < ptree.children.length; j++){
				if(ptree.children[j].cat===childcat){
					categorySensitiveBranchCount++;
				}
			}
			if(categorySensitiveBranchCount>2){
				vcount++;
			}
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMaxBrCatSensitive(s, ptree.children[i], cat);
		}
	}
	return vcount;
}

//sensitive to the category of the parent only (2 branches of any type is acceptable)
//gradient evaluation: assigns 1 violation for every child past the first 2 ("third-born" or later)
function binMaxBranchesGradient(s, ptree, cat, n){
	n = typeof(n)==='number'? n : 2;
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		var numChildren = ptree.children.length;
		if(ptree.cat === cat && numChildren>n){
			var excessChildren = numChildren - n;
			//logreport(excessChildren+ " VIOLATION(s): "+ptree.id+" has "+numChildren+" children!");
			vcount += excessChildren;
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMaxBranchesGradient(s, ptree.children[i], cat, n);
		}
	}
	return vcount;
}

function binBrGradient(s, ptree, cat, n){
	n = typeof(n)==='number'? n : 2;
	return binMaxBranchesGradient(s, ptree, cat, n)+binMinBranches(s, ptree, cat);
}

/*TRUCKENBRODT-STYLE BINARITY*/

/* Categorical BinMax (Leaves)
*	Assign one violation for every node of the prosodic category c such that this
* node dominates more than two nodes of the prosodic category immidately below c
* on the prosodic hierarchy.
*
* Parent-category-neutral version of:
* Sandalo & Truckenbrodt 2002: "Max-Bin: P-phrases consist of maximally two prosodic words"
* Assigns a violation for every node in ptree that dominates more than two prosodic words.
*/
function binMaxLeaves(s, ptree, c, n){
	n = typeof(n)==='number'? n : 2;
	var vcount = 0;
	//the category we are looking for:
	var target = pCat.nextLower(c);
	//pCat.nextLower defined in prosdic hierarchy.js
	//console.log("the target of binMaxLeaves is " + target);
	if(ptree.children && ptree.children.length){
		var targetDesc = getDescendentsOfCat(ptree, target);
		//console.log("there are " + targetDesc.length + " " + target + "s");
		if(ptree.cat === c && targetDesc.length > n){
			vcount ++;
		}
		for(var i = 0; i < ptree.children.length; i++){
			vcount += binMaxLeaves(s, ptree.children[i], c, n);
		}
	}
	return vcount;
}

/*
* BinMax(phi-min)
* Violated if a minimal phi contains more than 2 minimal words --> leaf-counting
*/
function binMax_minLeaves(s, ptree, c){
	// c = phi
	markMinMax(ptree);
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		var leafCat = pCat.nextLower(c);
		var wDesc = getDescendentsOfCat(ptree, leafCat);
		// console.log("there are " + wDesc.length + " " + "ws");
		if(ptree.cat === c && ptree.isMin){
			var count = 0;
			for(var i=0; i < wDesc.length; i++) {
				if(wDesc[i].isMin) {
					count++;
				}
			}
			if(count > 2) {
				vcount++;
			}
		}
		for(var i = 0; i < ptree.children.length; i++){
			vcount += binMax_minLeaves(s, ptree.children[i], c);
		}
	}
	return vcount;
}

/* Gradiant BinMax (Leaves)
* I don't know how to define this constraint in prose, but it's binMaxLeaves as
* a gradient constraint instead of a categorical constraint.
*/
function binMaxLeavesGradient(s, ptree, c, n){
	n = typeof(n)==='number'? n : 2;
	var vcount = 0;
	//the category we are looking for:
	var target = pCat.nextLower(c);
	//pCat.nextLower defined in prosodicHierarchy.js
	if(ptree.children && ptree.children.length){
		var targetDesc = getDescendentsOfCat(ptree, target);
		if(ptree.cat === c && targetDesc.length > n){
			vcount += targetDesc.length - 2; //this makes the constraint gradient
		}
		for(var i = 0; i < ptree.children.length; i++){
			vcount += binMaxLeavesGradient(s, ptree.children[i], c, n);
		}
	}
	return vcount;
}

/* BinMin (Leaves)
*	Assign one violation for every node of the prosodic category c such that this
* node dominates less than two nodes of the prosodic category immidately below c
* on the prosodic hierarchy.
*/

function binMinLeaves(s, ptree, c){
	var vcount = 0;
	//the category we are looking for:
	var target = pCat.nextLower(c);
	//pCat.nextLower defined in prosdic hierarchy.js
	if(ptree.children && ptree.children.length){
		var targetDesc = getDescendentsOfCat(ptree, target);
		if(ptree.cat === c && targetDesc.length < 2){
			vcount ++;
		}
		for(var i = 0; i < ptree.children.length; i++){
			vcount += binMinLeaves(s, ptree.children[i], c);
		}
	}
	return vcount;
}

//Combines the violations of maximal and minimal binarity (leaf-counting)
function binLeaves(s, ptree, c, n){
	n = typeof(n)==='number'? n : 2;
	return binMaxLeaves(s, ptree, c, n) + binMinLeaves(s, ptree, c);
}

function binLeavesGradient(s, ptree, c, n){
	n = typeof(n)==='number'? n : 2;
	return binMaxLeavesGradient(s, ptree, c, n) + binMinLeaves(s, ptree, c);
}

//Helper function: given a node x, returns all the descendents of x that have category cat.
//Since this function is designed for use on prosodic trees, it does not take silence into account.
function getDescendentsOfCat(x, cat){
	var descendents = [];
	//logreport("x.cat is "+x.cat+ ", cat is " +cat);
	if(x.children && x.children.length)
	//x is non-terminal
	{
		for(var y=0; y < x.children.length; y++){
			if(x.children[y].cat === cat){
				descendents.push(x.children[y]);
			}
			var yDescendents = getDescendentsOfCat(x.children[y], cat);
			for(var i=0; i < yDescendents.length; i++){
				descendents.push(yDescendents[i]);
			}
		}
	}
	/* this else if statement was double counting terminal nodes of category cat.
	 * removing it causes double counting to stop.
	else if(x.cat === cat)	// x is a terminal of the right category
	{
		descendents.push(x);
	}*/
	return descendents;
}

/*<legacyBinarityConstraints> (for backwards compatability with old test files)*/

//Parent-category-neutral version of:
//Sandalo & Truckenbrodt 2002: "Max-Bin: P-phrases consist of maximally two prosodic words"
//Assigns a violation for every node in ptree that dominates more than two prosodic words.
function binMax2Words(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		wDesc = getDescendentsOfCat(ptree, 'w');
		if(ptree.cat === cat && wDesc.length>2){
			//logreport("VIOLATION: "+ptree.id+" dominates "+wDesc.length+" words!");
			vcount++;
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMax2Words(s, ptree.children[i], cat);
		}
	}
	return vcount;
}

//Gradient version of Truckenbrodt's Maximum Binarity
function binMax2WordsGradient(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		wDesc = getDescendentsOfCat(ptree, 'w');
		if(ptree.cat === cat && wDesc.length>2){
			//logreport("VIOLATION: "+ptree.id+" dominates "+wDesc.length+" words!");
			vcount += (wDesc.length - 2);
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMax2WordsGradient(s, ptree.children[i], cat);
		}
	}
	return vcount;
}

function binMin2Words(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		wDesc = getDescendentsOfCat(ptree, 'w');
		if(ptree.cat === cat && wDesc.length<2){
			//logreport("VIOLATION: "+ptree.id+" only dominates "+wDesc.length+" words!");
			vcount++;
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMin2Words(s, ptree.children[i], cat);
		}
	}
	return vcount;
}

function binMin2WordsGradient(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		wDesc = getDescendentsOfCat(ptree, 'w');
		if(ptree.cat === cat && wDesc.length<2){
			//logreport("VIOLATION: "+ptree.id+" dominates "+wDesc.length+" words!");
			vcount += (2-wDesc.length);
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMin2WordsGradient(s, ptree.children[i], cat);
		}
	}
	return vcount;
}

function binMinLeaves_requireMaximal(s, ptree, c){
	markMinMax(ptree);
	var vcount = 0;
	//the category we are looking for:
	var target = pCat.nextLower(c);
	//pCat.nextLower defined in prosdic hierarchy.js
	if(ptree.children && ptree.children.length){
		var targetDesc = getDescendentsOfCat(ptree, target);
		if(ptree.cat === c && targetDesc.length < 2 && ptree.isMax){
			vcount ++;
		}
		for(var i = 0; i < ptree.children.length; i++){
			vcount += binMinLeaves_requireMaximal(s, ptree.children[i], c);
		}
	}
	return vcount;
}

/*</legacyBinarityConstraints>*/

/* Binarity constraints that care about the number of leaves
Note: relies on getLeaves.
In the future we might want to have structure below the level of the (terminal) word, e.g., feet
and in that case would need a type-sensitive implementation of getLeaves
*/

/*
	Head binarity for Japanese compounds
	Assign a violation for every node of category cat
	whose head (as marked by markHeads + options.side)
	is not binary

	Depends on markHeads, defined in main/constraints/recursiveCatEvals.js

	options:
	- side: 'left' or 'right', defaults to 'right' (for Japanese). Which side are heads marked on?
	- minimal: true or false, defaults to false. Assess minimal binarity instead of maximal binarity.
*/
function binMaxHead(s, ptree, cat, options) {
	function assessBin(a, minimal){
		if(minimal) return a < 2;
		else return a > 2;
	}

	options = options || {};
	options.side = options.side || 'right';
	if(typeof options.side !== 'string' || !(options.side === 'right' || options.side == 'left')){
		console.warn('The option "side" for binMaxHead must be "left" or "right" (default)');
		options.side = right;
	}
	//Only run markheads if mytree hasn't been marked for heads
	if (ptree.headsMarked !== options.side){
		markHeads(ptree, options.side);
	}
	
	var vcount = 0;

	if(ptree.children && ptree.children.length){
		if(ptree.cat === cat){
			for(var i = 0; i<ptree.children.length; i++){
				if(ptree.children[i].head === true) {
					if(ptree.children[i].children){
						var numChil = ptree.children[i].children.length;
						if(assessBin(numChil, options.minimal)) {
							vcount++;
						}
					}
					else {
						var id = ptree.children[i].id.split('_');
						id = id[0];
						if(assessBin(id.length, options.minimal)) {
							vcount++;
						}
					}
				}
			}
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMaxHead(s, ptree.children[i], cat, options);
		}
	}
	return vcount;
}

/** Minimal binarity for heads
 * Implemented to help with Max Kaplan's Ojibwe analysis 
 * (for the iota level)
 */
function binMinHead(s, p, cat, options){
	options = options || {};
	options.minimal = true;
	if(!options.side) options.side = 'left'; //default to left-headed for Ojibwe reasons
	return binMaxHead(s, p, cat, options);
}

/* Ternarity constraints
*/
function ternMaxBranches(s, p, c){
	return(binMaxBranches(s, p, c, 3));
}

function ternMaxLeaves(s, p, c){
	return(binMaxLeaves(s, p, c, 3));
}
//Modifications:
//8-28-2020 Edward Shingler created functions ["notMutualCommand","dominates","pairExists","areAdjacent"] and constraints ["ccPhi","antiCCPhi","mutualSplit"]
//These constraints take an boolean argument called "adjacent" defaulted to false. If true, then each function only looks at adjacent words that would cause violations.

//DON'T FORGET TO INCLUDE ADJACENCY FOR ccPhi, antiCCPhi, mutualSplit
function isInArray(myArray, x)
{
	var answer = false;
	for(var i = 0; i < myArray.length; i++)
	{
		if(x == myArray[i])
		{
			answer = true;
		}
	}
	return answer;
};

function getNodes(myTree)
{
	var nodes = [];
	nodes.push(myTree);
	if(myTree.children && myTree.children.length)
	{
		for(var x = 0; x < myTree.children.length; x++)
		{
			var xNodes = getNodes(myTree.children[x]);
			for(var y = 0; y < xNodes.length; y++)
			{
				nodes.push(xNodes[y]);
			}
		}
	}
	return nodes;
};

// x immediately dominates y
function imDom(x,y)
{
	var check = false;
	if(x.children && x.children.length)
	{
		for(var i = 0; i < x.children.length; i++)
		{
			var currentKid = x.children[i];
			if(currentKid == y)
			{
				var check = true;
			}
		}
	};
	return check;
};

// Intended to replace imDom
function isParentOf(x,y){
	return (x.children || []).indexOf(y) >= 0;
}

//Returns parent of goal-node in within tree, if one exists. Else returns false.
function getParent(myTree,goal)
{
	var par = false;
	if(imDom(myTree, goal) == true)
	{
		par = myTree;
	}
	else
	{
		if(myTree.children && myTree.children.length)
		{
			for(var j = 0; j < myTree.children.length; j++)
			{
				var nextNode = myTree.children[j];
				if(getParent(nextNode, goal) != "")
				{
					par = getParent(nextNode, goal);
				}
			}
		}
	}
	return par;
};

//Returns the non-silent terminals c-commanded by node x within tree.
function commands(myTree,x)
{
	var domain = [];
	var xParent = getParent(myTree,x);
	if(hasParent(myTree,x) && (xParent.children.length > 1))
	{
		for(var i = 0; i < xParent.children.length; i++)
		{
			var current = xParent.children[i];
			if(current != x)
			{
				var currentNodes = getNodes(current);
				for(var j = 0; j < currentNodes.length; j++)
				{
					var z = currentNodes[j];
					if(!z.silent && !z.children)
					{
						domain.push(z);
					}
				}
			}
		}
	};
	return domain;
};

function hasParent(myTree, x)
{
	if(getParent(myTree, x) == "false")
	{
		return false;
	}
	else
	{
		return true;
	}
};

function phiMates(ptree,cat,x,y)
{
	var answer = false;
	var phis = getDescendentsOfCat(ptree,cat);
	for(var i = 0; i < phis.length; i++)
	{
		var currentPhi = phis[i];
		var nodes = currentPhi.children;
		var hasX = false;
		var hasY = false;
		for(var j = 0; j < nodes.length; j++)
		{
			var k = nodes[j];
			if(k.id == x.id)
			{
				var hasX = true;
			}
			if(k.id == y.id)
			{
				var hasY = true;
			}
			if(hasX && hasY)
			{
				break;
			}
		};
		if(hasX && hasY)
		{
			var answer = true;
			break;
		}
	};
	return answer;
};

function sharePhi(ptree,cat,x,y)
{
	var answer = false;
	var phis = getDescendentsOfCat(ptree,cat);
	for(var i = 0; i < phis.length; i++)
	{
		var currentPhi = phis[i];
		var nodes = getNodes(currentPhi);
		var hasX = false;
		var hasY = false;
		for(var j = 0; j < nodes.length; j++)
		{
			var k = nodes[j];
			if(k.id == x.id)
			{
				var hasX = true;
			}
			if(k.id == y.id)
			{
				var hasY = true;
			}
			if(hasX && hasY)
			{
				break;
			}
		};
		if(hasX && hasY)
		{
			var answer = true;
			break;
		}
	};
	return answer;
};

function dominates(node,x)
{
	var check = false;
	if(node.children && node.children.length)
	{
		for(var i = 0; i < node.children.length; i++)
		{
			var currentKid = node.children[i];
			if(currentKid.id == x.id)
			{
				var check = true;
				break;
			}
			else
			{
				var check = dominates(currentKid,x);
				if(check==true){break;};
			}
		}
	};
	return check;
};

//Assigns a violation for each c-pair whose elements do not reside together in at least one phi.
function group(sTree,pTree,cat,options)
{
	options = options || {};
	var vcount = 0;
	var sLeaves = getLeaves(sTree);
	cPairs = [];
	for(var i = 0; i < sLeaves.length; i++)
	{
		var currentLeaf = sLeaves[i];
		var comSet = commands(sTree,currentLeaf);
		for(var j = 0; j < comSet.length; j++)
		{
			if(!pairExists(cPairs, currentLeaf, comSet[j]))
			{
				if(!options.requireAdjacent || areAdjacent(sTree, currentLeaf, comSet[j], options))
				{
					cPairs.push([currentLeaf, comSet[j]]);
				}
			}
		}
	};
	for(var i = 0; i < cPairs.length; i++)
	{
		if(options.requireMin && !phiMates(pTree,cat,cPairs[i][0],cPairs[i][1]))
		{

		} else if(!sharePhi(pTree,cat,cPairs[i][0],cPairs[i][1]))
		{
			vcount++;
		}
	};
	return vcount;
};

//Assumes x is a non-silent leaf. Returns next non-silent leaf.
function nextLeaf(tree,x)
{
	var next = [];
	var leaves = getLeaves(tree);
	for(var i = 0; i < leaves.length-1; i++)
	{
		if(leaves[i] == x)
		{
			var j = leaves[i+1];
			next.push(j);
			break;
		}
	}
	return next;
};

//NB: ASSUMES x AND y ARE TERMINALS! Will return false if one of the nodes is non-terminal, even if it actually c-commands the other.
function mutualNonCommand(tree,x,y)
{
	var cx = commands(tree,x);
	var cy = commands(tree,y);
	if(!isInArray(cx,y) && !isInArray(cy,x))
	{
		return true;
	}
	else
	{
		return false;
	};
};

//Returns true if EITHER node does not command the other.
function notMutualCommand(tree,x,y)
{
	var cx = commands(tree,x);
	var cy = commands(tree,y);
	if(!isInArray(cx,y) || !isInArray(cy,x))
	{
		return true;
	}
	else
	{
		return false;
	};
};

//Checks if two leaves are adjacent
function areAdjacent(tree, x, y)
{
	if(nextLeaf(tree,x)[0]==y || nextLeaf(tree,y)[0]==x)
	{
		return true;
	};
	return false;
};

//Checks if an array has a pair of items
function pairExists(pairs, x, y)
{
			var check = false;
			for(var t = 0; t < pairs.length; t++)
			{
				var hasX = false;
				var hasY = false;
				for(var q = 0; q < pairs[t].length; q++)
				{
					if(x == pairs[t][q])
					{
						var hasX = true;
					}
					if(y == pairs[t][q])
					{
						var hasY = true;
					}
					if(hasX && hasY)
					{
						var check = true;
						return check;
					}
				}
			}
			return false;
};

//Reflects CC-ϕ constraint (Kalivoda 2018). Argument "adjacent" refers to whether or not violations apply to only adjacent words or words throughout the tree.
//cPair order is reversible, so is situations where two leaves mutually command, there is only one cPair.
//if adjacent == true then violations are only added if it occurs between adjacent words. This is reflective of Kalivoda (2018) constraint wording, but Kalivoda has expressed uncertainty about the significance of this adjacency specification.
function ccPhi(sTree,pTree,cat,options)
{
	options = options || {};
	var vcount = 0;
	var sLeaves = getLeaves(sTree);
	var phis = getDescendentsOfCat(pTree,cat);
	cPairs = [];
	//Create list of c-pairs
	for(var i = 0; i < sLeaves.length; i++)
	{
		var currentLeaf = sLeaves[i];
		var comSet = commands(sTree,currentLeaf);
		for(var j = 0; j < comSet.length; j++)
		{
			if(!pairExists(cPairs, currentLeaf, comSet[j]))
			{
				if(!options.requireAdjacent || areAdjacent(sTree, currentLeaf, comSet[j]))
				{
					cPairs.push([currentLeaf, comSet[j]]);
				}
			}
		}
	};
	//Assign violations based on c-pairs
	for(var k = 0; k < cPairs.length; k++)
	{
		for(var p = 0; p < phis.length; p++)
		{
			if(dominates(phis[p], cPairs[k][0]) && !dominates(phis[p], cPairs[k][1]))
			{
				vcount++;
			}
			if(!dominates(phis[p], cPairs[k][0]) && dominates(phis[p], cPairs[k][1]))
			{
				vcount++;
			}
		}
	};
	return vcount;
};

//Reflects ANTI-CC-ϕ constraint (Kalivoda 2018). Differs from MutualSplit in that violations apply when two nodes are mutually non-commanding. This is checked by the "mutualNonCommand" function, the only distinction between the two constraints.
//nonCPairs order is reversible, so is situations where two leaves mutually command, there is only one cPair.
function antiCCPhi(sTree,pTree,cat,options)
{
	options = options || {};
	var vcount = 0;
	var sLeaves = getLeaves(sTree);
	var phis = getDescendentsOfCat(pTree,cat);
	nonCPairs = [];
	for(var i = 0; i < sLeaves.length; i++)
	{
		for(var p = 0; p < sLeaves.length; p++)
		{
			if(sLeaves[i] != sLeaves[p] && !pairExists(nonCPairs, sLeaves[i], sLeaves[p]) 
			&& !(options.requireStrict && !notMutualCommand(sTree, sLeaves[i], sLeaves[p]))
			&& !(!options.requireStrict && !mutualNonCommand(sTree, sLeaves[i], sLeaves[p])))
			{
				if(!options.requireAdjacent || areAdjacent(sTree, sLeaves[i], sLeaves[p]))
				{
					nonCPairs.push([sLeaves[i], sLeaves[p]]);
				}
			}
		}
	};
	for(var k = 0; k < nonCPairs.length; k++)
	{
		var splitx = false;
		var splity = false;
		for(var p = 0; p < phis.length; p++)
		{
			if(dominates(phis[p], nonCPairs[k][0]) && !dominates(phis[p], nonCPairs[k][1]))
			{
				splitx = true;
			}
			if(!dominates(phis[p], nonCPairs[k][0]) && dominates(phis[p], nonCPairs[k][1]))
			{
				splity = true;
			}
		}
		if(!splitx)
		{
			vcount++;
		}
		if(!splity)
		{
			vcount++;
		}
	};
	return vcount;
	return vcount;
};/********************
* Some implementations of EqualSisters (Myrberg 2013)
* Myrberg introduces this constraint but doesn't actually define 
* how to count violations if there are more than 2 sisters.
* TODO does the degree of prosodic inequality make a difference to the severity of the violation?
*********************/

/* Maximally categorical definition of equalSisters:
*  Assign one violation for every set of sisters that do not all have the same category.
*  That is, all of the following would have one violation: (a (b)(c)), (a b (c)), ((a) b c)
*
* Updated Oct. 2020 to make the category specification optional
*/
function eqSis(s, ptree, cat){
	var vcount = 0;
	//base case: parent has category cat and is non-terminal
	if((!cat || ptree.cat === cat) && ptree.children && ptree.children.length){
		var cat1 = ptree.children[0].cat;
		for(var i=1; i<ptree.children.length; i++){
			var child = ptree.children[i];
			if(child.cat != cat1){
				vcount++;
				break;
			}
		}
	}

	//recursive case
	if(ptree.children && ptree.children.length){
		for(var i=0; i<ptree.children.length; i++){
			vcount += eqSis(s, ptree.children[i], cat);
		}
	}
	return vcount;
}

/* EqualSisters: looks at the category of the first sister, and assigns a violation 
* for every one of its sisters that doesn't share its category
* A definition probably no one wants but which is not ruled out by the "definitions" that appear in papers
* Markedness only -- just looks at prosody
* s and c are just there to fill out the argument structure for tableau-izing purposes.
*/
function equalSistersFirstPrivilege(s, parent, c){
	var vCount = 0;
	if(parent.children && parent.children.length)
	//pTree is non-terminal
	{
		var cat1 = parent.children[0].cat;
		for(var i=0; i < parent.children.length; i++){
			var child = parent.children[i];
			if(child.cat != cat1)
			{
				logreport.debug("\tVIOLATION: "+child.id+" and "+parent.children[0].id+" are unequal.");
				vCount++;
			}
			vCount += equalSistersFirstPrivilege(s, child, c);
		}
	}
	return vCount;
}

/*EqualSisters: assigns a violation for every (unordered) pair of sisters whose categories don't match
* Probably no one wants this version, either. Predicts "majority rules" effects.
* Markedness only -- just looks at prosody
* s and c are just there to fill out the argument structure for tableau-izing purposes.
*/

function equalSistersPairwise(s, parent, c){
	var vCount = 0;
	if(parent.children && parent.children.length)
	//pTree is non-terminal
	{
		var sisters = parent.children;
		for(var i=0; i < sisters.length; i++){
			var child = sisters[i];
			for(var j=i; j < sisters.length; j++){
				var sister = sisters[j];
				if(child.cat != sister.cat)
				{
					logreport.debug("\tVIOLATION: "+child.id+" and "+sister.id+" are unequal.");
					vCount++;
				}
			}
			vCount += equalSistersPairwise(s, child, c);
		}
	}
	return vCount;
}

//EqualSisters: assigns a violation for every pair of adjacent sister nodes that are not of the same prosodic category
//This is probably the version that actually makes sense.
//Markedness only -- just looks at prosody
//s and c are just there to fill out the argument structure for tableau-izing purposes.
function equalSistersAdj(s, parent, c){
	var vCount = 0;
	if(parent.children && parent.children.length)
	//pTree is non-terminal
	{
		logreport.debug("\tchecking equality of children of "+parent.id);
		for(var i=0; i < parent.children.length; i++){
			var child = parent.children[i];
			if(i<parent.children.length-1)
			{
				var sister = parent.children[i+1];
				if(child.cat != sister.cat)
				{
					logreport.debug("\tVIOLATION: "+child.id+" and "+sister.id+" are unequal.");
					vCount++;
				}
			}
			vCount += equalSistersAdj(s, child, c);
		}
	}
	return vCount;
}

// After Ito & Mester 2017
// Assign a violation for adjacent sisters whose categories don't match
function equalSisters2(s, parent, c){
	var vCount = 0;
	if(parent.children && parent.children.length)
	//pTree is non-terminal
	{
		logreport.debug("\tchecking equality of children of "+parent.id);
		for(var i=0; i < parent.children.length; i++){
			var child = parent.children[i];
			if(i<parent.children.length-1)
			{
				var sister = parent.children[i+1];
				if(pCat.isLower(child.cat, sister.cat) && !isMinimal(sister))
				{
					vCount++;
				}
				else if(pCat.isLower(sister.cat, child.cat) && !isMinimal(child)){
					vCount++;
				}
			}
			vCount += equalSisters2(s, child, c);
		}
	}
	return vCount;
}/* Equal Strength Boundaries Constraints
 * as proposed by Nick Kalivoda, August 2019:
 * Assign violations if a phonological terminal is at the left/right edge of a
 * different number of syntactic constituents as phonological constituents.
 * Specific functions defined below. Base function counts number of left/right
 * edges a terminal falls on.
 */

function equalStrengthBase(stree, ptree, scat, edgeName){
  var sTerminals = getLeaves(stree); //syntactic terminals
  var pTerminals = getLeaves(ptree); //prosodic terminals

  /* edges refers to left or right edges, so it should be cleared out in case
   * the edge is different from the last call */
  for (var i = 0; i < sTerminals.length; i ++){
    //clear out edges for syntactic terminals
    sTerminals[i].edges = void(0);
  }
  // GEN also re-uses subtrees, so edges must be cleared out every time
  for (var i = 0; i < pTerminals.length; i ++){
    //clear out edges for prosodic terminals
    pTerminals[i].edges = void(0);
  }

  equalStrengthHelper(stree, scat, edgeName);//call recursive helper for syntax
  var pcat = reversibleCatPairings(scat); // the prosodic cat the corresponds to scat
  equalStrengthHelper(ptree, pcat, edgeName);//call recursive helper for prosody

  //return an array of the terminals, also arrays, now with the property edges
  return [getLeaves(stree), getLeaves(ptree)];
}

/* equalStrengthHelper takes a tree, a category "cat", and the name of an edge
 * (left/right) "edgeName" and counts the number of nodes of category cat that
 * each terminal falls on the left/right edge of, as specified by edgeName.
 * This information is recorded in a property of each terminal called "edges".

 * equalStrengthBase is run once per call so that sTerminals and pTerminals can
 * be cleared out once. equalStrengthHelper runs recursively, once for each node
 * on the tree. Also, the same process needs to be run on ptree and stree, so
 * the helper function minimizes code repetition by taking only one tree and
 * being called for both ptree and stree.
 */
function equalStrengthHelper(tree, cat, edgeName){
  var boundaries = 0;
  recursiveStrengthHelper(tree, cat, boundaries);
  //recursiveStrengthHelper only goes through the left/right branches of tree
  //arguments given unique names to avoid scope problems
  function recursiveStrengthHelper(partree, category, boundaries){
    // argument boundaries keeps track of the number of edges a terminal is on
    var edgeIndex; // the index of the l/r edge
    //left = [0]
    if (edgeName == "left"){
      edgeIndex = 0;
    }
    //right = [length -1]
    if (edgeName == "right" && partree.children && partree.children.length){
      edgeIndex = (partree.children.length - 1);
    }
    //increment boundaries when partree is of the correct category
    if (partree.cat === category){
      boundaries++;
    }
    /* if partree is terminal and the terminal's edges have not already been
     * recorded in partree.edges */
    if (!partree.children && !partree.edges){
      partree.edges = boundaries; //assign partree.edges the value of boundaries
    }
    //recursively call inner function for the child on the l/r edge
    if (partree.children && partree.children.length){
      recursiveStrengthHelper(partree.children[edgeIndex], category, boundaries);
    }
  }
  //recursively call outer function for every node
  if (tree.children && tree.children.length){
    for (var i = 0; i < tree.children.length; i ++){
      equalStrengthHelper(tree.children[i], cat, edgeName);
    }
  }
}

/* Equal Strength Right Syntax --> Prosody:
 * For every terminal in stree that is at the right edge of n nodes of category
 * cat in stree, and at the right edge of m nodes of category
 * reversibleCatPairings(cat) in ptree, if n > m, assign n-m violations.
 * Relies on equalStrengthBase
 */
function equalStrengthRightSP(stree, ptree, cat){
  var vcount = 0;
  var terminals = equalStrengthBase(stree, ptree, cat, "right");
  //base function returns [streeTerminals, ptreeTerminals]
  for (var i = 0; i < terminals[0].length; i ++){
    //property edges refers to the number of right edges a terminal is on
    if (terminals[0][i].edges > terminals[1][i].edges){
      vcount += terminals[0][i].edges - terminals[1][i].edges;
      //if n > m, assign n - m violations
    }
  }
  return vcount;
}

/* Equal Strength Right Prosody --> Syntax:
 * For every terminal in ptree that is at the right edge of n nodes of category
 * cat in ptree, and at the right edge of m nodes of category
 * reversibleCatPairings(cat) in stree, if n > m, assign n-m violations.
 * Relies on equalStrengthBase and equalStrengthRightSP. SP constraints are PS
 * constraints with stree and ptree switched
 */
function equalStrengthRightPS(stree, ptree, cat){
  return equalStrengthRightSP(ptree, stree, cat);
}

// a combined version of equalStrengthrightSP and PS. Takes syntactic cat, not prosodic
function equalStrengthRight(stree, ptree, cat){
  if (!categoryPairings[cat]){
    cat = reversibleCatPairings(cat); //makes sure that cat is a syntactic cat.
  }
  return equalStrengthRightSP(stree, ptree, cat) + equalStrengthRightPS(stree, ptree, reversibleCatPairings(cat));
}

/* Equal Strength Left Syntax --> Prosody:
 * For every terminal in stree that is at the left edge of n nodes of category
 * cat in stree, and at the left edge of m nodes of category
 * reversibleCatPairings(cat) in ptree, if n > m, assign n-m violations.
 * Relies on equalStrengthBase
 */
function equalStrengthLeftSP(stree, ptree, cat){
  var vcount = 0;
  var terminals = equalStrengthBase(stree, ptree, cat, "left");
  //base function returns [streeTerminals, ptreeTerminals]
  for (var i = 0; i < terminals[0].length; i ++){
    //property edges refers to the number of left edges a terminal is on
    if (terminals[0][i].edges > terminals[1][i].edges){
      vcount += terminals[0][i].edges - terminals[1][i].edges;
      //if n > m, assign n - m violations
    }
  }
  return vcount;
}

/* Equal Strength Left Prosody --> Syntax:
 * For every terminal in ptree that is at the left edge of n nodes of category
 * cat in ptree, and at the left edge of m nodes of category
 * reversibleCatPairings(cat) in stree, if n > m, assign n-m violations.
 * Relies on equalStrengthBase and equalStrengthLeftSP. SP constraints are PS
 * constraints with stree and ptree switched
 */
function equalStrengthLeftPS(stree, ptree, cat){
  return equalStrengthLeftSP(ptree, stree, cat);
}

// a combined version of equalStrengthLeftSP and PS, takes syntactic cat, not prosodic
function equalStrengthLeft(stree, ptree, cat){
  if (!categoryPairings[cat]){
    cat = reversibleCatPairings(cat); //makes sure that cat is a syntactic cat.
  }
  return equalStrengthLeftSP(stree, ptree, cat) + equalStrengthLeftPS(stree, ptree, reversibleCatPairings(cat));
}
/****************
* Function that implements Exhaustivity, version 1:
* "Assign a violation for every parent-child pair (x,y) such that x is of PH-level n and y is of PH-level n-m, m >= 2."
* Assigns violations based on distance between categories on PH, but otherwise category-insensitive.
* "Vertically categorical"; greater distance between parent and child on PH does not result in higher vcount.
******************/

function exhaustChild(s, ptree){
//Assumes trees that obey Layering.

	//Base case: if parent is a terminal, return 0 violations.
	if (!ptree.children){
		return 0;
	}
	
	//Recursive case: if parent is non_terminal, find out how many violations are in each of the subtrees rooted in its children.

	if(ptree.children && ptree.children.length){
		var vcount = 0;
		var child;
		for (var i=0; i < ptree.children.length; i++){
			child = ptree.children[i];
			if (ptree.cat!==child.cat && pCat.nextLower(ptree.cat)!==child.cat){
				vcount++;
			}
			vcount += exhaustChild(s, child);
		}
		return vcount;
	}
};
/*Included for backward compatability*/
function exhaust1(s, ptree){
	return exhaustChild(s, ptree);
}

/* Assign a violation for every node of category k that has one or more children of category < (k-1), for every k.
*/
function exhaustParent(s, ptree){
//Assumes trees that obey Layering.
	//Base case: if parent is a terminal, return 0 violations.
	if (!ptree.children){
		return 0;
	}
	
	//Recursive case: if parent is non_terminal, find out if there are any violations in each of the subtrees rooted in its children.

	if(ptree.children && ptree.children.length){
		var vcount = 0;
		var child;
		for (var i=0; i < ptree.children.length; i++){			
			child = ptree.children[i];
			if (ptree.cat!==child.cat && pCat.nextLower(ptree.cat)!==child.cat){
				//alreadyViolated.push(child.cat);
				vcount++;
				break;
			}
			vcount += exhaustParent(s, child)
		}
		return vcount;
	}
};

// Tim, Su and Max workin' on a headedness constraint

function headedness(stree, ptree, cat){
    //code here
    //should return integer
    function getsViolation(node) {
        if(ptree.children && ptree.children.length) {
            let result = true;
            for (let i = 0; i < node.children.length; i++) {
                let child = node.children[i];
                if(child.cat === node.cat || child.cat === pCat.nextLower(node.cat)) {
                    result = false;
                    /*  methods to know for categories on the hierarchy
                        pCat.isHigher
                        pCat.isLower
                        pCat.nextHigher
                        pCat.nextLower
                    */
                }
            }
            return result;
        }
        else {
            return false;
        }
    }

    function correctCategory(treeCat, constraintCat) {
        if(constraintCat) {
            return treeCat == constraintCat;
        }
        else {
            return true;
        }
    }

    let violations = 0;

    if(getsViolation(ptree) && correctCategory(ptree.cat, cat)) {
        violations ++;
    }

    if(ptree.children && ptree.children.length){
        for(child of ptree.children){
            violations += headedness(stree, child, cat);
        }
    }

    return violations;
}
/*
Defined in Ito & Mester (2013) as: "Every accented word must be the head of a (minimal) phi
Assign a violation for each accented prosodic word that is not the head of a minimal phi."

Operationalized as:
For each phi, look at all children. If at least one child is a phi, then the current node is a non-minimal phi, 
so assign a violation for every A (= w [+accent]) in the array of children. 
If no child is a phi, let aCount = the number of A in the children array, and assign (aCount-1) violations."

Notes:
- Assumes accent as a separate attribute of a word. TODO fix Gen do add this; currently testing by assuming accent is specified in word id. ex. a_1, a_2, u_3
- As currently implemented, assumes no recursive phonological words.
*/


function accentAsHead(s, p, c){
	var vCount = 0;
	var child;
	
	//Base case: p is a leaf.
	if(!p.children || !p.children.length)
		return vCount;
	
	//Recursive case: p is a non-leaf.
	
	//Count all the accented words that are immediate daughters of current node p.
	// Store value in aCount.
	var aCount = 0;
	
	for(var i=0; i < p.children.length; i++){
		child = p.children[i];
		//console.log("child.id is:"+child.id);
		if(child.cat==="w" && !child.accent){
			child = accentFromId(child);	//If accent isn't defined, try to get it from the node's id.
			//console.log("child.id ("+child.id+") is assigned accent "+child.accent);
		}
		
		//if an accented word is discovered...
		if(child.accent===true && child.cat==="w"){
			aCount++;
			//console.log("child.id ("+child.id+") is an accented word. aCount = "+aCount);
		}
		
		vCount += accentAsHead(s,child,c);
	}
		
	// Case 1: p is a minimal phi. Assign a violation for every accented word except the first
	// by incrementing the violation count by one less than the total number of accented words (or 0 if there are none).
	if((p.cat==="phi") && isMinimal(p) && aCount>0){
		vCount += (aCount-1);
	}
	
	// Case 2: p is not a minimal phi (i.e. it's an iota, non-minimal phi, or w)
	// 			-> Assign a violation for every accented word. 
	else{
		vCount += aCount;
	}
	
	//console.log("For node "+p.id+", vCount is: "+vCount);
	return vCount;
}

/*
Defined in Ito&Mester(2013) as: "No accentual lapse. Assign a violation for every fully L-toned w."

Operationalized as: 
"For every U (= w[-accent]), assign a violation if U is non-initial (i.e. index of U in the children array > 0) and preceded by A in phi (i.e. there is an A in the children array with index greater than indexOf(U))."

TODO find out if there is an accent for the beginning of iota -- i.e. should the initial U *not* receive a violation as well...???

ANSWER: Assuming words can be immediately dominated by intonational phrases (i.e. violable Exhaustivity):

	For each phi, assign a violation for every U that is a) non-initial 
    b) preceded an A (within the maximal phi) with no intervening left-edge phi boundaries.

*/
function noLapseL(s, p, c){
	
	var vCount = 0;
    var spreadLow = false;     //Left edge of phi or iota contributes H
	
    walkTree(p, function(node){
        node = accentFromId(node);  //assign an accent if necessary
        
        if(node.cat==='w'){
            if(node.accent && node.accent !=='u' && node.accent !== 'U' && node.accent !== 'unaccented'){
                spreadLow = true;
            }
            
            /* spreadLow will be true if no phi or iota left edge intervenes
               between the last accented word and the current word
            */ 
            else if(spreadLow && (node.accent==='u' || node.accent==='U' || !node.accent)){
                vCount++;
            }
        }
        /* Otherwise, the current node is a phi or iota
           and contributes a high tone to the following node,
           so we can turn off spreadLow.
        */
        else spreadLow = false; 
        
    });
		
	return vCount;
}

/* Helper function for noLapseL: take a prosodic tree with words marked as U or A
	and determine for each word what tone(s) it receives
	where tones are contributed by:
		1. accent: a -> HL
		2. [ (left phi boundary) -> H
	and an unaccented word (accent: u) receives its accent from whatever is immediately to its left.
	
	Procedure:
	- traverse the tree in order (L->R). Let the current node = child, and let its parent = var parent.
	- track whether to assign L to the next word: var spreadLow = {true, false}.
		if(parent.children.indexOf[p]
		if(p.accent === "a") spreadLow = true;
*/
function accentFromId(node){
    if(!node.accent){
		var nodeIdPref = node.id.split('_')[0];
		if(['a', 'A'].indexOf(nodeIdPref)>=0){
			node.accent = true;
		}
		else{
			node.accent = false;
		}
			
	}
        
    return node;
}/***********************
MATCH THEORY constraints
and their numerous helpers
************************/

function getLeaves(x)
//return a list of all the non-silent terminals dominated by a node
{
	var leaves = [];
	if(x.children && x.children.length)
	//x is non-terminal
	{
		for(var y=0; y < x.children.length; y++){
			var yLeaves = getLeaves(x.children[y]);
			for(var i=0; i < yLeaves.length; i++){
				leaves.push(yLeaves[i]);
			}
		}
	}
	else if(!x.silent)	// x is itself a non-silent terminal
	{
		leaves.push(x);
	}
	return leaves;
}

function sameIdsOrdered(a1, a2)
//helper function to compare two arrays of children
//since there isn't a built_in array comparator.
{
	if(a1.length !== a2.length)
		return false;

	var i = 0;
	while(i<a1.length){
		if(a1[i].id !== a2[i].id)
			return false;
		i++;
	}

	return true;
}

/* function to compare sets of terminals {A} and {B}. returns true iff for each
 * element in A, there is an element in B with the same value for the property
 * "id" and A and B are of the same lenght.
 * Order insensitive version of sameIdsOrdered.
 */
function sameIds(a1, a2){
	if (a1.length !== a2.length){
		return false;
	}
	for (var x = 0; x < a1.length; x ++){ // for each element in a1
		var y = 0;
		var matched = false; // keeps track of if a1[x] has a match in a2
		while (matched == false){//there is an element in a2 ...
			if (a2[y] && a1[x].id === a2[y].id){ // such that these elements have the same ids
				matched = true; // set matched to true
			}
			if (y == a2.length){ //matched is false for every element in a2
				return false;
			}
			y ++; //increment y
		}
	}
	// if nothing caused the function to return false ...
	return true;
}


function matchPS(sTree, pParent, pCat, options)
//Assign a violation for every prosodic node of type pCat in pParent that doesn't have a corresponding syntactic node in sTree,
//where "corresponding" is defined as: dominates all and only the same terminals, and has the corresponding syntactic category
//Assumes no null terminals.
//flipped options is necessary because otherwise the prosodic trees will be checked for maximality/minimality when maxSyntax, eg,
//is set to true. The same goes for the syntactic trees
{
	options = options || {};
	var flippedOptions = {};
	flippedOptions.maxSyntax = options.maxProsody || false;
	flippedOptions.nonMaxSyntax = options.nonMaxProsody || false;
	flippedOptions.minSyntax = options.minProsody || false;
	flippedOptions.nonMinSyntax = options.nonMinProsody || false;
	flippedOptions.maxProsody = options.maxSyntax || false;
	flippedOptions.nonMaxProsody = options.nonMaxSyntax || false;
	flippedOptions.minProsody = options.minSyntax || false;
	flippedOptions.nonMinProsody = options.nonMinSyntax || false;
	flippedOptions.requireLexical = options.requireLexical || false;
	flippedOptions.requireOvertHead = options.requireOvertHead || false;
	return matchSP(pParent, sTree, pCat, flippedOptions);
}

/* matchSP = Match(Syntax, Prosody):
* Assign a violation for every syntactic node of type sCat in sParent that
* doesn't have a  corresponding prosodic node in pTree, where "corresponding"
* is defined as: dominates all and only the same terminals, and has the
* corresponding prosodic category.
* By default, assumes no null syntactic terminals.
*
* If sCat is 'any', syntactic category labels will be ignored.
*
* Options (all boolean):
* requireLexical: To ignore non-lexical XPs give them an attribute func: true.
*	requireOvertHead: To ignore silently-headed XPs, give them an attribute silentHead: true
*	maxSyntax: If true, ignore non-maximal syntactic nodes (nodes of category c that are
*				dominated by another node of category c)
*	minSyntax: If true, ignore non-minimal syntactic nodes (nodes of category c that dominate
*				another node of category c)
*	nonMaxSyntax: If true, only look at non-maximal syntactic nodes
*	nonMinSyntax: If true, only look at non-minimal syntactic nodes
*	maxProsody: If true, the prosodic match needs to be maximal. Passed to hasMatch.
*	minProsody: If true, the prosodic match needs to be minimal. Passed to hasMatch.
*	nonMaxProsody: If true, the prosodic match must be non-maximal. Passed to hasMatch.
*	nonMinProsody: If true, the prosodic match must be non-minimal. Passed to hasMatch.
*	anyPCat: if true, match with any prosodic category. Passed to hasMatch*/
function matchSP(inputTree, pTree, sCat, options)
{
	options = options || {};
	var sParent = inputTree;
	sParent = markMinMax(sParent, options);
	if(sParent.cat === sCat)
		logreport.debug("\tSeeking match for "+sParent.id + " in tree rooted in "+pTree.id);
	var vcount = 0;

	/*sParent needs to be matched only if it fulfills the following conditions:
	*  - it has the right category
	*  - either it is lexical (sParent.func is false) OR requireLexical is false
	*  - either it has an overt head (sParent.silent is false) OR requireOvertHead is false
	*/
	if((sCat === 'any' || (sParent.cat === sCat ))
	&& !(options.requireLexical && sParent.func)
	&& !(options.requireOvertHead && sParent.silentHead)
	&& !(options.maxSyntax && !sParent.isMax)
	&& !(options.minSyntax && !isMinimal(sParent))
	&& !(options.nonMaxSyntax && sParent.isMax)
	&& !(options.nonMinSyntax && isMinimal(sParent)))
	{
		if(!hasMatch(sParent, pTree, options)){
			vcount++;
			logreport.debug("\tVIOLATION: "+sParent.id+" has no match!");
		}
	}

	if(sParent.children){
		for(var i = 0; i < sParent.children.length; i++)
		{
			var sChild = sParent.children[i];
			vcount += matchSP(sChild, pTree, sCat, options);
		}
	}
	//console.log("in matchSP");
	return vcount;
}

function hasMatch(sNode, pTree, options)
//For a syntactic node sNode and a prosodic tree pTree, search the entire pTree
//to see if there is a node in pTree that has the same set of terminals as sNode,
//in the same order as sLeaves.
//Returns true for terminals assuming that there are no null syntactic terminals...
//Relies on sameIds for leaf comparisons and catMatches for category comparisons.

//options {maxProsody, minProsody, nonMaxProsody, nonMinProsody}
{

	var sLeaves = getLeaves(sNode);
	markMinMax(pTree, options);
	if((options.anyPCat || catsMatch(sNode.cat, pTree.cat))
	&& sameIds(getLeaves(pTree), sLeaves)
	&& !(options.requireLexical && pTree.func)
	&& !(options.requireOvertHead && pTree.silentHead)
	&& !(options.maxProsody && !pTree.isMax)
	&& !(options.minProsody && !isMinimal(pTree))
	&& !(options.nonMaxProsody && pTree.isMax)
	&& !(options.nonMinProsody && isMinimal(pTree)))
	{
		logreport.debug("\tMatch found: "+pTree.id);
		return true;
	}

	// If the current prosodic node is NOT the match:
	else if(!pTree.children || pTree.children.length===0)
	// current node is terminal
	{
		return false;
	}

	else
	//the current prosodic node is non-terminal (has children)
	{
		for(var i = 0; i < pTree.children.length; i++)
		//check each child to see if the match exists in the subtree rooted in that child
		{
			var child = pTree.children[i];
			if(hasMatch(sNode, child, options))
				return true;
		}
		return false;
	}
}

/*Various flavors of Match to be called more easily by makeTableau*/

function matchSP_LexicalHead(stree, ptree, cat, options){
	options = options || {};
	options.requireLexical = true;
	return matchSP(stree, ptree, cat, options);
}

function matchSP_OvertHead(stree, ptree, cat, options){
	options = options || {};
	options.requireOvertHead = true;
	return matchSP(stree, ptree, cat, options);
}

function matchSP_OvertLexicalHead(stree, ptree, cat, options){
	options = options || {};
	options.requireLexical = true;
	options.requireLexical = true;
	return matchSP(stree, ptree, cat, options);
}


/* Match-SP(scat-max, pcat-max): Assign a violation for every node of syntactic
 * category s that is not dominated by another node of category s in the
 * syntactic tree, and is not mapped to a corresponding prosodic node of
 * category p, where p=catMap(s), such that p is not dominated by another node
 * of category p.
 * ex. Match a maximal xp with a maximal phi.
 */

function matchMaxSP(sTree, pTree, sCat, options){
	options = options || {};
	options.maxSyntax = true;
	options.maxProsody = true;
	return matchSP(sTree, pTree, sCat, options);
}

/* Match-SP(scat-max, pcat). Same as matchMaxSP, except matching prosodic node
 * need not be maximal, only the syntactic node must be maximal to incur a
 * violation if no match is found.
 * ex. Match a maximal xp with any phi.
 */

function matchMaxSyntax(sTree, pTree, sCat, options){
	options = options || {};
	options.maxSyntax = true;
	return matchSP(sTree, pTree, sCat, options);
 }

//MatchSP, sCat to any prosodic constituent
function matchSPAny(sTree, pTree, sCat, options){
	options = options || {};
	options.anyPCat = true;
	return matchSP(sTree, pTree, sCat, options);
}

// MatchPS, pCat to any prosodic constituent
// needs testing
function matchPSAny(sTree, pTree, pCat, options){
	options = options || {};
	options.anyPCat = true;
	return matchPS(sTree, pTree, pCat, options);
}

//Match all non-minimal syntactic nodes
function matchNonMinSyntax(sTree, pTree, sCat, options){
	options = options || {};
	options.nonMinSyntax = true;
	return matchSP(sTree, pTree, sCat, options);
}

//Match for custom match SP options
function matchCustomSP(sTree, pTree, sCat, options){
	options = options || {};
	return matchSP(sTree, pTree, sCat, options);
}

//Match for custom match PS options
function matchCustomPS(sTree, pTree, sCat, options){
	options = options || {};
	return matchPS(sTree, pTree, sCat, options);
}

//Match Maximal P --> S
//Switch inputs for PS matching:
function matchMaxPS(sTree, pTree, pCat, options){
	options = options || {};
	options.maxSyntax = true;
	options.maxProsody = true;
	return matchPS(sTree, pTree, pCat, options);
}

//Match P --> S version of matchMaxSyntax. See comment there for explanation
function matchMaxProsody(sTree, pTree, pCat, options){
	options = options || {};
	options.maxSyntax = true;
	return matchMaxSyntax(pTree, sTree, pCat, options);
}

//Match Min constraints

/* Match-SP(scat-min, pcat-min): Assign a violation for every node of syntactic
 * category s that does not dominate another node of category s in the
 * syntactic tree, and is not mapped to a corresponding prosodic node of
 * category p, where p=catMap(s), such that p does not dominate another node
 * of category p.
 * ex. Match a minimal xp with a minimal phi.
 */

//match a syntactic tree with a prosodic tree
function matchMinSP(s, ptree, cat, options) {
	options = options || {};
	options.minSyntax = true;
	options.minProsody = true;
  return matchSP(s, ptree, cat, options);
}

//match prosody tree with a syntax tree
function matchMinPS(s, ptree, cat, options) {
	options = options || {};
	options.minSyntax = true;
	options.minProsody = true;
  return matchPS(s, ptree, cat, options);
}

/** Bidirectional or "symmetrical" Match
 *  No options because this constraint is for the purpose of simplifying 
 *  investigations of interactions between well-formedness constraints.
 *  Options can be added later.
 **/
function matchSPPS(s, ptree, scat){
	var spVcount = matchSP(s, ptree, scat);
	var pcat = categoryPairings[scat];
	var psVcount = matchPS(s, ptree, pcat);
	return spVcount + psVcount;
}function noShift(stree, ptree, cat) {
  // get list of terminals using helper function
  var sorder = getTerminals(stree);
  var porder = getTerminals(ptree);

  //counter
  var j = 0;
  //flag for whether a shift in order has been detected
  var shiftFound = false;

  while (!shiftFound && j < sorder.length) {
    var x = sorder[j];
    // establish lists of x precedes
    var y = sorder.slice(j + 1, sorder.length);
    var px = porder.indexOf(sorder[j]);
    var z = porder.slice(px + 1, porder.length);

    //if y has more elements than z, y can't possibly be a subset of z
    if (y.length > z.length) {
      shiftFound = true;
    }

    //otherwise, y may or may not be a subset of z
    var k = 0;
    while (k < sorder.length) {
      if (porder.indexOf(sorder[k]) < 0) {
        shiftFound = true;
      }
      k++;
    }

    //increment outer counter and check the next word
    j++;
  }
  return shiftFound ? 1 : 0;
}

function noShiftGradient(stree, ptree, cat) {
  var sorder = getTerminals(stree);
  var porder = getTerminals(ptree);
  var vcount = 0;
  var length = sorder.length;

  // initialize nxn tables of precedence relations as false
  var sRel = new Array(length);
  var pRel = new Array(length);
  for (var i = 0; i < length; i++) {
    sRel[i] = new Array(length);
    pRel[i] = new Array(length);
    for (var j = 0; j < length; j++) {
      sRel[i][j] = false;
      pRel[i][j] = false;
    }
  }

  // fill in true precedence relations in tables where precedence is true
  for (i = 0; i < length - 1; i++) {
    var sy = sorder.slice(i + 1, length);
    var px = porder[i];
    var py = porder.slice(i + 1, length);
    for (j = 0; j < sy.length; j++) {
      sRel[i][sorder.indexOf(sy[j])] = true;
      pRel[sorder.indexOf(px)][sorder.indexOf(py[j])] = true;
    }
  }

  // count violations, where precedence relation is true in sorder and false in porder
  for (var i = 0; i < length; i++) {
    for (var j = 0; j < length; j++) {
      if (sRel[i][j] == true && pRel[i][j] == false) {
        vcount++;
      }
    }
  }

  return vcount;
}

function getTerminals(tree) {
  // if input is an array of ids (in the test file noShiftGradientTest.html) then return the array
  if (Array.isArray(tree)) {
    return tree;
  }
  // else if input is a tree, then get terminals
  var leaves = getLeaves(tree);
  var order = new Array(leaves.length);
  for (var i in leaves) {
    order[i] = leaves[i].id;
  }
  return order;
}
/****************
* Function that implements Nonrecursivity, version 1:
* "Assign a violation for every node of category x immediately dominated
* by another node of category x"
******************/

function nonRecChild(s, parent, cat){

	//Base case: if parent is a terminal, return 0 violations.
	if (!parent.children){
		return 0;
	}

	//Recursive case: if parent is non-terminal, find out how many violations are in each of the subtrees rooted in its children
	var vcount = 0;
	var child;

	for (var i=0; i < parent.children.length; i++){
		child = parent.children[i];
		if (parent.cat===cat && child.cat===cat){
			vcount++;
		}
		vcount+=nonRecChild(s, child, cat);
	}
	return vcount;
}


/* Non-recursivity, Truckenbrodt style:
*  "Any two p-phrases that are not disjoint in extension are identical in extension."
*  For every node x of category p dominated by another node y of category p,
*  assign a violation for every leaf dominated by y that is not also dominated by x.
*/
function nonRecTruckenbrodt(s, parent, cat){
	//console.log("looking for nonRecTruckenbrodt violations in prosodic tree "+parent.id);
	if(!parent.children||(parent.children.length===0)){
		return 0;
	}

	var vcount=0;
	var child;

	for(var i=0; i<parent.children.length; i++){
		child = parent.children[i];
		if(parent.cat===cat && child.cat===cat){
			vcount+=leafDifferenceSize(getLeaves(child), getLeaves(parent));
		}
		vcount+=nonRecTruckenbrodt(s, child, cat);
	}
	return vcount;
}

/*Given arrays x, y, where the elements in x are a subset of the elements in y,
* and the elements in x and y are in the same order, returns the number of elements
* in y that are not also in x.
* TODO Modify this so that it doesn't make all the assumptions above concerning the relationship of x and y.
*/
function leafDifferenceSize(x,y){
		if(!(x instanceof Array) || !(y instanceof Array)){
			console.log("x: "+x);
			console.log("y: "+y);
			throw new Error("Either x or y is not an array");
		}
	return y.length-x.length;
}

/* Nonrecursivity, Pairwise (Max Tarlov)
"Assign a violation for every pair of nodes a and b such that a and b are both
of category c and a dominates b."

Unlike non-recursivity version 1 above, Pairwise Non-Recursivity does not require
immediate domination to assign a violation. This means that even if layering is
out of the ordinary, say phi dominates iota dominates phi, the pair of phis should
incur a violation.

This constraint requires two recursive function calls, one for each member of
the pair. nonRecPairs (the main constraint function) deals primarily with the
parent node and will call the helper function numOfCats, which returns a value
representing the number of occurances of nodes which match the category c in
a child of the parent node. This may be just one if the child is terminal or
dominates no nodes of category c.

In theory, this constraint should evaluate all pairs of nodes, but the functions
here will only evaluate pairs where a dominates b. This is ok because a must
dominate b for the pair to incur a violation.
*/

function nonRecPairs(s, parent, c){ //markedness constraint, s argument is for consistancy
	var vcount = 0; //number of violations counted in this function call (return)
	var child; //a child of parent (from array parent.children[])

	//Recursivity case: if parent is non-terminal and of category c, start counting violations.
	if (parent.children){
		for (var i = 0; i < parent.children.length; i ++ ) {
			child = parent.children[i];//new name, to avoid confusion and for consistency
			//add the number of nodes of cat c in the substructure/node child:
			if (parent.cat === c){
				/*
				If the parent node is of the category c, count the number of nodes
				dominated by this child that are also of the category c, including this
				child itself, and add that number to the violation count. This is where
				violations are actually incurred.
				*/
				vcount += numOfCats(child, c);
			}

			//run this function on the substructure child and add to vcount
			vcount += nonRecPairs(s, child, c);//recursive function call
			//this just makes sure that all of the possible parent nodes get evaluated

			//for debugging, uncomment the following line
			//console.log("Counting number of " + c + "'s dominated by " + parent.id);
		}

	}

	return vcount;
}

/*
Helper function to count the number of nodes in a substructure which are of the
category c. Called by nonRecPairs if a node is of the right catogory and is
non-terminal
*/
function numOfCats(p, c){//not a constraint, does not require s
	var occurances = 0; //number of nodes of category c (return this)
	if (p.cat === c){ //nonRec1 uses strict comparison
		occurances ++;
	}
	//count the number of children of category c
	if (p.children){
		for (var i = 0; i < p.children.length; i ++){
			var child = p.children[i];
			occurances += numOfCats(child, c);//recursive function call
		}
	}
	return occurances;
	/*
	since prosodic trees may not be properly layered, numOfCats must inspect
	children even if the parent is not of the relevant category. See comment on
	line 71.
	*/
}

/*Non-recursivity, assesed by parent node.
*"Assign one violation for every node of category c that immideately dominates
*at least one node of the category c."
*
*In general, this constraint will assign fewer violations than nonRec1 above.
*/

function nonRecParent(s, p, c){ //markedness constraint, s is for consistancy
	var vcount = 0; //number of violations, return
	var child; //p.children[i], see comment on variable's assignment (l. 165)
	var doms = 0; //the number of nodes of category c immidately dominated by p

	//base case: p has no children and cannot incur nonRec violations
	if(!p.children){
		return 0;
	}

	//otherwise, start counting violations
	for (var i = 0; i < p.children.length; i ++){
		child = p.children[i];
		//if both parent and child are of the category c, add increase doms
		if (p.cat === c && child.cat === c){
			doms ++;
		}
		//run function on child as well, running through the whole tree
		vcount += nonRecParent("sTree", child, c);//recursive function call
	}

	//if  parent has at least one child of the same category, assign a violation
	if (doms > 0){
		vcount ++;
	}

	return vcount;
}


/*Changed name of nonRec1 to nonRecChild. copy needed for backwards compatability*/
function nonRec1(s, parent, cat){

	//Base case: if parent is a terminal, return 0 violations.
	if (!parent.children){
		return 0;
	}

	//Recursive case: if parent is non-terminal, find out how many violations are in each of the subtrees rooted in its children
	var vcount = 0;
	var child;

	for (var i=0; i < parent.children.length; i++){
		child = parent.children[i];
		if (parent.cat===cat && child.cat===cat){
			vcount++;
		}
		vcount+=nonRecChild(s, child, cat);
	}
	return vcount;
}

/*
Returns true if node does not dominate any other nodes of its category
Assumes all nodes have valid and relevant categories
(i.e., this is designed for prosodic trees and won't give the desired results
if run on a syntactic tree that contains, e.g., bar levels).
*/
function isMinimal(node, lastCat){
	//If a node and one of its children have the same category then the node is not minimal.
	//The "lastCat" argument is only included in the function-internal call of isMinimal.  If one of 
	//the children of the node-in-question is a "dummy" node, then it should be skipped and its children checked instead.
	//isMinimal is called on the dummy node to check its children against "lastCat", the category of the node-in-question.

	if(lastCat){
		var cat = lastCat;
	} else {
		var cat = node.cat;
	}
	
	var isMin = true;

	//If the node is a leaf, it's minimal.
	if(!node.children || !node.children.length)
		return isMin;
	//Otherwise, we have to look at its children to determine whether it's minimal.
	var i = 0;
	var chil = node.children;
	while(isMin && i<chil.length){
		//if a child is a dummy, we will have to skip over that dummy to see if any of its children have the same category.
		if(chil[i].cat == "dummy"){
			isMin = isMinimal(chil[i], cat)
		} else if(chil[i].cat===cat){
			isMin = false;
		}
		i++;
	}
	return isMin;
}


/* Function that takes a tree and labels all the nodes in the tree as being
 * a minimal or maximal instance of whatever category k they are, where:
 * minimal = does not dominate any nodes of category k
 * maximal = is not dominated by any nodes of category k
 * and layering is assumed (a node of category level k will never be dominated
 * by a node of category < k).
 *
 * There are two boolean options: 
 * - options.requireLexical
 * - options.requireOvertHead
 *
 * In the case that markMinMax is called with the option "requireLexical" or
 * "requireOvertHead", nodes with the attribute "func" or "silentHead" are given
 * a new category "dummy". These nodes are ignored when checking for maximality or
 * minimality, only their children and parents are significant to the check.
 * 
 * Ex: given the syntax: [FuncP X [LexP1 Y [LexP2 Z ]]]
 * When options.requireLexical===true, LexP1 will be labeled maximal 
 * because it is the highest lexical phrase (i.e., it is the highest 
 * XP within the set of lexical XPs that are visible to MatchXP-Lex)
 *
 * When checking for minimality, a node's category is checked against its children's.
 * If all children have a different category from the node's, then it is minimal.
 * If a child has the "dummy" category, then that dummy's children are checked as well.
 *
 * When checking for maximality, a node's category is checked against its parent's.
 * If the node and its parent have different categories then it is maximal. The
 * category of each node's parent is inherited as an attribute node.parentCat.
 * If a child has the "dummy" category, then that dummy will be given the attribute
 * node.lastCat in order to store the value of the parent. Every child of a dummy will
 * inherit node.lastCat as its node.parentCat instead of "dummy".
 *
 * This can be called in a recursive function and is compatable with GEN's
 * re-use of certain prosodic subtrees, but when testing something that relies
 * on this function and GEN, it is best to use one tree at a time since JS is a
 * pass by reference language and subtrees will show the markings assigned from
 * the most recent call of markMinMax, which are not always the correct markings
 * for the current tree. As long as markMinMax is called on a subtree or its
 * ancestors before its maximality or minimality is used, your function will be
 * working with the correct values of isMin, isMax and parentCat.
 *
 * 10/26/20 update of an earlier version, now includes dummies.
 */

function markMinMax(mytree, options){
	options = options || {};
	if(options.requireLexical){
		mytree = createDummies(mytree, 'func');
	}
	if(options.requireOvertHead){
		mytree = createDummies(mytree, 'silent');
	}
	return markMinMaxInner(mytree, options)
}

function markMinMaxInner(mytree, options){
	/* If parentCat property is not already defined for this node, it is probably
	 * the root node. Non-root nodes get the property parentCat when this node's
	 * children are marked below.
	 */
	options = options || {};

	if (!mytree.hasOwnProperty('parentCat')){
		mytree.parentCat = "is root"; //marks the root node
	}

	//Store the info of the most recent cat in order to skip over dummy nodes
	//except when the dummy node's parent is ALSO a dummy node, then lastcat should be passed
	//down dummy generation after dummy generation until a normal node is reached to inherit
	//it as the parentCat.
	if(mytree.cat === "dummy"){
		mytree.isMax = false;
		mytree.isMin = false;
		if(mytree.parentCat !== "dummy"){
			mytree.lastCat = mytree.parentCat;
		}
	} else {
		//mark maximality and minimality for node
		mytree.isMax = (mytree.cat !== mytree.parentCat);
		mytree.isMin = isMinimal(mytree);

		//recall stored parentCat after dummies are skipped
		if(mytree.parentCat === "dummy"){
			mytree.parentCat = mytree.lastCat;
		}
	}

	if(mytree.children && mytree.children.length){
		for(var i = 0; i < mytree.children.length; i++){
			mytree.children[i].parentCat = mytree.cat; // set the property parentCat
			mytree.children[i].lastCat = mytree.lastCat; //pass on lastCat
			mytree.children[i] = markMinMaxInner(mytree.children[i], options);
		}
	}
	return mytree;
}

function markHeadsJapanese(mytree){
	console.warn('markHeadsJapanese() has changed to markHeads()');
	return markHeads(mytree, 'right');
}

/* Function to mark heads of Japanese compound words.
 * Head of a node is the leftmost/rightmost(default) daughter of the highest category.
 * Takes two arguments:
 * 	mytree: tree to mark heads on
 * 	side: 'left' or 'right' (default)
 */
function markHeads(mytree, side){

	if(typeof side !== 'string' || !(side === 'right' || side === 'left')){
		console.warn('"side" argument of markHeads() must be "right" or "left", default to "right"');
		side = 'right';
	}
	//headCat stores the highest category in children. Defaults to lowest pCat
	var headCat = pCat[pCat.length-1];
	if(mytree.children && mytree.children.length){
		let previousChildren = [];
		if(side === 'right'){
			//mark heads and iterate through tree from RIGHT to LEFT
			for(let i = mytree.children.length-1; i >= 0; i--){
				markHeadsInner(mytree.children[i], previousChildren, side);
			}
		}
		else if(side === 'left'){
			//mark heads and iterate from LEFT to RIGHT
			for(let i = 0; i < mytree.children.length; i++){
				markHeadsInner(mytree.children[i], previousChildren, side);
			}
		}
	}
	//Indicate that this tree has been marked for heads, and on which side
	mytree.headsMarked = side;
	return mytree;

	function markHeadsInner(child, previousChildren, side){
		/* since we are iterating through children in a specified direction, if we
		 * come across the highest cat we have seen so far, it is necessarily the
		 * rightmost/leftmost of its category */
		if(pCat.isHigher(child.cat, headCat)){
			headCat = child.cat;
			child.head = true;
			//iterate over the children we have already marked:
			for(var x = 0; x < previousChildren.length; x++){
				/* when a new head is marked, all nodes previously evaluated must be
				 * marked as head = false since they are of a lower category */
				previousChildren[x].head = false;
			}
		}
		else{
			child.head = false;
		}
		previousChildren.push(child);
		child = markHeads(child, side); //recursive function call
	}
}
//Assign a violation for every node of category c in p.
//Truckebrodt (1995, 1999): *phi
function starCat(s, p, c){
	var occurances = 0;
	if (p.cat === c){
		occurances ++;
	};
	if (p.children && p.children.length){
		for (var i = 0; i < p.children.length; i ++){
			var child = p.children[i];
			occurances += starCat(s, child, c);
		}
	};
	return occurances;
}/* Assign a violation for every node whose leftmost daughter constituent is of type k
*  and is lower in the prosodic hierarchy than its sister constituent immediately to its right: *(Kn Kn-1)
*  Elfner's StrongStart(k).
*
*  If k is absent, use any category (Selkirk's StrongStart which Elfner also uses).
*/

function strongStart_Elfner(s, ptree, k){

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	if(ptree.children.length>1){		
		var leftmostCat = ptree.children[0].cat;
		var sisterCat = ptree.children[1].cat;
		
		//console.log(leftmostCat);
		//console.log(sisterCat);
		//console.log(pCat.isLower(leftmostCat, sisterCat));

		// If not indexed to any particular category k, then we don't care what leftmostCat is
		// Otherwise we want leftmostCat to equal k.
		if((!k || leftmostCat===k) && (pCat.isLower(leftmostCat, sisterCat)))
		{
			vcount++;
			//console.log("strongStart_Elfner violation: "+ptree.children[0]+" "+ptree.children[1]);
		}
	}
	
	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += strongStart_Elfner(s, child, k);
	}
	
	return vcount;
}

/* Hsu 2016, p. 195
	"STRONGSTART(k/p)
	Assign a violation mark for every prosodic constituent whose leftmost daughter
	constituent is of type k and is lower in the Prosodic Hierarchy than its sister
	constituent immediately to the right, where k is at the left edge of a prosodic
	constituent p.

	The relevant notion of 'left edge' is defined as follows:
	(57) A prosodic constituent k is at the left edge of prosodic constituent p iff.
	a. p dominates k, and
	b. no prosodic constituent that both dominates k and is dominated by p has a
	leftmost daughter constituent that does not contain k."

	Note that the violations are for each parent with immediate daughter k at its edge (i.e., for every k), not for every p with k at its left edge at any depth.
*/

function strongStart_Hsu(s, ptree, k, p, node){

	/* Since we cannot search up the tree, the original tree must be retained 
	to determine whether a node of cat p dominates a node of cat k. We keep a 
	reference to the root ptree, while node refers to the object that is 
	currently being assessed as a weakly-starting parent of a node with category k.
	*/
	node = node || ptree;

	//base case: node is a leaf or only has one child
	if(!node.children){
		return 0;
	}
	
	var vcount = 0;
	
	// if node.children[0].cat === k and has a sibling, then compare it with its sibling as well as for domination by a node of cat p along the left edge.
	if(node.children.length>1 && node.children[0].cat === k){		
		if((pCat.isLower(node.children[0].cat, node.children[1].cat)) && catDomsIdAtLeftEdge(ptree, p, node.id)){ // searches tree for node of cat p dominating this node of cat k
			vcount++;
		}
	}
	
	// Recurse
	for(var i=0; i<node.children.length; i++){
		child = node.children[i];
		vcount += strongStart_Hsu(s, ptree, k, p, child);
	}
	
	return vcount;
}

//Wrapper functions for strongStart_Hsu to deal with the problem of having two separate category arguments
function strongStart_Hsu_phi(s, ptree, k)
{
	return strongStart_Hsu(s, ptree, k,'phi');
}

function strongStart_Hsu_iota(s, ptree, k)
{
	return strongStart_Hsu(s, ptree, k, 'i');
}

//can't be parameterized to a category at present -- k is ignored
function strongEndLocal(s, ptree, k){

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	if(ptree.children.length>1){		
		var rightmostCat = ptree.children[ptree.children.length-1].cat;
		var sisterCat = ptree.children[ptree.children.length-2].cat;
		
		//console.log(leftmostCat);
		//console.log(sisterCat);
		//console.log(pCat.isLower(leftmostCat, sisterCat));

		if(pCat.isLower(rightmostCat, sisterCat))
		{
			vcount++;
			//console.log("strongEndLocal violation: "+ptree.children[0]+" "+ptree.children[1]);
		}
	}
	
	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += strongEndLocal(s, child, k);
	}
	
	return vcount;
}

/* Constraint from Sabbagh (2014, p. 62) "Word Order and Prosodic-Structure Constraints in Tagalog":

Weak Start: *(π₁π₂..., where π₁ > π₂
A prosodic constituent begins with a leftmost daughter that is no higher on the prosodic hierarchy than the constituent that immediately follows.
*/
function weakStartLocal(s, ptree, k){

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	if(ptree.children.length>1){		
		var leftmostCat = ptree.children[0].cat;
		var sisterCat = ptree.children[1].cat;

		if(pCat.isHigher(leftmostCat, sisterCat))
		{
			vcount++;
		}
	}
	
	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += weakStartLocal(s, child, k);
	}
	
	return vcount;
}

/* Assign a violation for every node of category cat whose leftmost daughter constituent
*  is lower in the prosodic hierarchy than any sister constituent to its right.
*  (intuitive strong start, according to the intuition of Bellik & Kalivoda 2019) 
*  Updated Jan 2020 to penalize structures like (a b (c)) as well as (a (b c)). 
*  The previous definition only looked at the first and second sisters.
*  Updated Sept. 2020 to include an option to restrict this to the maximal node of category cat
* Updated Oct. 2020 to make the restriction on parent category optional.
*/

function strongStart(s, ptree, cat, options){

	options = options || {};
	markMinMax(ptree);

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	if((!cat || ptree.cat === cat) && ptree.children.length>1 && !(options.maximal && !ptree.isMax)){
		//If we only want to look at maximal nodes and this one isn't maximal, then don't evaluate it further.
		var leftmostCat = ptree.children[0].cat;
		for(var i = 1; i<ptree.children.length; i++){
			var sisterCat = ptree.children[i].cat;
			//console.log(leftmostCat, sisterCat, pCat.isLower(leftmostCat, sisterCat));

			if(pCat.isLower(leftmostCat, sisterCat))
			{
				vcount++;
				break;
			}
		}
	}
	
	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += strongStart(s, child, cat, options);
	}
	
	return vcount;
}

/* Assign a violation for every node whose leftmost daughter constituent
*  is lower in the prosodic hierarchy than its sister constituent immediately to its right.
*  Sensitive to whether nodes are (non)minimal: phi min is lower than phi non-min
*  Not sensitive to the category of the parent.
*  (Van Handel's strongStart from SPOT2 2019)
*/

function strongStart_SubCat(s, ptree, cat){
	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	if(ptree.children.length>1){		
		var leftmost = ptree.children[0];
		var sister = ptree.children[1];
		
		//console.log(leftmostCat);
		//console.log(sisterCat);
		//console.log(pCat.isLower(leftmostCat, sisterCat));
		
		if(nodeHasLowerCat(leftmost, sister))
		{
			vcount++;
		}
	}
	
	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += strongStart_SubCat(s, child, cat);
	}
	
	return vcount;
}

/* Assign a violation for every node of category > w whose leftmost daughter constituent
*  is of category < w (a syllable or foot).
*  (proposed by Bennett, Elfner & McCloskey 2016 on Irish clitic placement)
*/
function strongStartClitic(s, ptree, cat){

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	//Corrected 2/5/21: this was checking that ptree.children.length>1, which is not correct since strongStartClitic as defined in BEM doesn't care how many children are present
	if(pCat.isHigher(ptree.cat, 'w') && ptree.children.length){		
		var leftmostCat = ptree.children[0].cat;

		if(pCat.isLower(leftmostCat, 'w'))
		{
			vcount++;
		}
	}
	
	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += strongStartClitic(s, child, cat);
	}
	
	return vcount;

}

/** Category-independent version of strongStartClitic.
 * Proposed by Jennifer Bellik in SS-ES stringency chapter in AOT book
 * as a generalized version of the hyperlocally-scoped SS constraint
 * in Bennett, Elfner, & McCloskey 2016. May also be conceived of as
 * Exhaustivity enforced at the left edge only.
 * 
 * "Assign a violation for every node of category k whose first daughter
 * is of category < k-1." (Bellik 2021)
 * 
*/
function ssHypLoc(stree, ptree, cat){
	var vcount = 0;

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return vcount;
	}

	if(ptree.children.length){		
		var parentCat = ptree.cat;
		var firstChildCat = ptree.children[0].cat;

		if(pCat.isLower(firstChildCat, pCat.nextLower(parentCat)))
		{
			vcount++;
		}
	}

	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += ssHypLoc(stree, child, cat);
	}
	//Code for going through the tree and evaluate for some structure goes here
	return vcount;
}

/* Strong start (cat init)
 * Assign one violation for every node of category k that is initial in a node of category
 * k+2 and sister to a node of category k+1
 */
function strongStartInit(stree, ptree, cat){
	let offendingNodes = totalDescender(ptree, cat, false);
	let result = [];
	for(var i = 0; i < offendingNodes.length; i++){
		if(result.indexOf(offendingNodes[i]) < 0){result.push(offendingNodes[i]);}
	}
	return result.length;

	//Function that takes a tree and returns all nodes in the tree for which violation returns true
	// tree = current sub-tree
	// category = specified category in constraint call
	// catInitial -- what is this?
	function totalDescender(tree, category, catInitial){
		let result = [];
		kPlus2 = pCat.isHigher(tree.cat, pCat.nextHigher(category));
		if(tree.children && tree.children.length){
			//Base case: evaluate current node for violation
			if(violation()){
				result.push(tree.children[0]);
			}

			//If catInitial is false and there is a category two steps up the prosodic hierarchy
			if(!catInitial && kPlus2){
				result = result.concat(totalDescender(tree.children[0], category, tree.cat));
				//Add violations from a recursive call on the first child
				//with catInitial set to the current tree's category
			}
			else{
				result = result.concat(totalDescender(tree.children[0], category, catInitial));
			}

			//Recursive call on each child of current tree
			for(var i = 1; i < tree.children.length; i++){
				result = result.concat(totalDescender(tree.children[i], category, false));
			}
		}
		return result;

		/* If the first child in the current tree is lower in category than its sister, return true
		*/
		function violation(){
			let bool = true;
			let parent = tree;
			let init = tree.children[0];
			let peninit = tree.children[1];
			// No violation if the category of the initial child isn't the specified category.
			// We should consider whether this should actually be: the specified category *or lower*. i.e., if you get a violation for {w phi}, you would certainly also get a violation for {ft phi}
			if(init && init.cat !== category){bool = false;}
			// No violation if the immediate sister to the initial node is not of a higher category
			// This definitely needs to be revised to look at all sisters.
			if(peninit && !pCat.isHigher(peninit.cat, init.cat)){bool = false;}
			// No violation if the tree's category isn't at least 2 categories up from the specified category AND catInitial (passed in from calling function totalDescender)
			if(!pCat.isHigher(parent.cat, pCat.nextHigher(category)) && !catInitial){bool = false;}
			return bool;
		}
	}
}


/** A helper function for strongStart_Hsu() that determines 
 * whether a tree contains a node of category cat that has 
 * a node with id "id" at its left edge at any depth. 
 * 
 * Arguments:
 * - tree: a prosodic or syntactic tree to search through
 * - cat: a string representing a node category
 * - id: a string representing the id of a node to look for at a left edge
 * 
 * Returns true if tree contains a node of category cat which has, 
 * at its left edge, a node with the specified id. 
 * Otherwise returns false.
 * 
 * Depends on hasIdAtLeftEdge()
 */
function catDomsIdAtLeftEdge(tree, cat, id){
	if(!tree.children){
		return false;
	}
	if(tree.cat === cat && (hasIdAtLeftEdge(tree, id) || tree.id === id)){
		return true;
	}
	else {
		for(var i=0; i<tree.children.length; i++){
			if(catDomsIdAtLeftEdge(tree.children[i], cat, id)){
				return true;
			}
		}
	}
}

/**A helper function for catDomsIdAtLeftEdge(). 
 * 
 * Arguments: 
 * - tree: a prosodic or syntactic tree to search through
 * - id: a string representing the id of a node to look for
 * 
 * Returns true if the tree has a node with the specified id at its left edge at any depth.
 * Otherwise, returns false.
*/
function hasIdAtLeftEdge(tree, id){
	if(!tree.children){
		return false;
	}
	if(tree.children[0].id === id){
		return true;
	}
	else {
		return hasIdAtLeftEdge(tree.children[0], id);
	}
}
/*KEY FOR REPRESENTATIONS
	
	<	left of stressed syllable
	>   right of stressed syllable

	[	left of unstressed syllable
	]	right of any syllable

	H	mora linked to High
	L	mora linked to Low
	F	mora linked to High+Low
	R	mora linked to Low+High

The representations are unambiguous because the OCP is in force.
So, "HH" has 1 tone:  High+Low			"LL" has 1 tone:  Low+Low
	"HL" has 2 tones: High				"LH" has 2 tones: Low+High
	"HF" has 2 tones: High+Low			"LR" has 2 tones: Low+High
	"HR" has 3 tones: High+Low+High		"LF" has 3 tones: Low+High+Low
*/

//HELPER FUNCTIONS

function cross(x, y)
//x and y must be strings or arrays.
{
	var cArray = [];
	for(var i = 0; i < x.length; i++)
	{
		for(var k = 0; k < y.length; k++)
		{
			var string = x[i];
			var current = y[k];
			var string = string.concat(current);
			cArray.push(string);
		}
	};
	return cArray;
};

function aStar(alphabet, n)
{
	var pArray = alphabet;
	for(var i = 1; i < n; i++)
	{
		var pArray = cross(alphabet, pArray);
	};
	return pArray;
};

//says if a character is a mora
function isMora(x)
{
	if((x == "H") || (x == "L") || (x == "R") || (x == "F") || (x == "m"))
	{
		return true;
	}
	else
	{
		return false;
	};
};

//says if a character is a mora linked to 2 tones
function isContour(x)
{
	if((x == "R") || (x == "F"))
	{
		return true;
	}
	else
	{
		return false;
	};
};

function oppositeT(x)
{
	if(x == "H")
	{
		return "L";
	};
	if(x == "L")
	{
		return "H";
	};
};

//returns the first moraic character to the left of position i
function moraBefore(i,word)
{
	var mb = "";
	for(var j = (i-1); j > -1; j--)
	{
		var cur = word[j];
		if(isMora(cur))
		{
			mb = cur;
			break;
		};
	};
	return mb;
};

//returns the first moraic character to the right of position i
function moraAfter(i,word)
{
	var ma = "";
	for(var j = (i+1); j < word.length; j++)
	{
		var cur = word[j];
		if(isMora(cur))
		{
			ma = cur;
			break;
		};
	};
	return ma;
};

/*tone="H", returns "F"
  tone="L", returns "R"*/
function cStartingWith(tone)
{
	var a = "";
	if(tone == "H")
	{
		a = "F";
	};
	if(tone == "L")
	{
		a = "R";
	};
	return a;
};

/*tone="H", returns "R"
  tone="L", returns "F"*/
function cEndingWith(tone)
{
	var a = "";
	if(tone == "H")
	{
		a = "R";
	};
	if(tone == "L")
	{
		a = "F";
	};
	return a;
};

function mCountToEdge(string,i,cat,dir)
{
/* string	input string
   i		starting index
   cat		can be "word", "syl", or "sylX"
   dir		can be "left" or "right"
*/
	var mcount = 0;
	if(cat == "word")
	{
		//count to next # or edge of string, whichever closer
		if(dir == "left")
		{
			//go left until word boundary
			for(var j = i-1; j >= 0; j--)
			{
				var cur = string[j];
				if(isMora(cur))
				{
					mcount++;
				};
				if(cur == "#")
				{
					break;
				};
			};
		};
		if(dir == "right")
		{
			//go right until word boundary
			for(var j = i+1; j < string.length; j++)
			{
				var cur = string[j];
				if(isMora(cur))
				{
					mcount++;
				};
				if(cur == "#")
				{
					break;
				};
			};
		};
	};
	if(cat == "syl")
	{
		//count to the next [ or ]
		if(dir == "left")
		{
			//go left; counts # as syl-boundary
			for(var j = i-1; j >= 0; j--)
			{
				var cur = string[j];
				if(isMora(cur))
				{
					mcount++;
				};
				if((cur == "[") || (cur == "#") || (cur == "<"))
				{
					break;
				};
			};
		};
		if(dir == "right")
		{
			//go right; counts # as syl-boundary
			for(var j = i+1; j < string.length; j++)
			{
				var cur = string[j];
				if(isMora(cur))
				{
					mcount++;
				};
				if((cur == "]") || (cur == ">") || (cur == "#"))
				{
					break;
				};
			};
		};
	};
	if(cat == "sylX")
	{
		if(dir == "left")
		{
			var catExists = false;
			//check to see if there even is a < before i
			for(var j = i-1; j >= 0; j--)
			{
				var cur = string[j];
				if(cur == "<")
				{
					catExists = true;
					break;
				};					
			};
			if(catExists)
			{
				for(var j = i-1; j >= 0; j--)
				{
					var cur = string[j];
					if(isMora(cur))
					{
						mcount++;
					};
					if(cur == "<")
					{
						break;
					};
				};
			};
		};
		if(dir == "right")
		{
			var catExists = false;
			//check to see if there even is a > after i
			for(var j = i+1; j < string.length; j++)
			{
				var cur = string[j];
				if(cur == ">")
				{
					catExists = true;
					break;
				};
			};
			if(catExists)
			{
				for(var j = i+1; j < string.length; j++)
				{
					var cur = string[j];
					if(isMora(cur))
					{
						mcount++;
					};
					if(cur == ">")
					{
						break;
					};
				};
			};
		};

	};
	return mcount;
};

//GEN

function swToneGen(string)
{
	var candidates = [];
	var mcount = 0;
	for(var i = 0; i < string.length; i++)
	{
		if(isMora(string[i]))
		{
			mcount++;
		};
	};
	var minv = ["H", "L", "R", "F", "m"];
	var nopunct = aStar(minv,mcount);
	for(var j = 0; j < nopunct.length; j++)
	{
		var inprep = nopunct[j];
		for(var l = 0; l < string.length; l++)
		{
			var cur = string[l];
			if(!isMora(cur))
			{
				inprep = inprep.substring(0,l).concat(cur).concat(inprep.substring(l));
			};
		};
		candidates.push(inprep);
	};
	return candidates;
};

function jToneGen(string)
{
	var candsForSpot = [];
	var candidates = [];
	var mcount = 0;
	for(var i = 0; i < string.length; i++)
	{
		if(isMora(string[i]))
		{
			mcount++;
		};
	};
	var minv = ["H", "L", "R", "F", "m"];
	var nopunct = aStar(minv,mcount);
	for(var j = 0; j < nopunct.length; j++)
	{
		var inprep = nopunct[j];
		for(var l = 0; l < string.length; l++)
		{
			var cur = string[l];
			if(!isMora(cur))
			{
				inprep = inprep.substring(0,l).concat(cur).concat(inprep.substring(l));
			};
		};
		candidates.push(inprep);
	};
	for(var i = 0; i < candidates.length; i++)
	{
		var cur = candidates[i];
		var ioPair = [string,cur];
		candsForSpot.push(ioPair);
	};
	return candsForSpot;
};

function kjGen(string)
{
	var noGaps = [];
	var jset = jToneGen(string);
	for(var i = 0; i < jset.length; i++)
	{
		var cur = jset[i];
		if(!hasGap(cur))
		{
			noGaps.push(cur);
		};
	};
	return noGaps;
};

function hasGap(string)
{
	var gap = false;
	var prevT = "";
	var curT = "";
	for(var i = 0; i < string.length; i++)
	{
		var cur = string[i];
		if(((cur == "L") || (cur == "H")) && (prevT == cur) && (moraBefore(i,string) == "m"))
		{
			gap = true;
		};
		if((cur == "R") && (prevT == "L") && (moraBefore(i,string) == "m"))
		{
			gap = true;
		};
		if((cur == "F") && (prevT == "H") && (moraBefore(i,string) == "m"))
		{
			gap = true;
		};
		if(gap == true)
		{
			break;
		};
		if((cur == "H") || (cur == "R"))
		{
			prevT = "H";
		};
		if((cur == "L") || (cur == "F"))
		{
			prevT = "L";
		};
	};
	return gap;
};

function getTonalTier(string)
{
	var tTier = "";
	var ocpified = "";
	for(var i = 0; i < string.length; i++)
	{
		var cur = string[i];
		if((cur == "H") ||  (cur == "L"))
		{
			tTier = tTier.concat(cur);
		};
		if(cur == "R")
		{
			tTier = tTier.concat("LH");
		};
		if(cur == "F")
		{
			tTier = tTier.concat("HL");
		};
	};
	for(var j = 0; j < tTier.length; j++)
	{
		if(tTier[j] != tTier[j-1])
		{
			ocpified = ocpified.concat(tTier[j]);
		};
	};
	return ocpified;
};

//CONSTRAINTS

function atlWord(string)
{
	var h = alignT(string,"H","word","left");
	var l = alignT(string,"L","word","left");
	return h+l;
};

function atlSyl(string)
{
	var h = alignT(string,"H","syl","left");
	var l = alignT(string,"L","syl","left");
	return h+l;
};

function atrWord(string)
{
	var h = alignT(string,"H","word","right");
	var l = alignT(string,"L","word","right");
	return h+l;
};

function atrSyl(string)
{
	var h = alignT(string,"H","syl","right");
	var l = alignT(string,"L","syl","right");
	return h+l;
};

function ahlWord(string)
{
	return alignT(string,"H","word","left");
};

function ahlSyl(string)
{
	return alignT(string,"H","syl","left");
};

function ahrWord(string)
{
	return alignT(string,"H","word","right");
};

function ahrSyl(string)
{
	return alignT(string,"H","syl","right");
};

function allWord(string)
{
	return alignT(string,"L","word","left");
};

function allSyl(string)
{
	return alignT(string,"L","syl","left");
};

function alrWord(string)
{
	return alignT(string,"L","word","right");
};

function alrSyl(string)
{
	return alignT(string,"L","syl","right");
};


function alignT(string,tone,cat,dir)
{
	var vcount = 0;
	for(var i = 0; i < string.length; i++)
	{
		var cur = string[i];
		if(dir == "left")
		{
			if((cur == tone) || (cur == cStartingWith(tone)))
			{
				var prevM = moraBefore(i,string);
				if((prevM != tone) && (prevM != cEndingWith(tone)))
				{
					vcount += mCountToEdge(string,i,cat,dir);
				};
			};
			if(cur == cEndingWith(tone))
			{
				vcount += mCountToEdge(string,i,cat,dir);
			};
		};
		if(dir == "right")
		{
			if((cur == tone) || (cur == cEndingWith(tone)))
			{
				var nextM = moraAfter(i,string);
				if((nextM != tone) && (nextM != cStartingWith(tone)))
				{
					vcount += mCountToEdge(string,i,cat,dir);
				}
			};
			if(cur == cStartingWith(tone))
			{
				vcount += mCountToEdge(string,i,cat,dir);
			};
		};
	};
	return vcount;
};

function star(tone,word)
{
	var vcount = 0;
	for(var i = 0; i < word.length; i++)
	{
		var cur = word[i];
		var prev = moraBefore(i,word);
		if((cur == tone) || (cur == cStartingWith(tone)))
		{
			if((prev != tone) && (prev != cEndingWith(tone)))
			{
				vcount++;
			};
		};
		if(cur == cEndingWith(tone))
		{
			vcount++;
		};
	};
	return vcount;
};

function toneToMora(tone,string)
{
	var vcount = 0;
	for(var i = 0; i < string.length; i++)
	{
		var cur = string[i];
		if((cur == tone) || (cur == cStartingWith(tone)))
		{
			var prev = moraBefore(i,string);
			if((prev == tone) || (prev == cEndingWith(tone)))
			{
				vcount++;
			};
		};
	};
	return vcount;
};

function moraToTone(string)
{
	var vcount = 0;
	for(var i = 0; i < string.length; i++)
	{
		if((string[i] == "R") || (string[i] == "F"))
		{
			vcount++;
		};
	};
	return vcount;
};

//cat must be syl or sylX. i should add  word, etc.
function crispEdge(string,tone,cat)
{
	var vcount = 0;
	for(var i = 0; i < string.length; i++)
	{
		var cur = string[i];
		var prev = moraBefore(i,string);
		var next = moraAfter(i,string);
		if(cat == "sylX")
		{
			if((cur == "<") || (cur == ">"))
			{
				if((prev == tone) || (prev == cEndingWith(tone)))
				{
					if((next == tone) || (next == cStartingWith(tone)))
					{
						vcount++;
					};
				};
			};
		};
		if(cat == "syl")
		{
			if((cur == "[") || (cur == "<"))
			{
				if((prev == tone) || (prev == cEndingWith(tone)))
				{
					if((next == tone) || (next == cStartingWith(tone)))
					{
						vcount++;
					};
				};
			};
		};
	};
	return vcount;
};

function kjCrispEdge(string)
{
	var h = crispEdge(string,"H","syl");
	var l = crispEdge(string,"L","syl");
	return h+l;
};


function kjDep(string)
{
	var vcount = 0;
	var max = kjMax(string);
	var ttier = getTonalTier(string);
	var tcount = ttier.length;
	if((string[0] == "h") && (max == 1))
	{
		vcount = tcount;
	};
	if((string[0] == "h") && (max == 0))
	{
		vcount = tcount-1;
	};
	if((string[0] == "f") && (max == 2))
	{
		vcount = tcount;
	};
	if((string[0] == "f") && (max == 1))
	{
		vcount = tcount-1;
	};
	if((string[0] == "f") && (max == 0))
	{
		vcount = tcount-2;
	};
	if(vcount < 0)
	{
		vcount = 0;
	};
	return vcount;
};

function kjMax(string)
{
	var vcount = 0;
	var tTier = getTonalTier(string);
	if((string[0] == "h") && (tTier.indexOf("H") == -1))
	{
		vcount++;
	};
	if(string[0] == "f")
	{
		if(tTier.length == 1)
		{
			vcount++;
		};
		if(tTier == "LH")
		{
			vcount++;
		};
	};
	return vcount;
};

function kjInputs(sMin,sMax)
{
	var kji = [];
	for(var i = sMin; i <= sMax; i++)
	{
		var sylProfs = aStar(["[m]", "[mm]"], i);
		for(var j = 0; j < sylProfs.length; j++)
		{
			kji.push("h:".concat(sylProfs[j]));
			kji.push("f:".concat(sylProfs[j]));
		};
	};
	return kji;
};

var kjForms = kjInputs(1,4);

//UNNECESSARY
function eMoraToTone(cset)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		vcounts.push(moraToTone(cset[i]));
	};
	return vcounts;
};

function evalCrisp(cset,tone,cat)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		var cand = cset[i];
		var j = crispEdge(cand,tone,cat);
		vcounts.push(j);
	};
	return vcounts;
};

function ekjCrisp(cset)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		vcounts.push(kjCrispEdge(cset[i]));
	};
	return vcounts;
};

function eATR(cset)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		var cand = cset[i];
		var j = allTonesRight(cand);
		vcounts.push(j);
	};
	return vcounts;
};

function eATL(cset)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		var cand = cset[i];
		var j = allTonesLeft(cand);
		vcounts.push(j);
	};
	return vcounts;
};

function ekjMax(cset)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		vcounts.push(kjMax(cset[i]));
	};
	return vcounts;
};

function ekjDep(cset)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		vcounts.push(kjDep(cset[i]));
	};
	return vcounts;
};

//only works for markedness constraints
function evalAlignT(cset,tone,cat,dir)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		var cand = cset[i];
		var j = alignT(cand,tone,cat,dir);
		vcounts.push(j);
	};
	return vcounts;
};

function evalAlignAnyT(cset,cat,dir)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		var cand = cset[i];
		var j = alignT(cand,"H",cat,dir);
		var k = alignT(cand,"L",cat,dir);
		vcounts.push(j+k);
	};
	return vcounts;
};

function evalToneToMora(cset,tone)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		var cand = cset[i];
		var j = toneToMora(tone,cand);
		vcounts.push(j);
	};
	return vcounts;
};

function eToneToMora(cset)
{
	var vcounts = [];
	for(var i = 0; i < cset.length; i++)
	{
		var cand = cset[i];
		var j = toneToMora("H",cand);
		var k = toneToMora("L",cand);
		vcounts.push(j+k);
	};
	return vcounts;
};

var nagasaki = swToneGen("h:[m][m][m][m]");
var kagosima = swToneGen("f:[m][m][m][m]");
var wasinton = swToneGen("f:[m][mm][mm]");
var nagasakiken = swToneGen("h:[m][m][m][m][mm]");
var kagosimaken = swToneGen("f:[m][m][m][m][mm]");
//Ozan's code
const DONT_WALK_SUBTREES = false;

function walkTree(node, foo) {
	if (foo(node) === false)
		return;
	if (node.children instanceof Array)
		for (var i = 0; i < node.children.length; i++)
			walkTree(node.children[i], foo);
}

function getLeaves2(root) {
	var leaves = [];
	walkTree(root, function(node) {
		if (!(node.children instanceof Array))
			leaves.push(node);
	});
	return leaves;
}

// matchSP2 and hasMatch2 are equivalents of older versions of matchSP and hasMatch (without category sensitivity)
function matchSP2(sParent, pTree) {
	var vcount = 0;
	walkTree(sParent, function(node) {
		if (!hasMatch2(getLeaves(node), pTree))
			vcount++;
	});
	return vcount;
}

function hasMatch2(sLeaves, pTree) {
	var result = false;
	walkTree(pTree, function(node) {
		if (sameIds(getLeaves(node), sLeaves)) {
			result = true;
			return false; // don't continue tree-traversal
		}
	});
	return result;
}
