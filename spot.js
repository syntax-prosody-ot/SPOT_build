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
}//Modifications:
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
		if((child.accent==="a" || child.accent==='A') && child.cat==="w"){
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

//Match for any prosodic constituent
function matchSPAny(sTree, pTree, sCat, options){
	options = options || {};
	options.anyPCat = true;
	return matchSP(sTree, pTree, sCat, options);
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
/** Functions for built-in analyses and for saving, loading, and clearing analyses on the interface: 
 * clearInputs() - possibly should be moved to interface_display_helpers.js
 * clearAnalysis() - possibly should be moved to interface_display_helpers.js
 * 
 * built_in_con(input): helper function
 * built_in_input(myTrees): helper function
 * my_built_in_analysis(...): template function for all built-in analyses
 * various functions to set up individual built-in analyses
 * built_in(analysis): chooses which analysis setup function to run based on value passed in by interface
 * record_analysis()
 * saveAnalysis()
 * loadAnalysis()
 * 
*/

function clearInputs(){
  let inputOptions = spotForm['autoInputOptions'];
  //document.getElementById('inputOptions');

  spotForm['autoInputOptions-rootCategory'].value = 'xp';
  spotForm['autoInputOptions-recursiveCategory'].value = 'xp';
  spotForm['autoInputOptions-terminalCategory'].value = 'x0';

  for(let i = 0; i<inputOptions.length; i++){
    if(inputOptions[i].checked){
      inputOptions[i].click();
    }
  }

  spotForm['head-req'].value = 'select';

  if(document.getElementById('add-clitics').checked){
    document.getElementById('add-clitics').click();
  }

  let inputStrings = spotForm['inputToGenAuto'];

  if(inputStrings.length){
    for(let i = 0; i<inputStrings.length; i++){
      inputStrings[i].value = '';
      if(i>0){
        inputStrings[i].parentElement.remove();
      }
    }
  }
  else{
    inputStrings.value = '';
  }

  let inputTerminals = document.getElementsByName('genStringsInput');

  inputTerminals[0].value = '';
  document.getElementsByName('genStringsMin')[0].value = '';
  document.getElementsByName('genStringsMax')[0].value = '';

  while(inputTerminals.length > 1) {
    inputTerminals[inputTerminals.length - 1].parentElement.remove();
  }

  changeInputTabs('inputButton', 'goButton');
}

/*function to clear out any previous interaction with the interface, either from
 * the user or from another built-in alalysis. */
function clearAnalysis(){
  var genOptions = document.getElementsByName("genOptions");
  var hideCategories = document.getElementsByName('hideCategory');
  var constraints = document.getElementsByName("constraints");
  var conOptions;
  var fieldsets = document.getElementsByTagName("fieldset");
  var showMoreDivs = document.getElementsByClassName('more-constraints');

  //restrict branches text should default to 2, I think
  spotForm['maxBranchingValue'].value = 2;

  //reset gen options
  for(var i = 0; i<genOptions.length; i++){
    if(genOptions[i].checked){
      genOptions[i].click();
    }
  }

  //reset prosodic categories
  document.getElementById("spotForm")["genOptions-rootCategory"].value = "i";
  document.getElementById("spotForm")["genOptions-recursiveCategory"].value = "phi";
  document.getElementById("spotForm")["genOptions-terminalCategory"].value = "w";

  //reset tree parenthesization options
  for(var i = 0; i<hideCategories.length; i++){
    hideCategories[i].checked = false;
  }

  //reset constraints
  for(var i = 0; i<constraints.length; i++){
    if(constraints[i].checked){
      constraints[i].click();
    }
    //reset constraint options
    conOptions = document.getElementsByName("option-"+constraints[i].value);
    if(conOptions.length){
      for(var z = 0; z < conOptions.length; z++){
        //set checkboxes to unchecked
        if(conOptions[z].type == "checkbox"){
          conOptions[z].checked = false;
        }
        //set drop-down selectors to "any"
        else if(conOptions[z].tagName === "SELECT"){
          //all of the drop-down constraint options default to "any" as of 2/1/20 -MT
          conOptions[z].value = "any";
        }
      }
    }
  }

  for(var i = 0; i<fieldsets.length; i++){

    fieldsets[i].classList.remove("open");


  }
  for(var i = 0; i<showMoreDivs.length; i++){
    showMoreDivs[i].style.display = 'none';
  }
  window.clearUTrees();
  document.getElementById("stree-textarea").value = '{}';
  document.getElementById("autoTreeBox").innerHTML = '';
  if(document.getElementById("syntax-tree-switch").checked){
    document.getElementById("syntax-tree-switch").click();
  }
  changeInputTabs('inputButton', 'goButton');
  
  clearInputs();

}

/* Function to check all of the boxes for a built-in constaint set in the UI
 * takes an array of objects with the properties "name" and "cat"
 * "name" is the name of a constraint as it is called in SPOT (ie "alignLeft")
 * "cat" is the category which that constraint should be called on (ie "xp")
*/
function built_in_con(input){
  //all of the fieldsets, which contain the constraint inputs
  var conFields = document.getElementsByTagName("fieldset");
  //for the constraint and category checkboxes
  var con_boxes;
  //for the categories of a constraint
  var cat_boxes;
  //string of all the constraints used so far
  var usedCons = "";

  //iterate over the inputs
  for(var i = 0; i < input.length; i++){
    //iterate over the fieldsets
    for(var x = 0; x < conFields.length; x++){
      //get the checkboxes in the fieldset
      con_boxes = conFields[x].getElementsByTagName("input");
      //iterate over the checkboxes in this fieldset
      for(var y = 0; y < con_boxes.length; y++){
        if(con_boxes[y].value === input[i].name && con_boxes[y].name === "constraints"){
          //click on the constraint if it is not already checked
          if(!con_boxes[y].checked){
            con_boxes[y].click();
          }
          //open the fieldset
          conFields[x].setAttribute("class", "open");
          //open "show more", if the constraint belongs to it
          var showMoreDivs = document.getElementsByClassName("more-constraints");
          for(var q = 0; q<showMoreDivs.length; q++){
            if(showMoreDivs[q].contains(con_boxes[y])){
              showMoreDivs[q].style.display = "block";
            }
          }

          cat_boxes = document.getElementsByName("category-"+input[i].name);
          for(var z = 0; z < cat_boxes.length; z++){
            //used to test if constraint has been used before:
            var regex = new RegExp(input[i].name);
            // select the category if the input calls for it
            if(cat_boxes[z].value === input[i].cat){
              cat_boxes[z].checked =  true;
            }
            //for dealing with text input (currently only from alignLeftMorpheme)
            else if(cat_boxes[z].type==="text"){
              cat_boxes[z].checked =  true;
              cat_boxes[z].value = input[i].cat;
            }
            // otherwise clear out category if this constraint has not been used before
            else if(!regex.test(usedCons)){
              cat_boxes[z].checked = false;
            }
          }
        }
      }
    }
    //handling constraint options, uses last constraint options object specified
    /* we only need to do this once per input and we should probably run it after
     * all of the constraints and categories have been checked */
    if(input[i].options && document.getElementsByName("option-"+input[i].name) && document.getElementsByName("option-"+input[i].name).length){
      var optionBoxes = document.getElementsByName("option-"+input[i].name);
      if(optionBoxes.length){
        //iterate over option checkboxes corresponding to this input
        for(var x in optionBoxes){
          //dealing with checkboxes
          if(optionBoxes[x].type === "checkbox"){
            if(input[i].options[optionBoxes[x].value]){
              optionBoxes[x].checked = true;
            }
            else{
              optionBoxes[x].checked = false;
            }
          }
          //if not a checkbox, it should be a selector
          else if(optionBoxes[x].tagName === "SELECT"){
            var child = optionBoxes[x].getElementsByTagName("option");
            //iterate over options in the select tag
            for(var count = 0; count < child.length; count++){
              if(input[i].options[child[count].value]){
                /*if the input options contain reference to the options inside
                this selector, set this selector to that option value */
                optionBoxes[x].value = child[count].value;
              }
            }
          }
        }
      }
      //if there is only one option for this constraint:
      else{
        optionBoxes.checked = true;
      }
    }
    //record that this constraint has already been used so other inputs don't overwrite it
    usedCons = usedCons+input[i].name;
  }
}

function built_in_input(myTrees){
  if(Array.isArray(myTrees)){ //manual trees
    //First, shows the tree UI & the code view
    changeInputTabs('inputButton', 'goButton');
  
    for(var i = 0; i < myTrees.length; i++){
      var myUTree = new UTree(myTrees[i]);
      window.showUTree(myUTree);
    }
    document.getElementById("htmlToJsonTreeButton").click();
    //document.getElementById("tree-code-box").click();
    //Then paste trees in
    //document.getElementById("stree-textarea").value = JSON.stringify(myTrees);
  
  }
  else if (Object.keys(myTrees).length){
    //First make sure we are in auto mode and open syntax options
    changeInputTabs('goButton', 'inputButton');
    document.getElementById('syntax-parameters').setAttribute('class', 'open');

    for(let x = 0; x<spotForm.autoInputOptions.length; x++){
      const autoBox = spotForm.autoInputOptions[x];
      if(myTrees.autoInputOptions[autoBox.value] && !autoBox.checked){
        autoBox.click();
      }
    }

    if(myTrees.inputToGenAuto.length<2){
      spotForm.inputToGenAuto.value = myTrees.inputToGenAuto[0];
    }
    else{
      for(let x = 0; x<myTrees.inputToGenAuto.length; x++){
        if(!spotForm.inputToGenAuto.length || spotForm.inputToGenAuto.length<myTrees.inputToGenAuto.length){
          document.getElementById('addString').click();
        }
        spotForm.inputToGenAuto[x].value = myTrees.inputToGenAuto[x];
      }
    }

    if(myTrees['autoInputOptions-addClitics']){
      if(!spotForm['autoInputOptions-addClitics'][0].checked){
        spotForm['autoInputOptions-addClitics'][0].click();
      }
      spotForm['autoInputOptions-addClitics'].value = myTrees['autoInputOptions-addClitics'];
    }

    for(const i in myTrees){
      if(typeof myTrees[i] === 'string'){
        spotForm[i].value = myTrees[i];
      }
    }

    if(myTrees.terminalStrings && myTrees.terminalStrings.length){
      document.getElementById("stringGeneration").setAttribute('class', 'open');

      const terminalStrings = myTrees.terminalStrings;

      const strGENboxes = document.getElementsByName('genStringsInput');
      const strMinBoxes = document.getElementsByName('genStringsMin');
      const strMaxBoxes = document.getElementsByName('genStringsMax');

      //clicks 'add list of terminals' until there enough divs for the analysis at hand
      while(document.getElementsByName('genStringsInput').length < terminalStrings.length){
        document.getElementById('addList').click();
      }
      for(let i = 0; i < terminalStrings.length; i++){
        strGENboxes[i].value = terminalStrings[i].genStringsInput;
        strMinBoxes[i].value = terminalStrings[i].genStringsMin;
        strMaxBoxes[i].value = terminalStrings[i].genStringsMax
      }

      document.getElementById("genStringsDoneButton").click();
    }

    document.getElementById('autoGenDoneButton').click();
  }
}

/*Template for built-in analyses
* Arguments:
* myGEN: a GEN options object
*   ex. {obeysExhaustivity: true, obeysNonRecursivity: false, noUnary: true}
* myCon: a list of constraints in form [{name: "constraint", cat: "name"}]
*   ex. [{name: "matchSP", cat:"xp"}, {name: "strongStart_Elfner", cat: "w"}, {name: "binMinBranches", cat: "phi"}, {name: "binMaxBranches", cat: "phi"}]
* myTrees: a list of trees
* showTones: either false or a string indicating the name of a tone annotation function to call
*   ex. "addJapaneseTones", "addIrishTones_Elfner"
*/
function my_built_in_analysis(myGEN, showTones, myTrees, myCon){
  //Step 0: clear the webpage
  clearAnalysis();
  //Step 1: GEN options
  // To move clitics: value should be "cliticMovement"
  var genBoxes = document.getElementsByName("genOptions");
  for(var box in genBoxes){
    var optVal = myGEN[genBoxes[box].value];
    if(optVal===true){
      genBoxes[box].checked = true;
    }
    if(genBoxes[box].value==='maxBranching' && typeof(optVal) == "string"){
      genBoxes[box].click();
      spotForm['maxBranchingValue'].value = optVal;
    }
    if(optVal instanceof Array && genBoxes[box].value==='obeysExhaustivity'){
      var exhaustivityBox = document.getElementById("exhaustivityBox");
      //exhaustivityBox.click();
      exhaustivityBox.checked = "checked";
      var exhaustivityCats = document.getElementsByName("exhaustivityCats");
      for (var x = 0; x < exhaustivityCats.length; x++){
        exhaustivityCats[x].parentNode.style.display = "table-cell";
        if(optVal.indexOf(exhaustivityCats[x].value)>=0){
          exhaustivityCats[x].checked=true;
        }
        else{
          exhaustivityCats[x].checked=false;
        }
      }
    }
  }
  if(myGEN.rootCategory && (myGEN.rootCategory !== "i")){
    document.getElementById("prosodicCategories").setAttribute("class", "open");
    document.getElementById("spotForm")["genOptions-rootCategory"].value = myGEN.rootCategory;
  }
  if(myGEN.recursiveCategory && (myGEN.recursiveCategory !== "phi")){
    document.getElementById("prosodicCategories").setAttribute("class", "open");
    document.getElementById("spotForm")["genOptions-recursiveCategory"].value = myGEN.recursiveCategory;
  }
  if(myGEN.terminalCategory && (myGEN.terminalCategory !== "w")){
    document.getElementById("prosodicCategories").setAttribute("class", "open");
    document.getElementById("spotForm")["genOptions-terminalCategory"].value = myGEN.terminalCategory;
  }
  //hide boundaries for nodes of category...
  //myGEN.invisibleCategories should be an array
  if(myGEN.invisibleCategories && myGEN.invisibleCategories.length){
    var hideCategories = document.getElementsByName('hideCategory');
    //open the fieldset:
    document.getElementById("treeDisplayOptions").setAttribute("class", "open");
    //iterate over specified invisible categories
    for(var x = 0; x<myGEN.invisibleCategories.length; x++){
      //iterate over hideCategory checkboxes
      for(var y = 0; y<hideCategories.length; y++){
        if(hideCategories[y].value === myGEN.invisibleCategories[x]){
          hideCategories[y].checked = true;
        }
      }
    }
  }


  //Step 2: CON. Call a helper function to select the appropriate constraints & categories.
  built_in_con(myCon);

  //Step 3: Trees Call a helper function
  built_in_input(myTrees);
  
  // Step 4: If showTones is not false, the tableaux will be annotated with tones.
  if(showTones){
    var toneCheckbox = document.getElementById("annotatedWithTones");
    //open the tree display options fieldset
    document.getElementById("treeDisplayOptions").setAttribute("class", "open");
    //make sure the annotated with tones checkbox is checked and its options are open
    if(!toneCheckbox.checked){
      toneCheckbox.click();
    }
    //the tone annotation options:
    var toneButtons = document.getElementsByName("toneOptions");
    for(var x = 0; x < toneButtons.length; x++){
      if(toneButtons[x].value===showTones){
        toneButtons[x].checked =  "checked";
      }
      else if (toneButtons[x] !== toneCheckbox){
        //we don't want multiple radio buttons to be checked, it gets confusing
        toneButtons[x].checked = false;
      }
    }
  }
}

//Irish, as analysed in Elfner (2012), with some useful trees
function built_in_Irish(){
  var myGEN = {obeysExhaustivity:['i','phi']};
  var myCON = [{name: "matchSP", cat:"xp"}, {name: "strongStart_Elfner", cat: "w"}, {name: "binMinBranches", cat: "phi"}, {name: "binMaxBranches", cat: "phi"}];
  var myTrees = irish_trees;
  var showTones = "addIrishTones_Elfner";

  my_built_in_analysis(myGEN, showTones, myTrees, myCON);
}

function built_in_Kinyambo(){
  var kGEN = {obeysHeadedness: true, obeysNonrecursivity: true, obeysExhaustivity: true};
  var ktrees = kinyambo_trees;
  var kcon = [{name:'matchSP', cat:'xp'}, {name:'matchPS', cat:'phi'}, {name:'binMinBranches',cat:'phi'}, {name:'binMaxBranches', cat:'phi'}];
  my_built_in_analysis(kGEN, false, ktrees, kcon);
}

function built_in_Japanese_IM2017(){
  var gen = {obeysHeadedness: true, obeysExhaustivity: true};

  var con = [{name: 'matchMaxSP', cat:'xp'}, {name:'matchPS', cat:'phi'}, {name: 'matchSP', cat:'xp'}, {name: 'binMinBranches', cat:'phi'}, {name:'binMaxBranches', cat:'phi'}, {name:'binMaxLeaves', cat:'phi'}, {name:'equalSistersAdj', cat:'phi'}, {name: 'equalSisters2', cat:'phi'}, {name: 'accentAsHead', cat: ''}, {name: 'noLapseL', cat: ''}];

  var jtrees = getAccentTrees();

  my_built_in_analysis(gen, 'addJapaneseTones', jtrees, con);

}

//cf. analysis_html_files/abstractMatchAnalysis.html. Japanese rebracketing project, Kalivoda 2019.
function built_in_Japanese_rebracketing(n){
  var gen = {obeysExhaustivity: true, requireRecWrapper: true, rootCategory: "phi"};
  var pwfcs = [{name: 'binMinBranches', cat:'phi'}, {name:'binMaxBranches', cat:'phi'}, {name:'binMaxLeaves', cat:'phi'}];
  var mapping = [{name: 'matchSP', cat:'xp'}, {name:'matchPS', cat:'phi'}, {name: 'alignRight', cat:'xp'}, {name: 'alignLeft', cat:'xp'}, {name: 'alignRightPS', cat:'phi'}, {name: 'alignLeftPS', cat:'phi'}];
  var jtrees = [tree_3w_1, tree_3w_2, tree_4w_1, tree_4w_2, tree_4w_3, tree_4w_4, tree_4w_5];
  var selected_mapping;
  switch(n){
    case 1: selected_mapping = mapping.slice(0,2); break;
    case 2: selected_mapping = mapping.slice(2); break;
    case 3: selected_mapping = mapping.slice(2,4).concat([mapping[0]]); break;
    case 4: selected_mapping = mapping.slice(2,4).concat([mapping[1]]); break;
    case 5: selected_mapping = mapping.slice(4).concat([mapping[0]]); break;
    case 6: selected_mapping = mapping.slice(4).concat([mapping[1]]); break;
    default: selected_mapping = mapping;
  }
  var con = pwfcs.concat(selected_mapping);
  my_built_in_analysis(gen, false, jtrees, con);
}


function built_in_Japanese_balSis(){
  var gen = {obeysExhaustivity: true, requireRecWrapper: true};

  var con = [{name:'matchPS', cat:'phi'}, {name: 'matchSP', cat:'xp'}, {name: 'binMinBranches', cat:'phi'}, {name:'binMaxBranches', cat:'phi'}, {name:'balancedSisters', cat:'phi'}, {name: 'equalSisters2', cat:'phi'}, {name: 'accentAsHead', cat: ''}, {name: 'noLapseL', cat: ''}];
  var jtrees = getAccentTrees();

  my_built_in_analysis(gen, 'addJapaneseTones', jtrees, con);

}


/* Nick Van Handel's Italian analysis as presented at ICPP2019
*/
function built_in_Italian_NVH(){
  var gen = {obeysHeadedness: true, obeysExhaustivity: true};
  var con = [{name: "matchSP", cat: "xp", options: {requireOvertHead: true}}, {name: "matchMaxSP", cat: "xp", options: {requireOvertHead: true}}, {name: "binMinLeaves", cat: "phi"}, {name: "binMaxLeaves", cat: "phi"}, {name: "binMinLeaves_requireMaximal", cat: "phi"}, {name: "strongStart_SubCat"}];
  var trees = [italian_adj_noun, italian_noun_adj, italian_noun_adv_adj, italian_ditrans, italian_subj_verb, italian_noun_pp, italian_verb_do_1, italian_verb_do_2, italian_verb_do_3];
  my_built_in_analysis(gen, false, trees, con);
}

/* Richard Bibbs's Chamorro clitic analysis as presented at ICPP2019
*/
function built_in_Chamorro_RB(){
  var gen = {obeysHeadedness: true, obeysNonrecursivity: false, obeysExhaustivity: ['i'], cliticMovement: true};
  var con = [{name: 'matchSP', cat:'xp', options:{requireOvertHead:true}}, {name: 'matchPS', cat:'phi'}, {name: 'equalSistersAdj', cat:'phi'}, {name: 'binMaxBranches', cat:'i'}, {name: 'strongStart_Elfner', cat:'syll'}, {name: 'alignLeftMorpheme', cat:"gui' yu' hit hao"}];
  var chamorrotrees = chamorro_clitic_trees;
  my_built_in_analysis(gen, false, chamorrotrees, con);
}

/* Richard Bibbs's Chamorro clitic analysis as presented at LSA2021
*/
function built_in_Chamorro_2021(){
  var gen = {obeysHeadedness: true, obeysNonrecursivity: false, obeysExhaustivity: ['i'], cliticMovement: true};
  var con = [{name: 'alignLeft', cat:'xp'}, {name: 'alignRight', cat:'xp'}, {name:'noShift'}, {name: 'equalSistersAdj'}, {name: 'binMinBranches', cat:'phi'}, {name: 'strongStart_Elfner', cat:'syll'}];
  var chamorrotrees = [
                        {
                            "id": "XP",
                            "cat": "xp",
                            "children": [
                                {
                                    "cat": "xp",
                                    "id": "XP_3",
                                    "children": [
                                        {
                                            "id": "a",
                                            "cat": "x0"
                                        }
                                    ]
                                },
                                {
                                    "cat": "xp",
                                    "id": "DP",
                                    "children": [
                                        {
                                            "id": "wp",
                                            "cat": "clitic"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "XP",
                            "cat": "xp",
                            "children": [
                                {
                                    "cat": "xp",
                                    "id": "XP_4",
                                    "children": [
                                        {
                                            "id": "a",
                                            "cat": "x0"
                                        },
                                        {
                                            "cat": "xp",
                                            "id": "XP_5",
                                            "children": [
                                                {
                                                    "id": "b",
                                                    "cat": "x0"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "cat": "xp",
                                    "id": "DP",
                                    "children": [
                                        {
                                            "id": "wp",
                                            "cat": "clitic"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "XP",
                            "cat": "xp",
                            "children": [
                                {
                                    "cat": "xp",
                                    "id": "XP_4",
                                    "children": [
                                        {
                                            "cat": "xp",
                                            "id": "XP_5",
                                            "children": [
                                                {
                                                    "id": "a",
                                                    "cat": "x0"
                                                }
                                            ]
                                        },
                                        {
                                            "cat": "xp",
                                            "id": "XP_6",
                                            "children": [
                                                {
                                                    "id": "b",
                                                    "cat": "x0"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "cat": "xp",
                                    "id": "DP",
                                    "children": [
                                        {
                                            "id": "wp",
                                            "cat": "clitic"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "id": "XP",
                            "cat": "xp",
                            "children": [
                                {
                                    "cat": "xp",
                                    "id": "XP_4",
                                    "children": [
                                        {
                                            "cat": "xp",
                                            "id": "XP_5",
                                            "children": [
                                                {
                                                    "id": "a",
                                                    "cat": "x0"
                                                }
                                            ]
                                        },
                                        {
                                            "id": "b",
                                            "cat": "x0"
                                        }
                                    ]
                                },
                                {
                                    "cat": "xp",
                                    "id": "DP",
                                    "children": [
                                        {
                                            "id": "wp",
                                            "cat": "clitic"
                                        }
                                    ]
                                }
                            ]
                        }
                    ];
  my_built_in_analysis(gen, false, chamorrotrees, con);
}

function built_in(analysis) {
  if(analysis === "irish") {
    built_in_Irish();
  }
  if(analysis === "kinyambo") {
    built_in_Kinyambo();
  }
  if(analysis === "ito&mester2017"){
    built_in_Japanese_IM2017();
  }
  //Systems for Nick Kalivoda's study of abstract mapping, using Japanese rebracketing
  if(analysis === "japanese_rebracketing_1"){
    built_in_Japanese_rebracketing(1);
  }
  if(analysis === "japanese_rebracketing_2"){
    built_in_Japanese_rebracketing(2);
  }
  if(analysis === "japanese_rebracketing_3"){
    built_in_Japanese_rebracketing(3);
  }
  if(analysis === "japanese_rebracketing_4"){
    built_in_Japanese_rebracketing(4);
  }
  if(analysis === "japanese_rebracketing_5"){
    built_in_Japanese_rebracketing(5);
  }
  if(analysis === "japanese_rebracketing_6"){
    built_in_Japanese_rebracketing(6);
  }

  if(analysis === "japanese_BK_2019"){
    built_in_Japanese_balSis();
  }

  if(analysis=== "italian"){
    built_in_Italian_NVH();
  }
  if(analysis=== "chamorro"){
    built_in_Chamorro_RB();
  }
  if(analysis==="chamorro2021"){
    built_in_Chamorro_2021();
  }
}

/* Record Analysis:
 * function to gather all of the options, constraints and inputs currently in
 * the window
 */
function record_analysis(){
  var analysis = {
    myGEN: {},
    showTones: false,
    myTrees: [],
    myCon: []
  };
  /* analysis has attributes corresponding to inputs to
   * my_built_in_analysis(): myGEN, showTones, myTrees, myCON
   */
  var spotForm = document.getElementById("spotForm");

  //myGEN
  for(var i = 0; i<spotForm.genOptions.length; i++){ //iterate over gen options
    var option = spotForm.genOptions[i];
    //make sure "obeys exhaustivity" has an array value
    if(option.value === "obeysExhaustivity" && option.checked){
      var exCats = [];
			for(var x=0; x<spotForm.exhaustivityCats.length; x++){
				var exCatBox = spotForm.exhaustivityCats[x];
				if(exCatBox.checked)
					exCats = exCats.concat(exCatBox.value);
			}
      analysis.myGEN.obeysExhaustivity = exCats;
    }
    //make sure "showTones" has a string value
    else if(option.value === "usesTones" && option.checked){
      analysis.showTones = spotForm.toneOptions.value;
    }
    else if(option.value === 'maxBranching' && option.checked){
      analysis.myGEN.maxBranching = spotForm['maxBranchingValue'].value;
    }
    else if(option.checked){
      analysis.myGEN[option.value] = true;
    }
  }
  //gen categories:
  analysis.myGEN.rootCategory = spotForm['genOptions-rootCategory'].value;
  analysis.myGEN.recursiveCategory = spotForm['genOptions-recursiveCategory'].value;
  analysis.myGEN.terminalCategory = spotForm['genOptions-terminalCategory'].value;

  //gen hide categories
  analysis.myGEN.invisibleCategories = [];
  for(var i = 0; i < spotForm.hideCategory.length; i++){
    var hiddenCat = spotForm.hideCategory[i];
    if(hiddenCat.checked){
      analysis.myGEN.invisibleCategories.push(hiddenCat.value);
    }
  }

  //myTrees: manual
  if(document.getElementById('treeUI').style.display == 'block'){
    analysis.myTrees = JSON.parse(document.getElementById("stree-textarea").value);
  }
  //myTrees: auto
  else if(document.getElementById('inputOptions').style.display == 'block'){
    analysis.myTrees = {};
    analysis.myTrees.autoInputOptions = {};
    for(let i = 0; i<spotForm.autoInputOptions.length; i++){
      if(spotForm.autoInputOptions[i].checked){
        analysis.myTrees.autoInputOptions[spotForm.autoInputOptions[i].value] = true;
      }
    }
    if(spotForm['autoInputOptions-addClitics'][0].checked){
      analysis.myTrees['autoInputOptions-addClitics'] = spotForm['autoInputOptions-addClitics'].value;
    }
    analysis.myTrees['autoInputOptions-rootCategory'] = spotForm['autoInputOptions-rootCategory'].value;
    analysis.myTrees['autoInputOptions-recursiveCategory'] = spotForm['autoInputOptions-recursiveCategory'].value;
    analysis.myTrees['autoInputOptions-terminalCategory'] = spotForm['autoInputOptions-terminalCategory'].value;
    
    analysis.myTrees['head-req'] = spotForm['head-req'].value;

    if(spotForm.inputToGenAuto.length){
      analysis.myTrees.inputToGenAuto = [];
      for(let i = 0; i<spotForm.inputToGenAuto.length; i++){
        analysis.myTrees.inputToGenAuto.push(spotForm.inputToGenAuto[i].value);
      }
    }
    else {
      analysis.myTrees.inputToGenAuto = [spotForm.inputToGenAuto.value];
    }

    // GEN input strings

    const strGENboxes = document.getElementsByName('genStringsInput');
    const strMinBoxes = document.getElementsByName('genStringsMin');
    const strMaxBoxes = document.getElementsByName('genStringsMax');

    //if there are a different number of these boxes, you will get weird results
    //this should never happen, though, unless the interface is broken
    if(strGENboxes.length !== strMinBoxes.length || strGENboxes.length !== strMaxBoxes.length){
      const err = new Error("Missing interface element");
      displayError("Error: " + err.message + '. Interface is broken at "Generate Combinations and \
      Permutations and cannot be saved at this time.');
      throw err;
    }

    analysis.myTrees.terminalStrings = [];

    for(let i = 0; i < strGENboxes.length; i++){

      const terminals = strGENboxes[i].value;
      const min = strMinBoxes[i].value;
      const max = strMaxBoxes[i].value;

      if(terminals || min || max){
        analysis.myTrees.terminalStrings.push({
          genStringsInput: terminals ?? '',
          genStringsMin: min ?? '',
          genStringsMax: max ?? '',
        });
      }
    }

  }
  else {
    displayError('GEN input not found');
    throw new Error('GEN input not found');
  }

  //myCon
  var uCon = spotForm.constraints;
  for(var i = 0; i<uCon.length; i++){ //iterate over constraints in interface
    var cName = uCon[i].value; //constraint name for myCON array
    if(uCon[i].checked){
      if(spotForm['category-'+cName]){
        var uCategories = spotForm['category-'+cName]; //categories for this constraint
        //handeling alignLeftMorpheme: (category is actually a user defined string)
        if(!uCategories.length){
          analysis.myCon.push({name: cName, cat: uCategories.value});
        }
        //basically every other case: (category is actually a category)
        else{
          for(var x = 0; x<uCategories.length; x++){ //iterate over categories
            var cat = uCategories[x];
            if(cat.checked){
              analysis.myCon.push({name: cName, cat: cat.value}); //add to con
            }
          }
        }
      }
      else{
        //if the constraint does not have category specifications (accent constraints)
        analysis.myCon.push({name: cName}); //add to con without category specification
      }
    }
  }
  //optionable constraints:
  //iterate over all the selected constraints
  for(var i = 0; i<analysis.myCon.length; i++){
    var optionableCon = analysis.myCon[i];
    //if the constraint has options
    if(spotForm["option-"+optionableCon.name]){
      optionableCon.options = {};
      var conOptions = spotForm["option-"+optionableCon.name];
      if(conOptions.length){
        //iterate over the options for this match constraint
        for(var x = 0; x<conOptions.length; x++){
          //if this option is a checkbox, record if it is checked
          if(conOptions[x].type == "checkbox"){
            optionableCon.options[conOptions[x].value] = conOptions[x].checked;
          }
          //if this option is a drop-down selector, record its value so long as it is not default
          else if(conOptions[x].tagName === "SELECT" && conOptions[x].value != "any"){
            optionableCon.options[conOptions[x].value] = true;
          }
        }
      }
      else{
        //when there is only one option
        if(conOptions.type == "checkbox"){
          optionableCon.options[conOptions.value] = conOptions.checked;
        }
        else if(conOptions.tagName === "SELECTOR"){
          optionableCon.options[conOptions.value] = true;
        }
      }
    }
  }

  return JSON.stringify(analysis);
}

/* funtion to create the elements necessary to download an analysis in JSON
 * string form.
 * Takes two arguments, both strings, the analysis in JSON string form and the
 * file name. This function will append ".SPOT" to the filename
 * fileName is an argument for this function in case we want to make the user
 * choose the file name instead of calling the file myAnalysis automatically
 */
function saveAnalysis(analysis, fileName){
  //Blob object becomees downloadable text file
  var spotAnalysis = new Blob(["//SPOT analysis file usable at https://people.ucsc.edu/~jbellik/spot/interface1.html\n"+"'"+analysis+"'"+"\n"], {type: "text/plain;charset=utf-8"});
  fileName = fileName+".SPOT";
  //saveAs is defined at the bottom of interface1.js
  saveAs(spotAnalysis, fileName);
  //confirmation:
  document.getElementById("save/load-dialog").innerHTML = "File saved as "+fileName+" <br/>Press \"Load\" and choose "+fileName+" to load this analysis in the future."
}

// function to show file upload button and instructions for loading an analysis
function loadAnalysis(file){
  //only run if the file has the extention ".SPOT"
  if(file.name.slice(-5)===".SPOT"){
    var contents; //file contentes
    read = new FileReader();
    read.readAsText(file);
    read.onload = function(){
      contents = read.result;
      try{
        /* JSON string begins on the second line of the SPOT file
         * (indexOf("\n")+2) and ends right before a newline character (-2)
        */
        var analysis = JSON.parse(contents.slice(contents.indexOf("\n")+2, -2));
        //load the built-in analysis using the parameters set in file
        my_built_in_analysis(analysis.myGEN, analysis.showTones, analysis.myTrees, analysis.myCon);
        var dialog = document.getElementById("save/load-dialog");
        dialog.innerHTML = "Analysis loaded. Choose another file to change analysis.";
        document.getElementById("chooseFilePrompt").style = "display: none";
      }
      catch(err){
        //error handling:
        displayError('File does not follow SPOT format: ' + err.message, err);
        return;
      }
    }
  }
}
/**
 * Functions that handle automatic syntactic tree generation
 * on the html interface
 */

//Getter function that helps with terminal string generation
function getStringsList() {
    return genStringsList;
}


/** Helper function for generating syntactic trees
 *  Called by genTerminalStrings() which is called by autoGenInputTree()
 */
function addFixedTerminalStringsToTable(){
    var length = spotForm.inputToGenAuto.length;
    if(length === undefined) {
        length = 1;
    }
    var inputString = spotForm.inputToGenAuto.value;
    var fixedStringList = [];
    

    for(var i=0; i<length; i++){
        if(length > 1) {
            inputString = spotForm.inputToGenAuto[i].value;
        }
        if(inputString !== "") {
            fixedStringList.push(inputString);
        }
    }
    if(fixedStringList.length > 0) {
        displayStringsTable(fixedStringList);
        genStringsList = fixedStringList;
    }
}


/**
 * CALLED BY "GENERATE TREES"
 * Functions that handle generation and display of syntactic trees 
 * from user-specifications on the interface.
 */

// Adds input field so user can add another terminal string
function addTerminalString(){
    var length = spotForm.inputToGenAuto.length;
    if(length === undefined) {
        length = 1;
    }
    var newLength = length + 1;
    length = length.toString();
    newLength = newLength.toString();
    document.getElementById('str'+length).insertAdjacentHTML('afterend', "<p id='str"+newLength+"'>String of terminals "+newLength+": <input type='text' name='inputToGenAuto'></p>");
    document.getElementById('autoDoneMessage').style.display = 'none';
}

 // Display tables of automatically generated syntactic trees
function displayTable(sTreeList) {
    var treeTable = treeToTable(sTreeList);
    document.getElementById('autoTreeBox').innerHTML += treeTable;
}

// Helper for displayTable and thus autoGenInputTree:
// A function to create an html table from sTreeList, the list of syntactic trees
function treeToTable(sTreeList) {
    var htmlChunks = ['<table class="auto-table"><tbody>'];
    var i = 1;
    for(var s in sTreeList) {
        var parTree = parenthesizeTree(sTreeList[s]);
        htmlChunks.push('<tr>');
        htmlChunks.push('<td>' + i + "." + '</td>');
        htmlChunks.push('<td>' + parTree + '</td>');
        htmlChunks.push('</tr>');
        i++;
    }
    htmlChunks.push('</tbody></table>');
    return htmlChunks.join('');
}

function makeAndDisplaySTrees(){
    document.getElementById('autoDoneMessage').style.display = 'inline-block';
    autoGenInputTree();
    document.getElementById('autoTreeArea').style.display = 'block';
    document.getElementById('syntax-tree-switch').checked = true;
    document.getElementById('syntax-switch-text').innerHTML = 'Hide syntactic trees';
}


var sTreeList;
window.getAutoSTreeList = function(){
    return sTreeList;
}

/**
 * Function that automatically generates input syntactic trees
 * from user input on the interface (interface1.html)
 * 
 * Called by: makeAndDisplaySTrees()
 * 
 * Calls: 
 * - genTerminalStrings()
 * - getStringsList()
 * - displayTable()
 * 
 * Modifies sTreeList
 */
function autoGenInputTree() {
    genTerminalStrings();
    var strings = getStringsList();	//this is both fixed strings and strings generated by combinations/permutations
    var length = strings.length;

    sTreeList = undefined;
    document.getElementById('autoTreeBox').innerHTML = "";

    for(var i=0; i<length; i++){
        var inputString = strings[i];

        // allow adjuncts and remove mirror images
        var autoInputOptions = {};
        var optionBox = spotForm.autoInputOptions;
        for(var j = 0; j < optionBox.length; j++) {
            if(optionBox[j].value == "noAdjuncts" || optionBox[j].value == "noBarLevels") {
                autoInputOptions[optionBox[j].value] =! optionBox[j].checked;
            }
            else {
                autoInputOptions[optionBox[j].value]=optionBox[j].checked;
            }
        }

        // head requirements
        var headReq = document.getElementById('head-req').value;
        if(headReq !== 'select') {
            var headSideVal = headReq;
        }
        autoInputOptions.headSide = headSideVal;

        // add clitics directly under root
        if(document.getElementById('add-clitics').checked) {
            var addCliticsVal = document.getElementById('add-clitics').value;
            if(document.getElementById('add-clitics-left').checked) {
                addCliticsVal = 'left';
            }
        }
        autoInputOptions.addClitics = addCliticsVal;

        // root, recursive terminal, category
        autoInputOptions.rootCategory = spotForm['autoInputOptions-rootCategory'].value;
        autoInputOptions.recursiveCategory = spotForm['autoInputOptions-recursiveCategory'].value;
        autoInputOptions.terminalCategory = spotForm['autoInputOptions-terminalCategory'].value;

        if(autoInputOptions.recursiveCategory === 'x0' || autoInputOptions.noUnary){
            autoInputOptions.noAdjacentHeads = false;
        }

        // console.log(autoInputOptions)

        if(inputString !== "") {
            var currSTreeList = sTreeGEN(inputString, autoInputOptions);
            displayTable(currSTreeList);
            if(sTreeList) {
                sTreeList = sTreeList.concat(currSTreeList);
            }
            else {
                sTreeList = currSTreeList;
            }
        }
    }
    //console.log(sTreeList)
}/**
 * Functions that handle generation of terminal strings on the interface
 */
var terminalStringGenInputMsg = "You must supply at least one list of terminals in order to generate combinations and permutations of terminals.";
var genStringsList;

/**
 * Helper function for genTerminalStrings() and addCombinationsPermuatationsToTable()
 * Checks if any list of terminals has been provided in "Generate combinations and permutations"
 */ 
function terminalGenInputPresent(){
		
    var numTerminalStrings = spotForm.genStringsInput.length;
    if(numTerminalStrings === undefined) {
        numTerminalStrings = 1;
    }
    var inputPresent = false;
    var i = 0;
    while(!inputPresent && i<numTerminalStrings){
        inputPresent = (numTerminalStrings==1 ? spotForm.genStringsInput.value !== "": spotForm.genStringsInput[i].value !== "");
        i++;
    }

    return inputPresent;
}

/**
 * Validates user inputs for generating combinations and permutations of terminals
 * and generates terminal strings according to those specifications if everything is valid.
 * 
 * Displays errors if:
 * - any min or max field is missing
 * - any max or min field is non-numeric
 * - any max or min field is more than 10 or less than 1
 * - min field is more than max field
 * 
 * Displays warnings if:
 * - any max or min field is more than 5
 * 
 * Depends on:
 * - terminalGenInputPresent()
 * - generateTerminalStrings(): in inputCandidateGenerator.js [?]
 * - displayStringsTable()
 * 
 * Changes genStringsList
 */
function addCombinationsPermuatationsToTable(){
    //Begin input validation for generating combinations/permutations (generateTerminalStrings())
    var inputIsFive = false; //if the min or max input is 5 flag
    var minOrMaxProblem = false; //if there is a min or max input problem flag
    var problem = ""; //string indicating what the min or max problem is
    var stringTerminalInput, minTerminalInput, maxTerminalInput; //the list of terminals input, min input, and max input
    var inputCheckNeeded = false; //if there is more than one input then check for input being empty or not is needed

    var numTerminalStrings = spotForm.genStringsInput.length;
    if(numTerminalStrings === undefined) {
        numTerminalStrings = 1;
    }

    
    /*Only bother to validate everything else if at least one list of terminals is provided.
    If terminalGenInputPresent() returns false, then all the List of terminals are empty. */
    if(terminalGenInputPresent()){
        terminalStringsValidationLoop:
        for(var i=0; i<numTerminalStrings; i++){
            /*checking if the length is more than 1*/
            if (numTerminalStrings > 1){
                inputCheckNeeded = true;
                stringTerminalInput = spotForm.genStringsInput[i].value;
                minTerminalInput = spotForm.genStringsMin[i].value;
                maxTerminalInput = spotForm.genStringsMax[i].value;
            }else{
                inputCheckNeeded = false;
                minTerminalInput = spotForm.genStringsMin.value;
                maxTerminalInput = spotForm.genStringsMax.value;
            }
            if ((inputCheckNeeded == true && stringTerminalInput !== "") || inputCheckNeeded == false){
                /*checking if min or max is empty*/
                if (minTerminalInput === "" || maxTerminalInput === ""){
                    minOrMaxProblem = true;
                    problem = "Empty";
                    break terminalStringsValidationLoop;
                }
                /*checking if min or max is not a number*/
                if (isNaN(minTerminalInput) || isNaN(maxTerminalInput)){
                    minOrMaxProblem = true;
                    problem = "NonNumber";
                    break terminalStringsValidationLoop;
                }
                /*checking if min or max is less than or equal to 0*/
                if (Number(minTerminalInput) <= 0 || Number(maxTerminalInput) <= 0){
                    minOrMaxProblem = true;
                    problem = "Zero";
                    break terminalStringsValidationLoop;
                }
                /*checking if min or max is more than or equal to 10*/
                if (Number(minTerminalInput) >= 10 || Number(maxTerminalInput) >= 10){
                    minOrMaxProblem = true;
                    problem = "Ten";
                    break terminalStringsValidationLoop;
                }
                /*checking if min is greater than max*/
                if (Number(maxTerminalInput) <  Number(minTerminalInput)){
                    minOrMaxProblem = true;
                    problem = "MinGreaterThanMax";
                    break terminalStringsValidationLoop;
                }
                /*checking if min or max is more than or equal to 5*/
                if (Number(minTerminalInput) >= 5 || Number(maxTerminalInput) >= 5){
                    inputIsFive = true;
                }
            }
        }
        /*if there is an error with min or max input*/
        if (minOrMaxProblem == true){
            if (problem === "Empty"){
                displayError("Min or Max input missing in 'Generate combinations and permutations'.");
            }else if(problem === "NonNumber"){
                displayError("Min or Max input is not a number in 'Generate combinations and permutations.'");
            }else if(problem === "Zero"){
                displayError("Min and Max inputs must be larger than 0 in 'Generate combinations and permutations.'");
            }else if(problem === "Ten"){
                displayError("Min and Max inputs must be less than 10 in 'Generate combinations and permutations.'");
            }else if(problem === "MinGreaterThanMax"){
                displayError("Min input must be smaller than Max input in 'Generate combinations and permutations.'");
            }
        }else{
            /*confirm user wants to continue if the input is greater than or equal to 5 */
            if (inputIsFive == true){
                if(!confirm("Min or Max input is greater than or equal to 5 which may cause your browser to freeze due to too many terminal strings being generated. Confirm that you want to continue.")){
                    throw new Error ('Min or Max input is greater than or equal to 5.');
                }
            }
            var inputList = spotForm.genStringsInput.value;
            var min = spotForm.genStringsMin.value;
            var max = spotForm.genStringsMax.value;

            for(var i=0; i<numTerminalStrings; i++){
                if(numTerminalStrings > 1) {
                inputList = spotForm.genStringsInput[i].value;
                min = spotForm.genStringsMin[i].value;
                max = spotForm.genStringsMax[i].value;
                }
                /* Actual calculation of terminal strings here*/
                if(inputList !== "") {
                    inputList = inputList.trim().split(' ');
                    var currGenStringsList = generateTerminalStrings(inputList, min, max)
                    displayStringsTable(currGenStringsList);

                    if(genStringsList) {
                        genStringsList = genStringsList.concat(currGenStringsList);
                    }
                    else {
                        genStringsList = currGenStringsList;
                    }
                }
            }
        }
    }
    //else{
    //	console.warn(terminalStringGenInputMsg);
    //}
}




/* Generate and display terminal strings
   This includes: 
   - fixed strings taken from "inputToGenAuto", and 
   - strings to run generateTerminalStrings() on, taken from "genStringsInput"
   - TODO rename these fields!
*/
function genTerminalStrings() {
    //Remove any previously generated strings from the table of generated strings
    document.getElementById('genStringsBox').innerHTML = "";
    genStringsList = undefined; //genStringsList is declared at the top of this file

    addFixedTerminalStringsToTable();
    
    //Provide warnings if an input is present but the fieldset is closed, or vice versa.
    if(terminalGenInputPresent() && !document.getElementById("stringGeneration").classList.contains("open")){
        displayWarning("You provided an input(s) to 'Generate combinations and permutations', but have closed that section. Your input there, which is not currently visible, will be included in calculations unless you delete it.");
    }
    /*if(document.getElementById("stringGeneration").classList.contains("open") && !terminalGenInputPresent()){
        displayWarning(terminalStringGenInputMsg);
    }*/

    //Validate inputs to generateTerminalStrings, and run it.
    addCombinationsPermuatationsToTable();
    
}


// TerminalStringsGen helper: create table from generated terminal strings list
function stringToTable(genStringsList, index) {
    var htmlChunks = ['<table class="auto-table string-table" id="string-table-' + index + '"><tbody>'];
    var i = 1;
    for(var s in genStringsList) {
        var string = genStringsList[s];
        htmlChunks.push('<tr>');
        htmlChunks.push('<td>' + i + "." + '</td>');
        htmlChunks.push('<td>' + string + '</td>');
        htmlChunks.push('</tr>');
        i++;
    }
    htmlChunks.push('</tbody></table>');
    return htmlChunks.join('');
}

// TerminalStringsGen helper: display generated terminal strings in table
function displayStringsTable(genStringsList) {
    var tables = document.getElementsByClassName("string-table");
    var index = tables.length + 1;
    var stringsTable = stringToTable(genStringsList, index);
    document.getElementById('genStringsBox').innerHTML += stringsTable;
    addThickLine(genStringsList, index);
}

// TerminalStringsGen helper: add thicker line between generated strings of different lengths
function addThickLine(genStringsList, index) {
    var sheet = document.styleSheets[document.styleSheets.length - 1];
    for(var i = 0; i < genStringsList.length - 1; i++) {
        var currString = genStringsList[i].split(' ');
        var nextString = genStringsList[i + 1].split(' ');
        if(currString.length < nextString.length) {
            var row = i + 1;
            sheet.addRule('#string-table-' + index + ' tbody > :nth-child(' + row + ')', 'border-bottom: 3px solid black;', 0);
        }
    }
}

// TerminalStringsGen helper: remove thicker line between generated strings of different lengths before regenerating strings
function deleteThickLine() {
    var sheet = document.styleSheets[document.styleSheets.length - 1];
    var rules = 0;
    for(var i = 0; i < sheet.cssRules.length; i++) {
        if(sheet.cssRules[i].cssText.includes('#string-table')) {
            rules++;
        }
    }
    for(var i = 0; i < rules; i++) {
        sheet.deleteRule(0);
    }
}

// TerminalStringsGen helper: runs when "Generate terminal strings" is clicked
function makeAndDisplayTerminalStrings(){
    if(terminalGenInputPresent()){
        deleteThickLine();
        genTerminalStrings();
        document.getElementById('genStringsArea').style.display = 'block';
        document.getElementById('gen-strings-switch').checked = true;
        document.getElementById('strings-switch-text').innerHTML = 'Hide generated terminals strings';
    }
    else{
        displayError(terminalStringGenInputMsg);
    }
}
/**
 * Functions that manage what content is displayed or hidden on interface1.html
 * without actually generating content
 * 
 * Related to input GEN (syntactic trees):
 * - changeInputTabs
 * - addTerminalStringList
 * - showHideGeneratedTerminalStrings
 * - displaySettingsRecursiveX0
 * - displaySettingsRecursiveCP
 * - dipslaySettingsRecursiveXP
 * 
 * - barLevelsHeadReq
 * - showHideSTreeCliticOptions
 * - showHideGeneratedSTrees
 * 
 * Related to output GEN (prosodic trees):
 * - toneInfoBlock
 * - showMaxBranching
 * - exhaustivityDisplay
 * - movementOptionsDisplay
 * - toneOptionDisplay
 * - markProsodicHeadsDisplay
 * 
 * Related to constraints:
 * - openCloseFieldset
 * - showMore
 * 
 * Related to clearing:
 * - clearTableau
 * - clearAll
 */


// === INPUT GEN DISPLAY FUNCTIONS ===

/* Manages tab display for GEN: Input parameters:
*  Automatic vs. Manual tree building
*/
function changeInputTabs(from, to) {
	var fromButton = 	document.getElementById(from);
	var toButton = document.getElementById(to);
	// if from === 'inputButton'
	var show = 	document.getElementById('treeUI');
	var hide = document.getElementById('inputOptions');
	if(from === 'goButton') {
		show = 	document.getElementById('inputOptions');
		hide = document.getElementById('treeUI');
	}
	show.style.display = 'block';
	toButton.style.backgroundColor = 'white';
	toButton.style.borderColor = '#3A5370';
	if(hide.style.display === 'block') {
		hide.style.display = 'none';
		fromButton.style.backgroundColor = '#d0d8e0';
		fromButton.style.borderColor = '#d0d8e0';
	}
}

/** Input Gen: Terminal strings
 * Adds a set of input fields for generating combinations and permutations of terminal strings */
function addTerminalStringList() {
    var length = spotForm.genStringsInput.length;
    if(length === undefined) {
        length = 1;
    }
    var newLength = length + 1;
    length = length.toString();
    newLength = newLength.toString();
    document.getElementById('list'+length).insertAdjacentHTML('afterend', "<div id='list"+newLength+"'>List of terminals "+newLength+": <input type='text' name='genStringsInput'><p>Number of terminals in generated strings:</p><p class='genStringsNum'>Min: <input type='text' name='genStringsMin' class='genStringsNumBox' style='margin-left: 4px'></p><p class='genStringsNum'>Max: <input type='text' name='genStringsMax' class='genStringsNumBox'></p></div>");
    document.getElementById('autoDoneMessage').style.display = 'none';
}

/** Input Gen: Terminal strings
 * Shows or hides generated terminal strings */
function showHideGeneratedTermStrings() {
    if (document.getElementById('genStringsArea').style.display === 'none' && document.getElementById('gen-strings-switch').checked){
        document.getElementById('genStringsArea').style.display = 'block';
        document.getElementById('strings-switch-text').innerHTML = 'Hide generated terminals strings';
    }
    else{
        document.getElementById('genStringsArea').style.display = 'none';
        document.getElementById('strings-switch-text').innerHTML = 'Show generated terminals strings';
    }
}

/** Input Gen for trees: syntactic parameters
 *  When x0 is selected as the recursive category, bar levels are irrelevant
 *  and head side is also irrelevant
*/
function displaySettingsRecursiveX0() {
    if(document.getElementsByName('autoInputOptions-recursiveCategory')[2].checked == true) {
        // console.log("xo checked")
        var x = document.getElementsByName("autoInputOptions")[noBarLevelsIndex];
        if(x.checked === true) {
            x.checked = false;
        }
        x.disabled = true;
        var y = document.getElementById('head-req').options;
        y[1].disabled = true;
        y[2].disabled = true;
        y[3].disabled = true;
        y[4].disabled = true;
    }
}

/** Input Gen for trees: syntactic parameters*/
function displaySettingsRecursiveCP() {
    if(document.getElementsByName('autoInputOptions-recursiveCategory')[0].checked == true) {
        // console.log("cp checked")
        var x = document.getElementsByName("autoInputOptions")[noBarLevelsIndex];
        x.disabled = false;
        var y = document.getElementById('head-req').options;
        y[1].disabled = false;
        y[2].disabled = false;
        if(x.checked) {
            y[3].disabled = false;
            y[4].disabled = false;
        }
        else {
            y[3].disabled = true;
            y[4].disabled = true;
        }
    }
}

/** Input Gen for trees: syntactic parameters*/
function displaySettingsRecursiveXP() {
    if(document.getElementsByName('autoInputOptions-recursiveCategory')[1].checked == true) {
        // console.log("xp checked")
        var x = document.getElementsByName("autoInputOptions")[noBarLevelsIndex];
        x.disabled = false;
        var y = document.getElementById('head-req').options;
        y[1].disabled = false;
        y[2].disabled = false;
        if(x.checked) {
            y[3].disabled = false;
            y[4].disabled = false;
        }
        else {
            y[3].disabled = true;
            y[4].disabled = true;
        }
    }
}



/** Helper for Gen: Input parameters 
 *  Handles the interaction between enabling/disabling visibility of bar levels
 *  and the options for head alignment settings. 
 *  If bar levels are not treated as XPs, then more settings are relevant bc
 *  ternary structures will be included.
 */
function barLevelsHeadReq() {
    var x = document.getElementsByName("autoInputOptions")[noBarLevelsIndex];
    var y = document.getElementById('head-req').options;

    if(x.checked === false) {    
        // Heads must be perfectly left-aligned
        y[1].disabled = false;
        // Heads must be perfectly right-aligned
        y[2].disabled = false;
        // Heads must be on the left edge
        y[3].disabled = false;
        // Heads must be on the right edge
        y[4].disabled = false;
    }
    else {
        y[1].disabled = false;
        y[2].disabled = false;
        y[3].disabled = true;
        y[4].disabled = true;
    }
}

function showHideSTreeCliticOptions(){
    if(document.getElementById('add-clitics').checked) {
        document.getElementById('add-clitics-row').style.display = 'block';
    }
    else {
        document.getElementById('add-clitics-row').style.display = 'none';
    }
}

function showHideGeneratedSTrees(){
    if (document.getElementById('autoTreeArea').style.display === 'none' && document.getElementById('syntax-tree-switch').checked){
        document.getElementById('autoTreeArea').style.display = 'block';
        document.getElementById('syntax-switch-text').innerHTML = 'Hide syntactic trees';
    }
    else{
        document.getElementById('autoTreeArea').style.display = 'none';
        document.getElementById('syntax-switch-text').innerHTML = 'Show syntactic trees';
    }
}


//===OUTPUT GEN DISPLAY FUNCTIONS===

/* Manages the info blocks for 
   GEN: Output parameters > Tree marking options > Annotated with tones 
*/
function toneInfoBlock(language){
	var content = document.getElementById("tonesInfoContent");
	var japaneseContent = "Tokyo Japanese: the left edge of &phi; is marked with a rising boundary tone (LH), accented words receive an HL on the accented syllable, and H tones that follow a pitch drop (HL) within the maximal &phi; are downstepped (!H). (See: Pierrehumbert and Beckman 1988; Gussenhoven 2004; Ito and Mester 2007) Accents, boundary tones, and downstep in Lekeitio Basque are realized with the same tones as in Tokyo Japanese.";
	var irishContent = "Conamara Irish (Elfner 2012): The left edge of the non-minimal &phi; is marked with a rising boundary tone (LH), and the right edge of every &phi; is marked with a falling boundary tone (HL).";
	var format = "font-size: 13px; color: #555; margin-left: 25px; display: table-cell";
	if (language == "japanese"){
		if (content.innerHTML == japaneseContent){
			content.style = "display: none";
			content.innerHTML = '';
		}
		else{
			content.style = format;
			content.innerHTML = japaneseContent;
		}
	}
	if (language === "irish"){
		if (content.innerHTML == irishContent){
			content.style = "display: none";
			content.innerHTML = '';
		}
		else {
			content.style = format;
			content.innerHTML = irishContent;
		}
	}
}

/* Adds or hides an inline textfield for 
    GEN: Output options > Restrict maximum number of branches 
*/
function showMaxBranching() {
	var text = document.getElementById('maxBranchingText');
	var checkBox = document.getElementById('maxBranchingBox')
	if(checkBox.checked) {
		text.style.display = 'inline';
	}
	else{
		text.style.display = 'none';
	}
}

function exhaustivityDisplay(){
    if (document.getElementById('exhaustivityDetailOption1').style.display === 'none' && document.getElementById('exhaustivityBox').checked){
        document.getElementById('exhaustivityDetailOption1').style.display = 'table-cell';
        document.getElementById('exhaustivityDetailOption2').style.display = 'table-cell';
    }
    else{
        document.getElementById('exhaustivityDetailOption1').style.display = 'none';
        document.getElementById('exhaustivityDetailOption2').style.display = 'none';
        //if (genOptions['obeysExhaustivity']){
        //	genOptions['obeysExhaustivity'] = false;
        //}

    }
}

function movementOptionsDisplay(){
    var movementSpecifications = document.getElementById('movementSpecification');
    if (movementSpecifications.style.display === 'none' && document.getElementById('movementOptions').checked){
        movementSpecifications.style.display = 'block';
    }
    else{
        movementSpecifications.style.display = 'none';
    }
}

function toneOptionDisplay(){
    if (document.getElementById('tonesSelectionRow').style.display === 'none' && document.getElementById('annotatedWithTones').checked){
        document.getElementById('tonesSelectionRow').style.display = '';
    }
    else{
        document.getElementById('tonesSelectionRow').style.display = 'none';
    }

}

function markProsodicHeadsDisplay(){
    if ((document.getElementById('binMaxHead').checked || document.getElementById('binMinHead').checked) && !document.getElementById('showHeads').checked){
        document.getElementById('treeDisplayOptions').setAttribute('class','open');
        document.getElementById('showHeads').checked = true;
        displayWarning('"Mark prosodic heads" in "Tree marking option" will remain checked while BinMaxHead or BinMinHead is active.');
    }
    if (document.getElementById('showHeads').checked){
        document.getElementById('headSideOptions').style.display = '';
    }
    else{
        document.getElementById('headSideOptions').style.display = 'none';
    }
}

//===CONSTRAINTS===

//Opens or closes fieldsets when their header or arrow is clicked
function openCloseFieldset(event) {
    var el = event.target;
    var legend = el.closest('legend');
    if (legend) {
        var fieldset = legend.closest('fieldset');
        if (fieldset) {
            fieldset.classList.toggle('open');
            return;
        }
    }


    if (el.classList.contains('info')) {
        el.classList.toggle('showing')
    }
}

/* Shows/hides the "Show more..." section of each constraint fieldset*/
function showMore(constraintType, moreText="Show more...") {
	var x = document.getElementById(constraintType);
	var showMore = constraintType + "Show";
	var y = document.getElementById(showMore);

  if (x.style.display === "block") {
    x.style.display = "none";
	y.innerHTML = moreText;
  } else {
    x.style.display = "block";
		y.innerHTML = "Show less...";
  }
}



//===CLEARING RESULTS===

/**
 * Clears the results container; called when the user clicks on the "Clear results" button
 */
function clearTableau() {
	document.getElementById('results-container').innerHTML = "";
	document.getElementById('results-container').className = "";
}

/** Clears all inputs from interface */
function clearAll(){
    clearAnalysis();
    document.getElementById('treeUIinner').style.display = 'none';
    document.getElementById('built-in-dropdown').value = 'select';
    document.getElementById('fileUpload').value = '';
    document.getElementById('chooseFilePrompt').style = "font-size: 13px; color: #555";
    document.getElementById('chooseFile').style = "display: none";
    document.getElementById('save/load-dialog').innerHTML = '';
}/**
 * ERROR AND WARNING FUNCTIONS used on interface1.html
 */


// Function that closes error and warning messages in interface
function closeButton() {
	var close = document.getElementsByClassName("closebtn");
	var i;

	for (i = 0; i < close.length; i++) {
		close[i].onclick = function() {
			var div = this.parentElement;
			div.style.opacity = "0";
			setTimeout(function() {
				div.style.display = "none";
			}, 600);
		}
	}
}

//Display a red Error! box at the top of the page
function displayError(errorMsg, error) {
	if(error !== undefined) {
		console.error(error);
	}
	else {
		console.error("Error: " + errorMsg);
	}

	var spotForm = document.getElementById('spotForm');
	if (!spotForm) {
		alert("Error: " + errorMsg);
		return;
	}

	var div = document.getElementById("error");
	div.children[2].innerHTML = errorMsg;
	div.style.display = "block";
	div.style.opacity = "100";
	closeButton();
}

// Display orange Warning! box at the top of the page
function displayWarning(warnMsg) {
	console.warn("Warning: " + warnMsg);

	var spotForm = document.getElementById('spotForm');
	if (!spotForm) {
		alert("Warning: " + warnMsg);
		return;
	}

	var div = document.getElementById("warning");
	div.children[2].innerHTML = warnMsg;
	div.style.display = "block";
	div.style.opacity = "100";
	closeButton();
}/**
 * Load function for interface1.html
 * Adds many event listeners with functions defined in the other .js files in the interface_JS directory.
 */

var treeUIsTreeMap = {};

window.addEventListener('load', function(){

	window.spotForm = document.getElementById('spotForm');

	if (!window.spotForm) {
		console.error('no spot form');
		return;
	}

	spotForm.addEventListener('change', function(ev) {
		var target = ev.target;
		if (target.name === 'constraints') {
			var catRow = target.closest('div .constraint-selection-table').classList;
			if (target.checked) {
				catRow.add('constraint-checked');
			}
			else {
				catRow.remove('constraint-checked');
			}
			//console.log(catRow);
		}

	});

	spotForm.addEventListener("change", function(){
		document.getElementById("save/load-dialog").innerHTML = '';
	});

	// Get Results button
	spotForm.onsubmit=sendToTableau;

	//treeEditOptions - dropdown list
	document.getElementById('treeEditOption').onchange = sendToTableau;

	document.body.addEventListener('click', openCloseFieldset); //Opening and closing fieldsets (mostly for constraints)
	document.getElementById("clearAllButton").addEventListener("click", clearAll);

	/** ===SHOWING/HIDING OPTIONS UNDER GEN: OUTPUT PARAMETERS=== */
	document.getElementById('exhaustivityBox').addEventListener('click', exhaustivityDisplay);
	document.getElementById('movementOptions').addEventListener('click', movementOptionsDisplay)
	document.getElementById('annotatedWithTones').addEventListener('click', toneOptionDisplay);
	document.getElementById('showHeads').addEventListener('click', markProsodicHeadsDisplay);

	/** ===CHECKING showHeads IF BinMaxHead CHECKED=== */
	document.getElementById('binMaxHead').addEventListener('click', markProsodicHeadsDisplay);
	document.getElementById('binMinHead').addEventListener('click', markProsodicHeadsDisplay);

	//===MANUAL TREE-BUILDER===

	//Code for generating the JS for a syntactic tree
	var treeTableContainer = document.getElementById('treeTableContainer');

	//Open the tree making GUI when the users clicks "Build syntax"
	document.getElementById('goButton').addEventListener('click', function(){
		changeInputTabs('inputButton', 'goButton');
	});


	//Set up the table for manual tree creation...
	document.getElementById('buildButton').addEventListener('click', setUpTreeBuilderTable);

	document.getElementById('treeUImakeParent').addEventListener('click', treeUIMakeParent);
	document.getElementById('treeUIdeleteNodes').addEventListener('click', deleteTreeUINodes);
	document.getElementById('treeUIclearSelection').addEventListener('click', treeUIClearSelection);

	
	//Look at the html tree and turn it into a JSON tree. Put the JSON in the following textarea.
	document.getElementById('htmlToJsonTreeButton').addEventListener('click', htmlToJSONTree);

	//Show/hide the tree code area
	document.getElementById('tree-code-box').addEventListener('click', showHideTreeCode);

	//Legacy code that should probably get deleted
	document.getElementById('danishJsonTreesButton').addEventListener('click', function() {
		spotForm.sTree.value = JSON.stringify(danishTrees(), null, 4);
	});

	treeTableContainer.addEventListener('input', function(e) {
		var target = e.target;
		var idPieces = target.id.split('-');
		//console.log(idPieces);
		var treeIndex = idPieces[2];
		var nodeId = idPieces[1];
		var isCat = idPieces[0] === 'catInput';
		treeUIsTreeMap[treeIndex].nodeMap[nodeId][isCat ? 'cat' : 'id'] = target.value;
		document.getElementById('doneMessage').style.display = 'none';
	});


	treeTableContainer.addEventListener('click', function(e) {
		var node = e.target;
		if (e.target.classList.contains('stemSide') || e.target.classList.contains('inputContainer')) {
			while (node && !node.classList.contains('treeNode')) {
				node = node.parentElement;
			}
		}
		if (node.classList.contains('treeNode')) {
			node.classList.toggle('selected');
			refreshNodeEditingButtons();
		}
	});




	// ===Switch tabs between manual and automatic input creation===
	document.getElementById('inputButton').addEventListener('click', function(){
		changeInputTabs('goButton', 'inputButton');
	});


	// ===AUTO INPUT GEN ===
	// show and display addClitics options
	document.getElementById('add-clitics').addEventListener('change', showHideSTreeCliticOptions);

	var autoInputOptions = document.getElementsByName("autoInputOptions");
    // Locate noBarLevels option
    window.noBarLevelsIndex;
    for (var i = 0; i < autoInputOptions.length; i++) {
        if (autoInputOptions[i].value === "noBarLevels") {
            noBarLevelsIndex = i;
            break;
        }
    }
	document.getElementsByName("autoInputOptions")[noBarLevelsIndex].addEventListener('click', barLevelsHeadReq);
	document.getElementsByName('autoInputOptions-recursiveCategory')[2].addEventListener('click', displaySettingsRecursiveX0);
	document.getElementsByName('autoInputOptions-recursiveCategory')[0].addEventListener('click', displaySettingsRecursiveCP);
	document.getElementsByName('autoInputOptions-recursiveCategory')[1].addEventListener('click', displaySettingsRecursiveXP);

	// "Generate trees" done button for auto input Gen
	document.getElementById('autoGenDoneButton').addEventListener('click', makeAndDisplaySTrees);


	// Button to add a terminal string for automatic stree generation
	document.getElementById('addString').addEventListener('click', addTerminalString);
	
	// Show/hide generated syntactic trees
	document.getElementById('syntax-tree-switch').addEventListener('click', showHideGeneratedSTrees);

	/** Check for any changes that should remove the message "The trees in the analysis 
	 * are up-to-date" from the input Gen display:
	 * - syntax parameters
	 * - terminal strings
	 * - list of terminals
	* */ 
	function hideDoneMessage(){
		document.getElementById('autoDoneMessage').style.display = 'none';
	}
	document.getElementById('syntax-parameters').addEventListener('change', hideDoneMessage);
	document.getElementById('syntax-parameters-clitics').addEventListener('change', hideDoneMessage);
	document.getElementById('syntax-parameters-phonology').addEventListener('change', hideDoneMessage);
	document.getElementById('terminalStrings').addEventListener('change', hideDoneMessage);
	document.getElementById('listOfTerminals').addEventListener('change', hideDoneMessage);

	
	

	// ===GENERATE TERMINAL STRINGS===
	// Button to add list of terminals 
	document.getElementById('addList').addEventListener('click', addTerminalStringList);

	// Show/hide generated terminal strings
	document.getElementById('gen-strings-switch').addEventListener('click', showHideGeneratedTermStrings);

	// Button to generate terminal strings
	document.getElementById('genStringsDoneButton').addEventListener('click', makeAndDisplayTerminalStrings);


});/** 
 * Functions for handling sending the user's inputs on interface1.html to makeTableau() and for downloading it.
 *  saveAs()
 *  getCheckedConstraints()
 *  getInputsForTableau()
 *  getOutputGenOptions()
 *  getTableauOptions(genOptions)
 *  checkForLongInputs(genOptions)
 *  sendToTableau(e)
 */

var myGenInputs = {
    pString: '',
    sTrees: {}
};

//downloads an element to the user's computer. Originally defined up by saveTextAs()
function saveAs(blob, name) {
	var a = document.createElement("a");
	a.display = "none";
	a.href = URL.createObjectURL(blob);
	a.download = name;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

// Helper for sendToTableau(): builds a list of checked constraints and their info
function getCheckedConstraints(){
    var constraintSet = [];
    for(var i=0; i<spotForm.constraints.length; i++){
        var constraintBox = spotForm.constraints[i];
        if(constraintBox.checked){
            var constraint = constraintBox.value;
            //Figure out all the categories selected for the constraint
            if(spotForm['category-'+constraint]){
                var constraintCatSet = spotForm['category-'+constraint];
                if (constraintCatSet.length === undefined) {
                    constraintCatSet = [constraintCatSet];
                }
                for(var j=0; j<constraintCatSet.length; j++){
                    var categoryBox = constraintCatSet[j];
                    if(categoryBox.checked){
                        var category = categoryBox.value;
                        if(constraint === "alignLeftMorpheme" || constraint === 'alignRightMorpheme') {
                            category = category.split(' ').join(';');
                        }
                        if(constraint === "binMaxHead") {
                            constraintSet.push('binMaxHead-' + category + '-{"side" : "' + spotForm['genOptions-showHeads'].value + '"}')
                        }
                        //Figure out selected match options for the constraint
                        else if(spotForm['option-'+constraint]){
                            var constraintOptionSet = spotForm['option-'+constraint];
                            var options = {};
                            if(constraintOptionSet.length){
                                for(var k=0; k<constraintOptionSet.length; k++){
                                    var optionBox = constraintOptionSet[k];
                                    //If lexical or overtly headed is checked, then option is true
                                    if(optionBox.checked) {
                                        options[optionBox.value] = true;
                                    }
                                    //If option is in a select, not a checkbox, and the option is not "any", then option is true
                                    if(optionBox.checked === undefined && optionBox.value !== 'any') {
                                        options[optionBox.value] = true;
                                    }
                                }
                            }
                            else{ //constraint only has one possible option:
                                if(constraintOptionSet.checked){
                                    options[constraintOptionSet.value] = true;
                                }
                            }
                            var strOptions = JSON.stringify(options);
                            constraintSet.push(constraint+'-'+category+'-'+strOptions);
                        }
                        else {
                            constraintSet.push(constraint+'-'+category);
                        }
                    }
                }
            }
            else
                constraintSet.push(constraint);
        }
    }
    return constraintSet;
}

// Helper for sendToTableau: gets the syntactic trees
function getInputsForTableau(){
    myGenInputs.pString = spotForm.inputToGen.value;
    var treeCode = spotForm.sTree.value; // Get the code that is in the manually generated stree textarea
    // if code has been generated, then ignore pString in GEN
    if(treeCode !== "{}") {
        myGenInputs.pString = "";
    }
    var sTrees;
    var treeSelectMenu = document.getElementById('treeEditOption'); // options selecting input from manual, automatic tab or both tabs
    var treeSelectOptions = treeSelectMenu.value; // getting the value of the option the user has selected
    var manInputsPres = (spotForm.inputToGen.value != "" || (treeCode != "{}" && treeCode != "[]")); //manual tab input present boolean
    var autoInputsPres = getAutoSTreeList(); //automatic tab input present boolean

   // determine if both generate tree and build syntax has input
    if (manInputsPres && autoInputsPres && document.getElementById('treeOption').style.display != "block" && treeSelectOptions == "default-tree"){
        document.getElementById('treeOption').style.display = "block";
        displayWarning('Inputs were provided on both the Manual tab and the Automatic tab of Gen: Inputs. Please select an option from the dropdown menu displayed above "Get results" button to choose which set of trees to use in the tableaux.');
        return;
    }
    
    //if the dropdown menu is shown and option is default-tree
    if (treeSelectOptions == "default-tree" && document.getElementById('treeOption').style.display == "block"){
        return;
    }else if(treeSelectOptions == "auto-tree" || (!manInputsPres && autoInputsPres)){ //If auto-tree is chosen, display this
        myGenInputs.pString = "";
        if (autoInputsPres){
            //Try to actually get the auto-generated sTrees.
            try{
                sTrees = getAutoSTreeList();
            }
            catch(e){
                displayError(e.message, e);
                return;
            }
        }else{
            return;
        }
    }else if(treeSelectOptions == "manual-tree" || (manInputsPres && !autoInputsPres)){   //Otherwise, if manual-tree is chosen, display this  
        // Get the input syntactic trees from manual tree builder
        if (manInputsPres){
            try{
                sTrees = getSTrees();
            }
            catch(e){
                displayError(e.message, e);
                return;
            }
        }else{
            return;
        }
    }else if(treeSelectOptions == "both-tree"){ // if both trees are selected
        if (autoInputsPres && manInputsPres){
            try{
                if (getAutoSTreeList() && getSTrees()){
                    sTrees = getSTrees();
                    myGenInputs.pString = "";
                    sTrees = sTrees.concat(getAutoSTreeList());
                }else if(getAutoSTreeList()){
                    myGenInputs.pString = "";
                    sTrees = getAutoSTreeList();
                }else{
                    sTrees = getSTrees();
                }
            }
            catch(e){
                displayError(e.message, e);
                return;
            }
        }else{
            return;
        }
    }else if(treeSelectOptions == "clear-tree"){
        treeSelectMenu = treeSelectMenu.selectedIndex = 0;
        document.getElementById('treeOption').style.display = "none";
        clearAll();
        sTreeList = undefined;
        return;
    }

    return sTrees;
}

function getOutputGenOptions() {
    var genOptions = {};

    //hard-code in the default prosodic hierarchy and category pairings
    genOptions.ph = PH_PHI;

    for(var i=0; i<spotForm.genOptions.length; i++){
        var optionBox = spotForm.genOptions[i];
        genOptions[optionBox.value]=optionBox.checked;
    }

    //record exhaustivity options if selected
    if(genOptions['obeysExhaustivity']){
        var exCats = [];
        for(var i=0; i<spotForm.exhaustivityCats.length; i++){
            var exCatBox = spotForm.exhaustivityCats[i];
            if(exCatBox.checked)
                exCats = exCats.concat(exCatBox.value);
        }
        genOptions['obeysExhaustivity'] = exCats;
    }

    // if max branching option is selected
    if(genOptions['maxBranching']){
        genOptions['maxBranching'] = spotForm.maxBranchingValue.value;
    }

    //plug correct value into category options
    genOptions.rootCategory = spotForm['genOptions-rootCategory'].value;
    genOptions.recursiveCategory = spotForm['genOptions-recursiveCategory'].value;
    genOptions.terminalCategory = spotForm['genOptions-terminalCategory'].value;

    //warn user if they do something weird with the category options
    var rootCategoryError = new Error("The specified root category is lower on the prosodic hierarchy\nthan the specified recursive category.");
    var terminalCategoryError = new Error("The specified recursive category is not higher on the prosodic hierarchy\nthan the specified terminal category.");
    if(pCat.isHigher(genOptions.recursiveCategory, genOptions.rootCategory)){
        if(!confirm(rootCategoryError.message + " Are you sure you want to continue?\nIf you are confused, change Root Category and Recursive Category\nin \"Options for prosodic tree generation (GEN function)\"")){
            throw rootCategoryError;
        }
    }
    if(!pCat.isHigher(genOptions.recursiveCategory, genOptions.terminalCategory)){
        if(!confirm(terminalCategoryError.message + " Are you sure you want to continue?\nIf you are confused, change Terminal Category and Recursive Category\nin \"Options for prosodic tree generation (GEN function)\"")){
            throw terminalCategoryError;
        }
    }

    return genOptions;
}

function getTableauOptions(genOptions){
    var tableauOptions = {
        showTones: false,  //true iff tones are selected
        trimStree: false,
        invisibleCategories: []
    };

    if(document.getElementById("annotatedWithTones").checked){
        //from radio group near the bottom of spotForm
        genOptions.addTones = spotForm.toneOptions.value;
         tableauOptions.showTones = spotForm.toneOptions.value;
        //console.log(genOptions);
    }
    if(document.getElementById("trimTrees").checked){
        tableauOptions.trimStree = true;
    }
    if(document.getElementById("showHeads").checked){
        tableauOptions.showHeads = window.spotForm['genOptions-showHeads'].value;
    }


    for(var i = 0; i < window.spotForm.hideCategory.length; i++){
        var hiddenCat = window.spotForm.hideCategory[i];
        if(hiddenCat.checked){
            tableauOptions.invisibleCategories.push(hiddenCat.value);
        }
    }

    return tableauOptions;
}

function checkForLongInputs(genOptions){
    var safe_input_length = true;
    var safe_input_length_clitic = true;
    var sTree;
    var maxNumTerminals;
    var j = 0;
    while(safe_input_length && safe_input_length_clitic && j < myGenInputs.sTrees.length){
    //check for inputs that are too long and set safe_input_length = false as needed
        sTree = myGenInputs.sTrees[j];
        maxNumTerminals = Math.max(getLeaves(sTree).length, myGenInputs.pString.split(" ").length);
        //warn user about possibly excessive numbers of candidates
        if (genOptions['cliticMovement'])
        {
            if((maxNumTerminals >= 7) || (!genOptions['noUnary'] && maxNumTerminals >= 5))
            {
                safe_input_length_clitic = false;
            }
        }else if(maxNumTerminals >= 9 || (maxNumTerminals >= 6 && !genOptions['noUnary'])){
            safe_input_length = false;
        }
        j++;
    }
    if(!safe_input_length){
    //display warning and get confirmation
        if(!confirm("You have one or more input with more than five terminals, which may run slowly and even freeze your browser, depending on the selected GEN options. Do you wish to continue?")){
            throw new Error("Tried to run GEN with too many terminals");
        }
    }else if (!safe_input_length_clitic){
        var tooManyCandMsg = "You have selected GEN settings that allow movement, and included a sentence of "+ maxNumTerminals.toString()+" terminals. This GEN may yield more than 10K candidates. To reduce the number of candidates, consider enforcing non-recursivity, exhaustivity, and/or branchingness for intermediate prosodic nodes. Do you wish to proceed with these settings?";
        var continueGEN = confirm(tooManyCandMsg);
        if(!continueGEN){
            throw new Error("Tried to run GEN with clitic movement with too many terminals");
        }
    }
}

/**
 * This function runs when the "Get results" button is clicked.
 * 
 * Components:
 * - Build list of checked constraints and their options and arguments
 * - Get selected output GEN options
 * - Get inputs (manual or from input GEN)
 * - Send everything to makeTableau(), writeTableau(), and saveTextAs() 
 */
function sendToTableau(e) {
    if (e.preventDefault) e.preventDefault();
    var constraintSet = getCheckedConstraints();
    myGenInputs.sTrees = getInputsForTableau();
    if (myGenInputs.sTrees == undefined){
        return false;
    }
    var genOptions = getOutputGenOptions();
    checkForLongInputs(genOptions);

    var tableauOptions = getTableauOptions(genOptions);

    //If the tree is rooted in a word, the recursive category is the foot, and the terminal category is the syllable, then
    //the function makeTableau() will be called with the option "subword" which will change bracketing notation for parenthesizeTree().
    if (genOptions.rootCategory === "w" && genOptions.recursiveCategory === "Ft" && genOptions.terminalCategory === "syll") {
        tableauOptions.subword = true;
    }

    var resultsConCl = document.getElementById("results-container").classList;
    resultsConCl.add('show-tableau');

    var csvSegs = [];
    for (var i = 0; i < myGenInputs.sTrees.length; i++) {
        var sTree = myGenInputs.sTrees[i];

        //Actually create the candidate set
        if (genOptions['cliticMovement']){
        //	var candidateSet = GENwithCliticMovement(sTree, pString, genOptions);
            var candidateSet = globalNameOrDirect(spotForm['genOptions-movement'].value)(sTree, myGenInputs.pString, genOptions);
        }
        else{
            var candidateSet = GEN(sTree, myGenInputs.pString, genOptions);
        }

        //Make the violation tableau with the info we just got.
        var tabl = makeTableau(candidateSet, constraintSet, tableauOptions);
        csvSegs.push(tableauToCsv(tabl, ',', {noHeader: i}));
        writeTableau(tabl);
        revealNextSegment();
    }

    saveTextAs(csvSegs.join('\n'), 'SPOT_Results.csv');

    function saveTextAs(text, name) {
        saveAs(new Blob([text], {type: "text/csv", encoding: 'utf-8'}), name);
    }

    return false;
};var uTreeCounter = 0;
var treeUIsTreeMap = {};

function UTree(root) {

	var self = this;
	this.root = root;
	this.treeIndex = uTreeCounter++;
	treeUIsTreeMap[this.treeIndex] = this;

	this.nodeNum = 0;
	this.nodeMap = {};
	this.addMeta = function(node, parent) {
		node.m = {nodeId: this.nodeNum++, parent: parent, treeIndex: this.treeIndex};
		this.nodeMap[node.m.nodeId] = node;
		if (node.children) {
			for (var i = 0; i < node.children.length; i++) {
				this.addMeta(node.children[i], node);
			}
		}
	};
	this.addMeta(this.root);
	this.root.m.isRoot = true;

	function assignDims(node) {
		var height = 0, width = 0;
		if (node.children && node.children.length) {
			for (var i = 0; i < node.children.length; i++) {
				var childResult = assignDims(node.children[i]);
				width += childResult.width; // width in number of cells
				height = Math.max(childResult.height, height); //height counts how many levels up from the terminals this node is
			}
			height += 1; // for this node
		} else {
			width = 1;
		}
		node.m.height = height;
		node.m.width = width;
		return node.m;
	}

	this.toTable = function() {
		assignDims(this.root);
		var table = [];
		for (var i = 0; i <= this.root.m.height; i++) {
			table.push([]);
		}
		function processNode(node, parentHeight) {
			var height = node.m.height;
			table[height].push({node: node, width: node.m.width, hasStem: parentHeight > height, stemOnly: false});
			for (var h = height+1; h < parentHeight; h++) {
				table[h].push({width: node.m.width, stemOnly: true});
			}
			if (node.children && node.children.length) {
				for (var i = 0; i < node.children.length; i++) {
					processNode(node.children[i], height);
				}
			}
		}
		processNode(this.root, this.root.height);
		return table;
	};

	function makeElementId(elType, node) {
		return [elType, node.m.nodeId, self.treeIndex].join('-');
	}

	function toInnerHtmlFrags(frags) {
		if (!frags) frags = [];
		var table = self.toTable();
		for (var h = table.length-1; h >= 0; h--) {
			var rowFrags = [];
			var row = table[h];
			for (var i = 0; i < row.length; i++) {
				var block = row[i], node = block.node;
				var pxWidth = block.width*80; // should be an even number of pixels
				var stemLeftWidth = pxWidth/2 - 2, stemRightWidth = pxWidth/2;
				var stem = '<div class="inline-block stemSide" style="width: ' + stemLeftWidth + 'px; border-right: 2px black solid"></div><div class="inline-block stemSide" style="width: ' + stemRightWidth + 'px"></div>';
				if (block.stemOnly) {
					rowFrags.push(stem);
				} else {
					var stemContainer = '';
					if (block.hasStem) {
						stemContainer = '<div class="stemContainer">' + stem + '</div>';
					}
					var nodeClasses = 'treeNode';
					if (node.m.isRoot) {
						nodeClasses += ' rootNode';
					}
					var catInputId = makeElementId('catInput', node), idInputId = makeElementId('idInput', node);
					var inputSuffixId = "";
			 		if (node.silentHead == true){ //silentHead = true
						inputSuffixId += ", silentHead";
					}
					if (node.func == true){ //func = true
						inputSuffixId += ", func";
					}
					if (node.foc == true){ //foc = true
						inputSuffixId += ", foc";
					}
					rowFrags.push('<div id="treeNode-' + node.m.nodeId + '-' + node.m.treeIndex + '" class="' + nodeClasses + '" style="width: ' + pxWidth + 'px">' + stemContainer + '<div class="inputContainer"><input id="' + catInputId + '" class="catInput" type="text" value="' + node.cat + inputSuffixId + '"></input></div><div class="inputContainer"><input id="' + idInputId + '" class="idInput" type="text" value="' + node.id + '"></input></div></div>');
				}
			}
			frags.push('<div>');
			frags.push(rowFrags.join(''));
			frags.push('</div>');
		}
		return frags;
	};

	this.toInnerHtml = function() {
		return toInnerHtmlFrags().join('');
	}

	this.toHtml = function() {
		var frags = ['<div class="treeUI-tree" id="treeUI-' + self.treeIndex + '">'];
		toInnerHtmlFrags(frags);
		frags.push('</div>');
		return frags.join('');
	}

	this.refreshHtml = function() {
		document.getElementById('treeUI-'+self.treeIndex).innerHTML = self.toInnerHtml();
	}

	this.toJSON = function() {
		return JSON.stringify(this.root, function(k, v) {
			if (k !== 'm') return v;
		}, 4);
	};

	this.addParent = function(nodes) {
		var indices = [], parent = nodes[0].m.parent;
		if (!parent) {
			throw new Error('Cannot add a mother to the root node');
		}
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (node.m.parent !== parent) throw new Error('Nodes must have same the mother.');
			if (parent) {
				indices.push(parent.children.indexOf(node));
			}
		}
		indices.sort();
		if (indices && indices[0] < 0) throw new Error('Mother node not found.');
		for (var i = 1; i < indices.length; i++) {
			if (indices[i] !== indices[i-1]+1) throw new Error('Nodes must be adjacent sisters.');
		}

		// create new node, connect it to parent
		var newNode = {cat: 'xp'};
		this.addMeta(newNode, parent);
		newNode.id = 'XP_' + newNode.m.nodeId; // this does not guarantee uniqueness, but probably close enough for now

		// connect new node to children
		var firstChildIndex = indices[0], lastChildIndex = indices[indices.length-1];
		newNode.children = parent.children.slice(firstChildIndex, lastChildIndex+1);

		// connect children to new node
		for (var i = 0; i < newNode.children.length; i++) {
			newNode.children[i].m.parent = newNode;
		}

		// connect parent to new node
		parent.children = parent.children.slice(0, firstChildIndex).concat([newNode], parent.children.slice(lastChildIndex+1));
	};

	this.deleteNode = function(node) {
		// connect children to parent
		var parent = node.m.parent, children = node.children || [];
		for (var i = 0; i < children.length; i++) {
			children[i].m.parent = parent;
		}

		// connect parent to children
		if (node.m.parent) {
			var index = node.m.parent.children.indexOf(node);
			node.m.parent.children = node.m.parent.children.slice(0, index).concat(children, node.m.parent.children.slice(index+1));

			// remove from node map
			delete this.nodeMap[node.m.nodeId];
		} else { // delete UTree and associated element if root
			delete treeUIsTreeMap[node.m.treeIndex];
			var elem = document.getElementById('treeUI-' + this.treeIndex);
			elem.parentNode.removeChild(elem);
		}
	};
}

// For testing only
/*
new UTree({
	id: "CP1",
	cat: "cp",
	children: [
		{id: "a", cat: "x0"},
		{id: "n", cat: "n", children: [
			{id: "b", cat: "x0"},
			{id: "c", cat: "x0"},
		]},
		{id: "d", cat: "x0"}
	]
});
refreshHtmlTree();
document.getElementById('treeUIinner').style.display = 'block';
*/

function parseCats(node){
	var cats = node['cat'].split(',');
	if (cats.length > 1){
		node['cat'] = cats[0];
	}
	// add the rest of the list as attributes
	for (var cat of cats.slice(1)){
		// remove non-alphanumeric characters, underscores
		// replace capital letters with lowercase
		att = cat.trim().replace(/\W/g, '');
		if (att === ""){
			continue;
		}
		//console.log(att)
		node[att] = true;
		/*
		if (cat.indexOf('silentHead') != -1){
			node['silentHead'] = true;
		}
		if (cat.indexOf('func') != -1){
			node['func'] = true;
		}
		if (cat.indexOf('foc') != -1){
			node['foc'] = true;
		}*/

	}
	var children = node['children'];
	if (children != undefined){
		for (var child of children){
			parseCats(child);
		}
	}
}

function htmlToJSONTree(){
	sTree = JSON.stringify(Object.values(treeUIsTreeMap).map(function(tree) {

		// console.log(JSON.parse(tree.toJSON()));
		// console.log(JSON.parse(tree.toJSON())['cat']);
		var checkTree = JSON.parse(tree.toJSON());
		parseCats(checkTree);
		return (checkTree); // bit of a hack to get around replacer not being called recursively
	}), null, 4);

	if(sTree.includes('-')) {
		displayError('Your trees were not added to the analysis because there are hyphens in category or id names in the tree builder. Please refer to the instructions in the tree builder info section.');
		var info = document.getElementById('treeBuilderInfo');
		info.classList.add('showing');
	}
	else {
		spotForm.sTree.value = sTree
		document.getElementById('doneMessage').style.display = 'inline-block';
	}

	spotForm.inputToGen.value = "";
}

UTree.fromTerminals = function(terminalList) {
	var dedupedTerminals = deduplicateTerminals(terminalList);
	var cliticRegex = /-clitic/; //for testing if terminal should be a clitic

	//Make the js tree (a dummy tree only containing the root CP)
	var root = {
		"id":"CP1",
		"cat":"cp",
		"children":[]
	};
	//Add the provided terminals
	for(var i=0; i<dedupedTerminals.length; i++){
		//if terminal should be a clitic
		if(cliticRegex.test(dedupedTerminals[i])){
			//push a clitic to root.children
			root.children.push({
				"id":dedupedTerminals[i].replace('-clitic', ''),
				"cat":"clitic"
			});
		}
		//non-clitic terminals
		else {
			root.children.push({
				"id":dedupedTerminals[i],
				"cat":"x0"
			});
		}
	}
	return new UTree(root);
};

function showUTree(tree){
	treeTableContainer.innerHTML += tree.toHtml();
	refreshNodeEditingButtons();

	document.getElementById('treeUIinner').style.display = 'block';

	var treeContainer = document.getElementById("treeTableContainer");
	treeContainer.scrollTop = treeContainer.scrollHeight;

}

function clearUTrees(){
	treeTableContainer.innerHTML = '';
	treeUIsTreeMap = {};
}

function addOrRemoveUTrees(addTree){
	if(addTree){
		treeTableContainer.innerHTML += addTree.toHtml();
	}
	else{
		clearUTrees();
	}
	refreshNodeEditingButtons();

	document.getElementById('treeUIinner').style.display = 'block';

	var treeContainer = document.getElementById("treeTableContainer");
	treeContainer.scrollTop = treeContainer.scrollHeight;
}

function elementToNode(el) {
	var idFrags = el.id.split('-');
	if (idFrags[0] !== 'treeNode') return null;
	var nodeId = idFrags[1];
	return treeUIsTreeMap[idFrags[2]].nodeMap[nodeId];
}

function getSelectedNodes() {
	var elements = treeTableContainer.getElementsByClassName('selected');
	var nodes = [];
	for (var i = 0; i < elements.length; i++) {
		var node = elementToNode(elements[i]);
		if (node) {
			nodes.push(node);
		}
	}
	return nodes;
}

function treeUIMakeParent() {
	var nodes = getSelectedNodes();
	try {
		treeUIsTreeMap[nodes[0].m.treeIndex].addParent(nodes);
		refreshHtmlTree();
	} catch (err) {
		displayError('Unable to add daughter: ' + err.message, err);
	}
	document.getElementById('doneMessage').style.display = 'none';
}

function deleteTreeUINodes() {
	var nodes = getSelectedNodes();
	if (nodes) {
		var treeIndex = nodes[0].m.treeIndex;
		for (var i = 1; i < nodes.length; i++) {;
			if(nodes[i].m.treeIndex != treeIndex) {
				displayError('You attempted to delete nodes from multiple trees. Please delete nodes one tree at a time.');
				return;
			}
		}
	}
	var tree = treeUIsTreeMap[treeIndex];
	for (var i = 0; i < nodes.length; i++) {
		tree.deleteNode(nodes[i]);
	}
	refreshHtmlTree(treeIndex);
	document.getElementById('doneMessage').style.display = 'none';
}

function treeUIClearSelection() {
	var elements = treeTableContainer.getElementsByClassName('selected');
	for (var i = elements.length-1; i >= 0; i--) {
		elements[i].classList.remove('selected');
	}
	refreshNodeEditingButtons();
}

function refreshNodeEditingButtons() {
	var treeTableContainer = document.getElementById('treeTableContainer');
	var hasSelection = treeTableContainer.getElementsByClassName('selected').length > 0;
	var buttons = document.getElementsByClassName('nodeEditingButton');
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].disabled = !hasSelection;
	}
}

function refreshHtmlTree(treeIndex) {
	if (treeIndex === undefined) {
		for (index of Object.keys(treeUIsTreeMap)) {
			refreshHtmlTree(index);
		}
		return;
	}

	if (treeIndex in treeUIsTreeMap) {
		treeUIsTreeMap[treeIndex].refreshHtml();
	}
	refreshNodeEditingButtons();
}

function setUpTreeBuilderTable(){
	// Get the string of terminals
	var terminalString = spotForm.inputToGen.value;
	var terminalList = terminalString.trim().split(/\s+/);

	//Make the js tree (a dummy tree only containing the root CP)
	var tree = UTree.fromTerminals(terminalList);
	showUTree(tree);
	document.getElementById('doneMessage').style.display = 'none';
}

//Shows or hides the tree code area when the toggle is switched
function showHideTreeCode(){
	if (document.getElementById('tree-code-area').style.display === 'none' && document.getElementById('tree-code-box').checked){
		document.getElementById('tree-code-area').style.display = 'block';
		document.getElementById('sliderText').innerHTML = 'Hide code';
	}
	else{
		document.getElementById('tree-code-area').style.display = 'none';
		document.getElementById('sliderText').innerHTML = 'Show code';
	}
}

//Get syntactic trees from manual tree builder's code area
function getSTrees() {
	var spotForm = document.getElementById('spotForm');
	var sTrees;
	sTrees = JSON.parse(spotForm.sTree.value);
	if (!(sTrees instanceof Array)) {
		sTrees = [sTrees];
	}
	return sTrees;
}


/** 
 * Functions for generating all maximally binary-branching trees with two or three terminals
 * as used in Bellik & Kalivoda 2018 on Danish compound words
 * LEGACY CODE
 */
function danishTrees() {
	var patterns = [
		[[{}],[{}]],
		[[{}],[{},{}]],
		[[{},{}],[{}]],
		[[{},{}],[{},{}]],
		[[{}],[[{}],[{}]]],
		[[{}],[[{}],[{},{}]]],
		[[{}],[[{},{}],[{}]]],
		[[{},{}],[[{}],[{}]]],
		[[{}],[[{},{}],[{},{}]]],
		[[{},{}],[[{}],[{},{}]]],
		[[{},{}],[[{},{}],[{}]]],
		[[{},{}],[[{},{}],[{},{}]]],
		[[[{}],[{}]],[{}]],
		[[[{}],[{}]],[{},{}]],
		[[[{}],[{},{}]],[{}]],
		[[[{},{}],[{}]],[{}]],
		[[[{}],[{},{}]],[{},{}]],
		[[[{},{}],[{}]],[{},{}]],
		[[[{},{}],[{},{}]],[{}]],
		[[[{},{}],[{},{}]],[{},{}]]
	];

	function patternToJS(pattern) {
		var xpid = 1, x0id = 1;
		function patternPartToJS(pattern) {
			var node = {};
			if (pattern instanceof Array) {
				node.id = "XP" + xpid++;
				node.cat = "xp";
				node.children = [];
				for (var i = 0; i < pattern.length; i++) {
					node.children.push(patternPartToJS(pattern[i]));
				}
			} else {
				node.id = "f_" + x0id++;
				node.cat = "x0";
			}
			return node;
		}
		return patternPartToJS(pattern);
	}

	var sTrees = [];

	for (var i = 0; i < patterns.length; i++) {
		sTrees.push(patternToJS(patterns[i]));
	}

	return sTrees;
}if (!Element.prototype.matches)
		Element.prototype.matches = Element.prototype.msMatchesSelector || 
																Element.prototype.webkitMatchesSelector;

if (!Element.prototype.closest)
		Element.prototype.closest = function(s) {
				var el = this;
				if (!document.documentElement.contains(el)) return null;
				do {
						if (el.matches(s)) return el;
						el = el.parentElement;
				} while (el !== null); 
				return null;
		};
var lastSegmentId = 0, nextSegmentToReveal = 0;
//logreport functions have been moved to main/logreport.js
var resultsContainer;

function writeTableau(tableauContent) {
    if (resultsContainer) {
        var tableauContainer = document.createElement('div');

        tableauContainer.innerHTML =  '<h2 style="margin-bottom: 5px">Tableau</h2>';	

        var textareaNote = document.createElement('strong');
        textareaNote.innerHTML = 'For copying and pasting into OTWorkplace: ';
        tableauContainer.appendChild(textareaNote);

        var textarea = document.createElement('textarea');
        textarea.className = 'tableau-textarea';
        textarea.value = tableauToCsv(tableauContent, '\t');
        textarea.readOnly = true;
        tableauContainer.appendChild(textarea);
		tableauContainer.appendChild(document.createElement('p'));
        tableauContainer.className += ' segment-' + lastSegmentId;
        if (lastSegmentId >= nextSegmentToReveal)
            tableauContainer.className += ' segment-hidden';
        onRevealSegment[lastSegmentId] = function() {
            textarea.focus();
            textarea.select();
        }

        var htmlTableauContainer = document.createElement('div');
        htmlTableauContainer.innerHTML = tableauToHtml(tableauContent);
        tableauContainer.appendChild(htmlTableauContainer);	

        resultsContainer.appendChild(tableauContainer);

    } else {
        console.error('Tried to write tableau before window loaded.');
    }
}

window.addEventListener('load', function(){
    resultsContainer = document.getElementById('results-container');
    if(typeof runDemo === 'function')
        runDemo();
});


var onRevealSegment = {};

function revealNextSegment() {
    if (nextSegmentToReveal > lastSegmentId)
        return;
    var elements = document.getElementsByClassName('segment-' + nextSegmentToReveal);
    for (var i = 0; i < elements.length; i++)
        elements[i].className = elements[i].className.replace('segment-hidden', '');

    if (onRevealSegment[nextSegmentToReveal])
        onRevealSegment[nextSegmentToReveal]();

    // window.scrollTo(0, document.body.scrollHeight); //TODO: scroll to top of last segment, not bottom

    nextSegmentToReveal++;
}

document.addEventListener('keyup', function(event) {
    if (event.keyCode === 32)
        revealNextSegment();
});


//Given a string that is the name of a (global) object, returns the object itself.
//Given an object, returns that object.
function globalNameOrDirect(nameOrObject) {
    if (!window.disableGlobalNameOrDirect && typeof nameOrObject === 'string') {
		if (!window.hasOwnProperty(nameOrObject)) {
			console.error('globalNameOrDirect error: ' + nameOrObject + ' is not defined in the global namespace')
		}
    	return window[nameOrObject];
    } else {
		return nameOrObject;
	}
}

function runConstraint(constraint, sname, pname, cat, expectedViolations) {
    var pTree = globalNameOrDirect(pname);
    logreport(['<span class="main-report-line">Running ', constraint, '(', (cat || ''), ') on (', sname, ', ', parenthesizeTree(pTree), ')', (expectedViolations == null) ? '' : [' - Expected Violations: <span class="expected-violation-count">', expectedViolations, '</span>'].join(''), '</span>'].join(''));
    var violationCount = globalNameOrDirect(constraint)(globalNameOrDirect(sname), pTree, cat);
    logreport(['<span class="main-report-line" style="background-color: white">Actual Violations: <span class="actual-violation-count">', violationCount, '</span></span><br/><br/>'].join(''));
    return violationCount;
}
if(typeof window === "undefined"){
  window = {};
}

(function() {

  window.GEN_impl = function(sTree, leaves, options) {
    var recursiveOptions = {};
    for (var k in options) {
      if (options.hasOwnProperty(k) && k !== 'requireRecWrapper')
        recursiveOptions[k] = options[k];
    }

    /* if rootCategory and recursiveCategory are the same, we don't want to call
     * addRecCatWrapped becasue half of the candidates will have a root node with
     * only one child, which will be of the same category, ie. {i {i (...) (...)}}
     */
    var rootlessCand = gen(leaves, recursiveOptions)
    if (options.rootCategory !== options.recursiveCategory) {
      rootlessCand = addRecCatWrapped(gen(leaves, recursiveOptions), options);
    }

    var candidates = [];
    for (var i = 0; i < rootlessCand.length; i++) {
      var pRoot = wrapInRootCat(rootlessCand[i], options);
      if (!pRoot)
        continue;
      if (options.obeysHeadedness && !obeysHeadedness(pRoot))
        continue;
      if (options.maxBranching && ternaryNodes(pRoot, options.maxBranching)) {
				continue;
			}
      candidates.push([sTree, pRoot]);
    }
	// add getter functions that returns the category pairinig and pCat so make tableau can access them
	candidates.getCategoryPairings = function(){return options.ph.categoryPairings};
	candidates.getPCat = function(){return options.ph.pCat};
  return candidates;
  }

  /* Function to check if a tree obeys headedness. Each node must either be be
   * terminal or have at least one child of the category immidately below its own
   * on the prosodic hierarch. Otherwise, return false. Written as a recursive
   * function, basically a constraint.
   */
  function obeysHeadedness(tree) {
    //inner function
    function nodeIsHeaded(node) {
      /* Function to check if a node is headed. Relies on the prosodic hierarchy being
       * properly defined. Returns true iff
       * a. one of the node's children is of the category directly below its own category *    on the prosodic hierarchy,
       * b. one of the node's descendants is of the same category as the node
       * c. the node is terminal.
       */
      var children = node.children;
      //vacuously true if node is terminal
      if (!children)
        return true;
      for (var i = 0; i < children.length; i++)
        if (children[i].cat === pCat.nextLower(node.cat) ||
          children[i].cat === node.cat) {
          return true;
        }
      return false;
    }

    //outer function
    //first, check the parent node
    if (!nodeIsHeaded(tree))
      return false;
    //return false if one of the children does not obey headedness
    if (tree.children) {
      for (var x = 0; x < tree.children.length; x++) {
        if (!obeysHeadedness(tree.children[x])) //recursive function call
          return false;
      }
    }
    //if we get this far, the tree obeys headedness
    return true;
  }

  function obeysExhaustivity(cat, children) {
    for (var i = 0; i < children.length; i++)
      if (cat !== children[i].cat && pCat.nextLower(cat) !== children[i].cat) {
        return false;
      }
    return true;
  }

  function wrapInRootCat(candidate, options) {
    if (options && options.obeysExhaustivity) { // check that options.obeysExhaustivity is defined
      if (typeof options.obeysExhaustivity === "boolean" && options.obeysExhaustivity && !obeysExhaustivity(options.rootCategory, candidate)) {
        return null;
      } else if (options.obeysExhaustivity instanceof Array && options.obeysExhaustivity.indexOf(options.rootCategory) >= 0 && !obeysExhaustivity(options.rootCategory, candidate)) {
        return null;
      }
    }

    if (candidate.length < 2 && options.rootCategory === candidate[0].cat) {
      //console.log(candidate, options.rootCategory);
      return null;
    }
    //if we get here, there aren't any relevant exhaustivity violations
    return {
      id: 'root',
      cat: options.rootCategory,
      children: candidate
    };
  }

  /*Conceptually, returns all possible parenthesizations of leaves that don't
   *	have a set of parentheses enclosing all of the leaves
   * Format: returns an array of parenthesizations, where each parenthesization
   *	is an array of children, where each child is
   *	either a phi node (with descendant nodes attached) or a leaf
   */
  function gen(leaves, options) {
    var candidates = []; //each candidate will be an array of siblings
    try {
      if (!(leaves instanceof Array))
        throw new Error(leaves + " is not a list of leaves.");
    }
    catch(err) {
      displayError(err.message, err);
    }

    //Base case: 0 leaves
    if (leaves.length === 0) {
      candidates.push([]);
      return candidates;
    }

    //Recursive case: at least 1 word. Consider all candidates where the first i words are grouped together
    for (var i = 1; i <= leaves.length; i++) {

      var rightsides = addRecCatWrapped(gen(leaves.slice(i, leaves.length), options), options);

      //Case 1: the first i leaves attach directly to parent (no phi wrapping)

      var leftside = leaves.slice(0, i);

      // for case 1, we don't need to check the left side for nonrecursivity, because it's all leaves

      //Combine the all-leaf leftside with all the possible rightsides that have a phi at their left edge (or are empty)
      for (var j = 0; j < rightsides.length; j++) {
        var firstRight = rightsides[j][0];
        if (!rightsides[j].length || firstRight.children && firstRight.children.length) {
          var cand = leftside.concat(rightsides[j]);
          candidates.push(cand);
        }
      }



      //Case 2: the first i words are wrapped in a phi
      if (i < leaves.length) {
        if (options.noUnary && i < 2) {
          continue;
          //Don't generate any candidates where the first terminal is in a phi by itself.
        }
        var phiLeftsides = gen(leaves.slice(0, i), options);
        for (var k = 0; k < phiLeftsides.length; k++) {
          var phiNode = wrapInRecCat(phiLeftsides[k], options);
          if (!phiNode) {
            continue;
          }
          var leftside = [phiNode];

          for (var j = 0; j < rightsides.length; j++) {
            cand = leftside.concat(rightsides[j]);
            candidates.push(cand);
          }
        }
      }

    }

    return candidates;
  }

  function wrapInRecCat(candidate, options) {
    // Check for Exhaustivity violations below the phi, if phi is listed as one of the exhaustivity levels to check
    if (options && options.obeysExhaustivity) {
      if ((typeof options.obeysExhaustivity === "boolean" || options.obeysExhaustivity.indexOf(options.recursiveCategory) >= 0) && !obeysExhaustivity(options.recursiveCategory, candidate))
        return null;
    }
    if (options && options.obeysNonrecursivity)
      for (var i = 0; i < candidate.length; i++)
        if (candidate[i].cat === options.recursiveCategory)
          return null;

    if (candidate.length < 2 && options.recursiveCategory === candidate[0].cat) {
      return null;
    }
    return {
      id: options.recursiveCategory + (options.counters.recNum++),
      cat: options.recursiveCategory,
      children: candidate
    };
  }

  //Takes a list of candidates and doubles it to root each of them in a phi
  //If options.noUnary, skip wrapInRecCating candidates that are only 1 terminal long
  function addRecCatWrapped(candidates, options) {
    var origLen = candidates.length;
    var result = [];
    if (!options.requireRecWrapper) {
      result = candidates;
    }
    for (var i = 0; i < origLen; i++) {
      var candLen = candidates[i].length;
      if (candLen) {
        if (options.noUnary && candLen == 1) {
          continue;
        }
        var phiNode = wrapInRecCat(candidates[i], options);
        if (!phiNode) {
          continue;
        }
        result.push([phiNode]);
      }
    }
    return result;
  }

})();
/* Takes a list of words and returns the candidate set of trees (JS objects)
   Options is an object consisting of the parameters of GEN. Its properties can be:
   - obeysExhaustivity (boolean or array of categories at which to require conformity to exhaustivity)
   - obeysHeadedness (boolean)
   - obeysNonrecursivity (boolean)
	 - rootCategory (string)
	 - recursiveCategory (string)
	 - terminalCategory (string)
   - addTones (string). Possible values include:
	 		- "addJapaneseTones"
			- "addIrishTones_Elfner"
			- "addIrishTones_Kalivoda"
	- noUnary (boolean): if true, don't create any nodes that immediately dominate only a single node.
	- maxBranching (numeric): maximum number of children that any node in the tree can have
	- requireRecWrapper (boolean). Formerly "requirePhiStem"
	- syntactic (boolean): are we generating syntactic trees?
   - ph (prosodic heirarchy object):
   	pCat: custom pCat used in GEN
	categoryPairings: custom category pairings passed to makeTableau passed to constraints
*/
window.GEN = function(sTree, words, options){
	options = options || {}; // if options is undefined, set it to an empty object (so you can query its properties without crashing things)

	//Set prosodic hierarchy if we're making prosodic trees. Don't bother with this for syntactic trees.
	if(!options.syntactic){
		// Create the ph object if none was passed or what was passed was incomplete, and set it the default PH object, defined in prosodicHierarchy.js
		if (!(options.ph && options.ph.pCat && options.ph.categoryPairings)){
			options.ph = PH_PHI;
			//console.log("The prosodic hierarchy input to GEN was missing or incomplete, so ph has been set by default to PH_PHI, defined in prosodicHierarchy.js");
		}
		
		setPCat(options.ph.pCat);
		setCategoryPairings(options.ph.categoryPairings);
		// give a warning if there are categories from categoryPairings not present in pCat
		if (!checkProsodicHierarchy(options.ph.pCat, options.ph.categoryPairings)){
			displayWarning("One or more categories in the provided map of syntactic-prosodic correspondences (categoryPairings) do not exist in the provided prosodic hierarchy (pCat). Resetting pCat and categoryPairings to their default values, defined in PH_PHI.");
			//set pCat and categoryPairings to their default values
			resetPCat();
			resetCategoryPairings();
			options.ph = PH_PHI;
		}
	}
	
	var categoryHierarchy = options.syntactic ? sCat : pCat;
	var defaultRecCat = options.syntactic ? "xp" : "phi"; //sets the default of recursiveCategory option to "phi" if prosodic, "xp" if syntactic

	/* First, warn the user if they have specified terminalCategory and/or
	 * rootCategory without specifying recursiveCategory
	 */
	 if(!options.recursiveCategory && (options.rootCategory || options.terminalCategory)){
		if(!window.confirm("You have not specified the recursive category for GEN, it will default to "+ defaultRecCat +".\nClick OK if you wish to continue."))
			throw new Error("GEN was canceled by user.");
	}
	/* the prosodic hierarchy should include the categories specified in
	 * options.rootCategory, options.recursiveCategory and options.terminalCategory
	 * But if they are not, the default setting code throws unhelpful errors.
	 * The finally block throws more helpful errors and alert boxes instead
	 */

	//a flag for whether the user has included a novel category undefined in categoryHierarchy
	var novelCategories = false;
	try{
		
		options.recursiveCategory = options.recursiveCategory || defaultRecCat;
		//sets the default of rootCategory based on recursiveCategory
		options.rootCategory = options.rootCategory || categoryHierarchy.nextHigher(options.recursiveCategory);
		//sets the default of terminalCategory based on recursiveCategory
		options.terminalCategory = options.terminalCategory|| categoryHierarchy.nextLower(options.recursiveCategory);
	}
	finally{
		var novelCatWarning = " is not a valid category with the current settings.\nCurrently valid prosodic categories: " + JSON.stringify(pCat) + "\nValid syntactic categories: " + JSON.stringify(sCat);
		if(options.rootCategory && categoryHierarchy.indexOf(options.rootCategory)<0){
			var err = new Error("Specified root category "+options.recursiveCategory+novelCatWarning);
			displayError(err.message, err);
			novelCategories = true;
			throw err;
		}
		if(categoryHierarchy.indexOf(options.recursiveCategory)<0){
			var err = new Error("Specified recursive category "+options.recursiveCategory+novelCatWarning);
			displayError(err.message, err);
			novelCategories = true;
			throw err;
		}
		if(options.terminalCategory && categoryHierarchy.indexOf(options.terminalCategory)<0){
			var err = new Error("Specified terminal category "+options.recursiveCategory+novelCatWarning);
			displayError(err.message, err);
			novelCategories = true;
			throw err;
		}
	}

	//Warnings for adverse GEN options combinations:
	if(options.rootCategory === options.recursiveCategory && options.obeysNonrecursivity){
		displayWarning("You have instructed GEN to produce non-recursive trees and to produce trees where the root node and intermediate nodes are of the same category. Some of the trees GEN produces will be recursive.");
	}
	if(options.rootCategory === options.terminalCategory && options.obeysNonrecursivity){
		displayWarning("You have instructed GEN to produce non-recursive trees and to produce trees where the root node and terminal nodes are of the same category. All of the trees GEN produces will be recursive.");
	}
	if(options.recursiveCategory === options.terminalCategory && options.obeysNonrecursivity){
		displayWarning("You have instructed GEN to produce non-recursive trees and to produce trees where the intermediate nodes and the terminal nodes are of the same category. You will only get one bracketing.");
	}

	//Perform additional checks of layering if novel categories are involved.
	if(!novelCategories){
		if(categoryHierarchy.isHigher(options.recursiveCategory, options.rootCategory) || categoryHierarchy.isHigher(options.terminalCategory, options.recursiveCategory)){
			displayWarning("You have instructed GEN to produce trees that do not obey layering. See pCat and sCat in prosodicHierarchy.js");
		}
		else{
			if(options.recursiveCategory !== categoryHierarchy.nextLower(options.rootCategory) && options.recursiveCategory !== options.rootCategory){
				displayWarning(""+options.recursiveCategory+" is not directly below "+options.rootCategory+" in the prosodic hierarchy. None of the resulting trees will be exhaustive because GEN will not generate any "+categoryHierarchy.nextLower(options.rootCategory)+"s. See pCat and sCat in prosodicHierarchy.js");
			}
			if(options.terminalCategory !== categoryHierarchy.nextLower(options.recursiveCategory) && options.terminalCategory !== options.recursiveCategory){
				displayWarning(""+options.terminalCategory+" is not directly below "+options.recursiveCategory+" in the prosodic hierarchy. None of the resulting trees will be exhaustive because GEN will not generate any "+categoryHierarchy.nextLower(options.recursiveCategory)+"s. Current pCat: "+pCat);
			}
		}
	}

	if(typeof words === "string") { // words can be a space-separated string of words or an array of words; if string, split up into an array
		if (!words) { // if empty, scrape words from sTree
			if(sTree.cat && sTree.id){
				words = getLeaves(sTree);
			}
			else{
				let message = "window.GEN() was called no valid input!";
				displayError(message);
				return [];
			}
		} else {
			words = words.split(' ');
			words = deduplicateTerminals(words);
		}
	} else {
		words = deduplicateTerminals(words);
	}

	var leaves = [];
	options.counters = {
		recNum: 0
	}
	for(var i=0; i<words.length; i++){
		leaves.push(wrapInLeafCat(words[i], options.terminalCategory, options.syntactic));
	}

	return window.GEN_impl(sTree, leaves, options);
}

function deduplicateTerminals(terminalList) {
	//Check for duplicate words
	var occurrences = {};
	var dedupedTerminals = [];
	for(var i=0; i<terminalList.length; i++){
		var t = terminalList[i];
		//If this is the first occurrence of t, don't append an index
		if(!occurrences.hasOwnProperty(t)){
			dedupedTerminals.push(t);
			occurrences[t] = 1;
		}
		// If we've seen t before, then add an index to it such that the 2nd occurrence of t
		// becomes t_1.
		else{
			dedupedTerminals.push(t+'_'+occurrences[t]);
			occurrences[t] = occurrences[t] + 1;
		}
	}
	return dedupedTerminals;
}

/** Function to take a string and category and return an object wordObj with attributes
 *  wordObj.id = word
 *  wordObj.cat = cat
 * 
 * Also convert hyphenated information about accent and status as a clitic that is 
 * appended to the word argument to attributes of wordObj.
 * 
 * If input word is already an object, return it after checking its category.
 * - if word.cat == cat, return as is
 * - if word.cat == "clitic" and syntactic==true, create an x0 layer over the clitic
 * - if word.cat == "clitic" and syntactic==false, change word.cat to "syll"
 * - if word.cat != cat, and word.cat != clitic, change word.cat to cat.
 */
function wrapInLeafCat(word, cat, syntactic){
	var wordObj;
	//If word is already an object with appropriate properties, then check categories and return.
	if(typeof word === "object"){
		if(word.cat && word.id){
			wordObj = JSON.parse(JSON.stringify(word)); //deep copy shortcut
			//convert "clitic" to "syll" if we're making a prosodic tree
			if(wordObj.cat==="clitic"){
				if(!syntactic){
					wordObj.cat = "syll";
				}
				else{ //if it's a clitic and we're making syntactic trees, then give it an x0 layer 
					var cliticObj = wordObj;
					wordObj = addParent(cliticObj);
				}
			} 
			//otherwise change cat to the specified cat if they don't match
			else if (wordObj.cat !== cat){
				wordObj.cat = cat;
			}
			
			return wordObj;
		}
		else displayWarning("wrapInLeafCat: argument word is already an object but lacks an id or cat.");
	}

	//Otherwise, word is a string and must be converted into an object.
	else{
		var myCat = cat || 'w'; //by default, the leaf category is 'w'
		var wordId = word;

		//check if the input specifies this is a clitic and set category appropriately
		var isClitic = word.indexOf('-clitic')>=0;
		if (isClitic){
			myCat = syntactic ? 'clitic' : 'syll'; //syntactic tree vs prosodic trees
			wordId = wordId.split('-clitic')[0];
		}
		wordObj = {cat: myCat};

		//check if the input specifies this is an accented word, and set accent to true if so
		if(word.indexOf('-accent') >= 0){
			wordObj.accent = true;
			wordId = wordId.split('-accent')[0];
		}
		wordObj.id = wordId;

		//add an x0 layer if this is a (syntactic) clitic
		if(myCat==="clitic"){
			wordObj = addParent(wordObj);
		}
		return wordObj;
	}
}

function addParent(child, parentCat="x0", parentId="clitic_x0"){
	return {cat:parentCat, id:parentId, children:[child]};
}
function containsClitic(x) {
    return x.indexOf("clitic") > -1;
  }
  
  
  function generateWordOrders(wordList, clitic) {
    if (typeof wordList === 'string') {
      var cliticTagIndex = wordList.indexOf("-clitic");
      if (cliticTagIndex > 0) {
        var wordListParts = wordList.split("-clitic");
        wordList = wordListParts[0] + wordListParts[1];
      }
      wordList = wordList.split(' ');
    }
    //Find the clitic to move around
    var cliticIndex = wordList.indexOf(clitic);
    try {
      if (cliticIndex < 0)
        throw new Error("The provided clitic " + clitic + " was not found in the word list");
    }
    catch(err) {
      displayError(err.message, err);
    }
    //Slice the clitic out
    var beforeClitic = wordList.slice(0, cliticIndex);
    var afterClitic = wordList.slice(cliticIndex + 1, wordList.length);
    var cliticlessWords = beforeClitic.concat(afterClitic);
  
    var orders = new Array(wordList.length);
    for (var i = 0; i <= cliticlessWords.length; i++) {
      beforeClitic = cliticlessWords.slice(0, i);
      afterClitic = cliticlessWords.slice(i, cliticlessWords.length);
      orders[i] = beforeClitic.concat([clitic + "-clitic"], afterClitic);
    }
    return orders;
  }
  
  /* Arguments:
      stree: a syntatic tree, with the clitic marked as cat: "clitic"
      words: optional string or array of strings which are the desired leaves
      options: options for GEN
  
     Returns: GEN run on each possible order of the words, where possible orders
     are those where terminals other than the clitic remian in place but the clitic can occupy any position.
  
     Caveat: If there are multiple clitics, only the first will be moved.
  */
  
  function GENwithCliticMovement(stree, words, options) {
    if(!words && (!stree.cat || !stree.id)){
      displayError("GENwithCliticMovement was called with no valid input!");
      return [];
    }
    // Identify the clitic of interest
    var clitic = '';
    // First try to read words and clitic off the tree
    var leaves = getLeaves(stree);
    if (leaves.length > 0 && leaves[0].id) {
      //console.log(leaves);
      var leaf = 0;
      while (clitic === '' && leaf < leaves.length) {
        if (leaves[leaf].cat === "clitic")
          clitic = leaves[leaf].id;
        leaf++;
      }
      if (clitic === '') {
        displayWarning("You selected GEN settings that move clitics, but one or more input trees do not have a clitic lableled.");
        return GEN(stree, words, options);
        //throw new Error("GENWithCliticMovement was called but no node in stree has category clitic was provided in stree");
  
      }
    }
    //Otherwise, get the clitic from words
    else {
      // Make sure words is an array
      if (typeof words === "string") {
        words = words.split(' ');
      }
      var x = words.find(containsClitic);
      if (!x) { //x is undefined if no word in "words" contains "clitic"
        displayWarning("You selected GEN settings that move clitics, but one or more input trees do not have a clitic lableled.");
        return GEN(stree, words, options);
      }
      clitic = x.split('-clitic')[0];
      words[words.indexOf(x)] = clitic;
    }
  
    //Make sure words is defined before using it to generate word orders
    if (!words || words.length < leaves.length) {
      words = new Array(leaves.length);
      for (var i in leaves) {
        words[i] = leaves[i].id;
      }
  
    }
    var wordOrders = generateWordOrders(words, clitic);
    var candidateSets = new Array(wordOrders.length);
    for (var i = 0; i < wordOrders.length; i++) {
      candidateSets[i] = GEN(stree, wordOrders[i], options);
    }
    //candidateSets;
    return [].concat.apply([], candidateSets);
  }
  
  /**
   * GENwithPermutation: function that takes an stree or a list of words and returns a set of candidates
   * <input, output> in which input = stree and the outputs are GEN run on all orders of the words.
   * Word orders are computed using Heap's algorithm, implemented in allOrdersInner().
   * 
   * @param {*} stree A syntactic tree to use as the input in the candidate pairs <input, output> 
   * @param {*} words A list of words. Can be a string of space-separated words, or an array of words
   * @param {*} options An object of options to pass along to GEN()
   */
  //If both an stree and words are provided, words take priority. 
  function GENwithPermutation(stree, words, options){
  
    options = options || {};
  
      var leaves = getLeaves(stree);
  
    if(!leaves[0].cat){
      leaves = [];
    }
  
      var permutations = [];
    var words = words || [];
  
      //function for swapping elements in an array, takes array and indexes of elements to be swapped
      function swap(array, index1, index2){
          var swapped = [];
          for(var i = 0; i<array.length; i++){
              if(i === index1){
                  swapped.push(array[index2]);
              }
              else if(i === index2){
                  swapped.push(array[index1]);
              }
              else{
                  swapped.push(array[i]);
              }
          }
          return swapped;
      }
  
      //actual implementation of Heap's algorithm
  
      function allOrdersInner(innerList, k){
          if(k == 1){
              permutations.push(innerList);
          }
          else{
              allOrdersInner(innerList, k-1); //recursive function call
  
              for(var i = 0; i < k-1; i++){
                  if(k%2 === 0){
                      //swap innerList[i] with innerList[k-1]
                      allOrdersInner(swap(innerList, 0, k-1), k-1); //recursive function call
                  }
                  else {
                      //swap innerList[0] with innerList[k-1]
                      allOrdersInner(swap(innerList, i, k-1), k-1); //recursive function call
                  }
              }
          }
      }
  
    // Make sure words is an array
    if (typeof words === "string") {
      words = words.split(' ');
      if (words[0] === ""){
        words = [];
      }
    }
    
      //Make sure words is defined before using it to generate word orders
    //Display warning if:
    //    -There are no words or leaves
    //    -There are mismatching words and leaves
    if(!words.length && !leaves.length){
      displayWarning("GENwithPermutation() was not given any syntactic tree or words to permute.");
      return '';
    }
      else if(words.length && leaves.length && leaves.length !== words.length){
      displayWarning("The arguments words and stree to GENwithPermutation() are mismatched. The function will use words and ignore the stree.");
      }
    else if(!words.length && leaves.length){
      words = new Array(leaves.length);
      for(var i in leaves){
        words[i] = leaves[i].id;
      }	
      }
  
      allOrdersInner(words, words.length);
      var candidateSets = [];
      for(var i = 0; i<permutations.length; i++){
          candidateSets[i] = GEN(stree, permutations[i], options);
      }
      //candidateSets;
      return [].concat.apply([], candidateSets);
  }
  /* Add minimal phi heads
   Takes list of ptrees and returns list of all possible iterations of input such that
   each minimal phi in the input has a left- or right-aligned head
   Max Tarlov 12/2020
*/

// Make a deep copy of a tree node
function copyNode(node) {
    if (node === null || typeof node !== 'object') {
        return node;
    }
    let result = node.constructor(); 
    for (var key in node) {
      result[key] = copyNode(node[key]);
    }
    return result;
}

// Takes node and returns true if any of node's children had a true 'head' attribute
function isHeaded(node) {
    let result = false;
    for (let child of node.children) {
        if (child.head) {
            result = true;
        }
    }
    return result;
}

// Accept node and add attribute head: true to the leftmost child
function addLeftHead(node) {
    if(node.children && node.children.length) {
        node.children[0].head = true;
    }
    return node;
}

// Accept node and add attribute head: true to the rightmost child
function addRightHead(node) {
    if(node.children && node.children.length){
        node.children[node.children.length - 1].head = true;
    }
    return node;
}

// take tree and return minimal nodes of specified category
function getMinimalNodes(root, cat='phi') {
    let result = [];
    function getNodesInner(node) {
        if(node.children && node.children.length) {
            for(let child of node.children) {
                getNodesInner(child);
            }
        }
        if(isMinimal(node) && node.cat == cat) {
            result.push(node);
        }
    }
    getNodesInner(root);
    return result;
}

/** Function that takes a single tree
 * and returns a list of trees consisting of all permutations 
 * of edge-aligned head placements for minimal nodes of category cat 
 * */ 
function genHeadsForTree(ptree, cat='phi') {
    let result = [];

    //add left heads to all minimalNodes
    let localCopy = copyNode(ptree);
    const minimals = getMinimalNodes(localCopy, cat);
    for(let node of minimals) {
        addLeftHead(node);
    }
    result.push(localCopy);

    //progressively change minimal nodes to right-headed for all combinations
    for(let i = 0; i < minimals.length; i++) {
        const resultLength = result.length; //note that the length of result increases with each iteration of the outer for-loop

        for(let j = 0; j < resultLength; j++) {
            localCopy = copyNode(result[j]);
            let thisMinimal = getMinimalNodes(localCopy, cat)[i];
            if(thisMinimal.children && thisMinimal.children.length > 1) {
                // Skip unary nodes to avoid duplicate trees   
                thisMinimal.children[0].head = false;
                addRightHead(thisMinimal);
                result.push(localCopy);
            }
        }
    }

    return result;
}

/** Main function. 
 * 
 * Arguments:
 * - treeList: a list of trees, or a list of pairs of trees (GEN output)
 * - cat: a category to pass along to addHeadsTo()
 * 
 * Returns: a list of all combinations of left- and right-headed minimal 
 * nodes of category 'cat' for each tree. If treeList is a list of pairs of
 * trees, the return value will also be a list of pairs of trees, preserving 
 * the inputs and iterating through the possible headed outputs.
 * 
 * Helper functions: addHeadsTo()
*/ 
function genHeadsForList(treeList, cat='phi') {
    let result = [];
    for(let tree of treeList) {
        if(tree.length && tree.length === 2) // treeList is a list of pairs of trees (GEN output)
        {
            let headedTrees = genHeadsForTree(tree[1], cat);
            var interimResult = [];
            for(let ht in headedTrees){
                interimResult.push([tree[0], headedTrees[ht]]); //push the pair [stree, headedPTree]
            }
            result = result.concat(interimResult);
        }
        else if(tree.cat) // treeList's elements are plain trees, not pairs of trees
        {
            result = result.concat(genHeadsForTree(tree, cat));
        }
        else throw new Error("addMinimalNodeHeads(treeList, cat): Expected treeList to be a list of pairs of trees or a list of trees.");
    }
    return result;
}/* Function that calls GEN from candidategenerator.js to generate syntactic input trees
*  rather than output prosodic trees.
*  By default, this creates unary and binary-branching strees rooted in xp, with all terminals mapped to x0.
*  Intermediate levels are xps, and structures of the form [x0 x0] are excluded as being
*  syntactically ill-formed, since they only arise from head movement.
*
*  Options:
*  - rootCategory: default = 'xp'
*  - recursiveCategory: default = 'xp'
*  - terminalCategory: default = 'x0'
*  - noAdjacentHeads: are x0 sisters allowed? [x0 x0]. Defaults to true.
*  - noAdjuncts: are xp sisters allowed? [xp xp]. Defaults to false.
*  - maxBranching: determines the maximum number of branches that are tolerated in
*    the resulting syntactic trees. Default = 2
*  - minBranching: determines the maximum number of branches that are tolerated in
*    the resulting syntactic trees. Default = 2
*  - noBarLevels: if false (default), bar levels are treated as phrasal. 
*    If true, bar levels are not represented, and ternary branching is permitted.
*  - addClitics: 'right' or 'left' determines whether clitics are added on the
*    righthand-side or the left; true will default to right. false doesn't add any clitics.
*    Default false.
*  - cliticsAreBare: false by default. If false, clitics will be wrapped in unary XPs. 
*    If true, clitics will not be wrapped in XPs, but will be bare heads with category clitic.
*  - cliticsInsideFirstRoot: false by default. If true, clitics are positioned "inside" the highest 
*    XP as sister to an invisible X' layer. Otherwise, clitics are sister to the highest XP.
*  - headSide: 'right', 'left', 'right-strict', 'left-strict'.
*    Which side will heads be required to be on, relative to their complements?
*    Also, must heads be at the very edge (strict)?
* Also has all the options from the underlying output candidate generator -- see
* GEN() in candidategenerator.js. Most relevant is probably noUnary which excludes
* non-branching intermediate nodes.
*/
function sTreeGEN(terminalString, options)
{
    options = options || {};

    // Options that default to true
    if(options.noAdjacentHeads === undefined){
        options.noAdjacentHeads = true;
    }
    
    options.syntactic = true;
    options.recursiveCategory = options.recursiveCategory || 'xp';
    options.terminalCategory = options.terminalCategory || 'x0';
    options.rootCategory = options.rootCategory || 'xp';

    // If bar levels are not treated as phrasal, then we need to allow ternary XPs and CPs, but not ternary x0s.
    // Furthermore, clitics should be positioned in the "specifier", as a daughter to the existing root, not a sister.
    if(options.cliticsInsideFirstRoot){
      options.noBarLevels = true;
    }
    if(options.noBarLevels && options.recursiveCategory !== 'x0'){
      options.maxBranching = 3;
      options.cliticsInsideFirstRoot = true;
    }


    //Otherwise, we want binary branching syntactic inputs.
    options.maxBranching = options.maxBranching || 2;

    //If clitics are specified as bare x0s, then all unary XPs should be invisible for consistency
    if(options.cliticsAreBare){
      options.noUnary = true;
    }

    //If non-branching XPs are invisible, then clitics should be bare X0s
    //and noAdjacentHeads needs to be false.
    if(options.noUnary){
      options.cliticsAreBare = true;
      options.noAdjacentHeads = false;
    }

    if(options.recursiveCategory === 'x0'){
      options.noAdjacentHeads = false;
    }

    //Run GEN on the provided terminal string
    var autoSTreePairs = GEN({}, terminalString, options);
    //Select just the generated trees
    var sTreeList = autoSTreePairs.map(x=>x[1]);

    //---Apply filters---
    if(options.allowClitic){
      var cliticTrees = getCliticTrees(terminalString, options);
      if(cliticTrees) {
        sTreeList = sTreeList.concat(cliticTrees);
      }
    }
    if(options.noAdjuncts){
        sTreeList = sTreeList.filter(x => !containsAdjunct(x));
    }

    //If adding clitics, various other options are relevant: clitic category (cliticsAreBare), whether clitics go inside the existing root as a daughter, or outside as a sister ()
    if(options.addClitics){
        if(options.rootCategory == 'cp' || options.cliticsInsideFirstRoot){
          var outsideClitics = [];
        }
        else {
          var outsideClitics = sTreeList.map(x => addClitic(x, options.addClitics, options.rootCategory, false, options.cliticsAreBare));;
        }
        var insideClitics = sTreeList.map(x => addClitic(x, options.addClitics, options.rootCategory, true, options.cliticsAreBare));
        sTreeList = outsideClitics.concat(insideClitics);
    }
    if(options.noAdjacentHeads){
        sTreeList = sTreeList.filter(x => !x0Sisters(x, 'x0'));
    }

    if(options.maxBranching > 0){
        sTreeList = sTreeList.filter(x=>!ternaryNodes(x, options.maxBranching));
    }
    if(options.minBranching > 0){
        sTreeList = sTreeList.filter(x=>!unaryNodes(x, options.minBranching));
    }
  
    if(options.noBarLevels){
      sTreeList = sTreeList.filter(x => !threeXPs(x));
    }
  
    if(options.headSide){
        var side, strict;
        [side, strict] = options.headSide.split('-');
        // console.log(sTreeList)
        sTreeList = sTreeList.filter(x => !headsOnWrongSide(x, side, strict));
    }
    if(options.noMirrorImages){
      sTreeList = sTreeList.filter(x => !mirrorImages(x, sTreeList));
    }

    return sTreeList;
}

/** Helper function to add clitics to trees
 *  side: which side should clitics be added on? left/right
 *  rootCategory: normally xp but could be cp or x0
 *  inside: if true, clitics are daughters to the input sTree; otherwise, sisters to it
 */
function addClitic(sTree, side="right", rootCategory, inside, bareClitic){
  if(side===true){side="right"}
  var cliticX0 = {id:'cliticParent', cat:'x0', children:[{id:'x', cat: 'clitic'}]};
  //Unless bareClitic==true, wrap the clitic in an XP layer
  if(!bareClitic){
    var cliticObj = {id:'dp', cat: 'xp', children: [cliticX0]};
  }
  else{
    var cliticObj = cliticX0;
  }
    
    var tp;
    var sisters;
    //Make the clitic a daughter of sTree
    if(inside){
        //console.log("inside");
        if(side==="right"){
            sisters = sTree.children.concat(cliticObj);
        }
        else if(side==="left"){
            sisters = [cliticObj].concat(sTree.children);
            //console.log(tp);
        }
        else{
            var errorMsg = "addClitic(): The provided side " + side + " is not valid. Side must be specified as 'left' or 'right'.";
            displayError(errorMsg);
            throw new Error(errorMsg);
        }
        
    }
    //Make the clitic sister to sTree's root, and root the whole thing elsewhere
    else{
        var sisters;
        if(side==="right"){
            sisters = [sTree, cliticObj];
        }
        else if(side==="left"){
            sisters = [cliticObj, sTree];
        }
        else{
            var errorMsg = "addClitic(): The provided side " + side + " is not valid. Side must be specified as 'left' or 'right'.";
            displayError(err.message, err);
            throw new Error(errorMsg)
        }
    }
    tp = {id: 'root', cat: rootCategory, children: sisters};
    return tp;
}

function getCliticTrees(string, options) {
  var cliticTreeList = [];
  // if terminal string already contains cltic label do nothing
  if(string.includes('-clitic')) {
    return;
  }
  // else run gen on new strings with clitics
  var terminalList = string.split(" ");
  for(var i = 0; i < terminalList.length; i++) {
    var currList = string.split(" ");
    currList[i] = currList[i] + '-clitic';
    var cliticString = currList.join(" ");
    var autoSTreePairs = GEN({}, cliticString, options);
    var sTreeList = autoSTreePairs.map(x=>x[1]);
    cliticTreeList = cliticTreeList.concat(sTreeList);
  }
  return cliticTreeList;
}

// Return an array of all possible space-separated strings of length at least min and no more than max, drawn from T with replacement.
// T -> input array of characters in string
// min -> minimum length of output strings
// max -> maximum length of output strings
function generateTerminalStrings(T, min, max) {
  // Get list of all possible permutations for each length
  var finalPermList = [];
  for(var i = min; i <= max; i++) {
    var temp = T.slice();
    var data = new Array(i);
    var permList = [];
    var currPermList = getPermutations(temp, data, i - 1, 0, permList);
    // Initialize finalPermList
    if(finalPermList.length === 0) {
      finalPermList = currPermList;
    }
    // Add to finalPermList
    else {
      finalPermList = finalPermList.concat(currPermList);
    }
  }

  return finalPermList;
}

// Return an array of all permutations (allowing repitition) of input array T
// T -> input array of characters in string
// data -> stores permutation at current iteration
// last -> index of last element in resulting permuatation
// index -> current index
// permList -> list of all permutations
// If T = ['F', 'FF'] and last = 1
// Then permList = ["F F", "F FF", "FF F", "FF FF"]
function getPermutations(T, data, last, index, permList) {
  var length = T.length;
  // One by one fix all characters at the given index and recur for the subsequent indexes
  for(var i = 0; i < length; i++) {
    // Fix the ith character at index and if this is not the last index then recursively call for higher indexes
    data[index] = T[i];
    // If this is the last index then add the string stored in data to permList
    if(index == last) {
      var strData = data.join(' ');
      permList.push(strData);
    }
    else {
      getPermutations(T, data, last, index + 1, permList);
    }
  }
  return permList;
}
var logLines = [];
function logreport(line){
    logLines.push(['<span class="report-line segment-', lastSegmentId, (lastSegmentId >= nextSegmentToReveal) ? ' segment-hidden' : '', '">', line, '<br></span>'].join(''));
    flushLog();
}
logreport.debug = function() {
    if (logreport.debug.on)
        return logreport.call(this, Array.prototype.slice.call(arguments));
}
logreport.debug.on = false; //set this to true to get logging from match, equalsisters, binarity, makeTableau, and possibly others

function flushLog() {
    if (resultsContainer) {
        var fragment = document.createElement('div');
        fragment.innerHTML = logLines.join('');
        resultsContainer.appendChild(fragment);
        logLines = [];
    } else {
        console.error('Tried to flush log before window loaded.');
    }
}/* TWO POSSIBLE PROSODIC HIERARCHY THEORIES */
PH_PHI = {
	// Defines the prosodic hierarchy. Lower index = higher category.
	pCat : ["u", "i", "phi", "w", "Ft", "syll"],

	//An array of pairs to define which syntactic categories "match" which prosodic categories.
	categoryPairings : {
		"clause": "i",
		"cp": "i",
		"xp": "phi",
		"x0": "w"
	}
};


PH_MAJMIN = {
	pCat : ["i", "MaP", "MiP", "w"],
	categoryPairings : {
		"clause": "i",
		"cp": "i",
		"xp": ["MaP", "MiP"],
		"x0": "w"
	}
};

//Defines the syntactic category hierarchy. Lower index = higher category.
var sCat = ["cp", "xp", "x0"];


// The global variable pCat can get overwritten using the setPCat function. 
// The function resetPCat restores it to this default value.
var pCat = PH_PHI.pCat;
var categoryPairings = PH_PHI.categoryPairings;


/** SETTERS AND RESETTERS **/
function setPCat(newPCat){
	pCat = newPCat;
	pCat.isHigher = function(cat1, cat2){	return (isHigher(pCat, cat1, cat2));	}
	pCat.isLower = function (cat1, cat2){	return (isLower(pCat, cat1, cat2));	}
	pCat.nextLower = function(cat) 		{	return nextLower(pCat, cat); }
	pCat.nextHigher = function(cat)		{	return nextHigher(pCat, cat);}
}

function resetPCat(){
	setPCat(PH_PHI.pCat);
}

function setCategoryPairings(newCategoryPairings){
	categoryPairings = newCategoryPairings;
}

function resetCategoryPairings(){
	categoryPairings = PH_PHI.categoryPairings;
}
/**End of setters / resetters**/





//Function that compares two prosodic categories and returns whether cat1 is higher in the prosodic hierarchy than cat2
function isHigher(pCat, cat1, cat2){
	if(pCat.indexOf(cat1) < 0 || pCat.indexOf(cat2) < 0){
		let prosodicMismatchMsg = cat1 + " or "+cat2 + " is not in the current prosodic hierarchy "+pCat;
		throw new Error(prosodicMismatchMsg);
	}
	return (pCat.indexOf(cat1) < pCat.indexOf(cat2));
}
pCat.isHigher = function(cat1, cat2){
	return (isHigher(pCat, cat1, cat2));
}
sCat.isHigher = function(cat1, cat2){
	return (isHigher(sCat, cat1, cat2));
}


// Functions that compare two prosodic/syntactic categories and returns true if cat 1 is lower in the prosodic hierarchy than cat2
function isLower(pCat, cat1, cat2){
	if(pCat.indexOf(cat1) < 0 || pCat.indexOf(cat2) < 0){
		let prosodicMismatchMsg = cat1 + " or "+cat2 + "is not in the current prosodic hierarchy "+pCat;
		throw new Error(prosodicMismatchMsg);
	}
	return (pCat.indexOf(cat1) > pCat.indexOf(cat2));
}
pCat.isLower = function (cat1, cat2){
	return (isLower(pCat, cat1, cat2));
}
sCat.isLower = function (cat1, cat2){
	return (isLower(sCat, cat1, cat2));
}
//=================================

// Function that returns the prosodic category that is one level lower than the given category
function nextLower(pCat, cat){
	var i = pCat.indexOf(cat);
	if (i < 0){
		var errMsg = cat + ' is not a prosodic category in the currently defined prosodic hierarchy, '+pCat;
		//displayError(errMsg);
		throw new Error(errMsg);
	}
	else if(i===pCat.length-1){
		console.warn(cat + ' is the lowest category defined in the prosodic hierarchy; returning category '+cat);
		return cat;
	}
	return pCat[i+1];
}

pCat.nextLower = function(cat) {
	return nextLower(pCat, cat);
}
sCat.nextLower = function(cat) {
	return nextLower(sCat, cat);
}
//=================================


//Function that returns the prosodic category that is one level higher than the given category
function nextHigher(pCat, cat){
	var i = pCat.indexOf(cat);
	if (i < 0){
		var errMsg = cat + ' is not a prosodic category in the currently defined prosodic hierarchy, '+pCat;
		displayError(errMsg);
		throw new Error(errMsg);
	}
	if (i === 0){
		displayError(cat + ' is the highest category defined in the prosodic hierarchy; returning category '+cat);
		return cat;
	}
	return pCat[i-1];
}

pCat.nextHigher = function(cat){
	return nextHigher(pCat, cat);
}

sCat.nextHigher = function(cat){
	return nextHigher(sCat, cat);
}
//=================================


function nodeHasLowerCat(node1, node2){
	if(pCat.isLower(node1.cat, node2.cat)){
		return true;
	}
	else if(node1.cat===node2.cat && isMinimal(node1) && !isMinimal(node2)){
		return true;
	}
	else return false;
}

//Evaluates whether two nodes have corresponding categories.
function catsMatch(aCat, bCat){
	if(aCat === undefined && bCat === undefined)
		return true;	//vacuously true if both nodes are leaves (with no category)
	// aCat is the key
	else if(categoryPairings.hasOwnProperty(aCat)){
		// check if bCat is an array
		if (Array.isArray(bCat)){
			return bCat.includes(aCat);
		}
		else{
			return categoryPairings[aCat] === bCat;
		}
	}
	// bCat is the key
	else if(categoryPairings.hasOwnProperty(bCat)){
		// check if aCat is an array
		if (Array.isArray(aCat)){
			return aCat.includes(bCat);
		}
		else{
			return categoryPairings[bCat] === aCat;
	
		}
	}
	else
	{
		//console.warn("Neither argument to catsMatch was a valid syntactic category:", aCat, bCat);	//TODO this gives a false positive warning every time Match PS runs on a tree whose leaves don't have categories.
		return false;
	}
}

/* A function to return the paired category as defined in categoryPairings.
 * categoryPairings only returns prosodic categories given a syntactic category.
 * reversibleCatPairings also returns a syntactic category given a prosodic
 * category.
*/
function reversibleCatPairings(cat){
  if (categoryPairings[cat]){
    return categoryPairings[cat]; //just the same as calling categoryPairings
  }
  else {
    //get the property names of categoryPairings
    var props = Object.getOwnPropertyNames(categoryPairings);
    var propFound = false; //true when the category is paired
    for (var i = 0; i < props.length; i++){
      if (categoryPairings[props[i]] == cat){
        propFound = true;
        if (props[i] === "clause"){
          // rn categoryPairings has a property "clause" which maps to i
          return "cp"; // "cp" also maps to i, I think we want "cp"
        }
        //props[i] is the property that maps to cat
        return props[i];
      }
    }
    // if no matching category is found, return a custom error.
    if (!propFound){
      throw(new Error("" + cat + " is not a category defined in categoryPairings (see main/prosodicHierarchy.js)"));
    }
  }
}



// Function to check that every prosodic category in categoryPairings is in pCat
function checkProsodicHierarchy(pCat, categoryPairings){
	ret = true;
	for (category in categoryPairings){
		// check if category maps to multiple pairings 
		if (Array.isArray(categoryPairings[category])){
			console.log(categoryPairings[category]);
			for (pairing in categoryPairings[category]){
				if (!pCat.includes(categoryPairings[category][pairing])){
					ret = false;
					console.log(categoryPairings[category][pairing]);
					var prosodicMismatchMsg = "The category " + categoryPairings[category][pairing] + " from categoryPairings is not in pCat!\nCurrent pCat: "+pCat;
					displayError(prosodicMismatchMsg);
					//throw new Error(prosodicMismatchMsg);
				}
			}
		}
		else if(!pCat.includes(categoryPairings[category])){
			var errMsg = "The category " + categoryPairings[category] + " from categoryPairings is not in pCat!\nCurrent pCat: "+pCat;
			ret = false;
			displayError(errMsg);
			//throw new Error(errMsg);
		}
	}
	return ret;
}function x0Sisters(sTree, cat){
	var x0SistersFound = false;
    if(sTree.children && sTree.children.length){
        var numX0 = 0;
        for(var i=0; i<sTree.children.length; i++){
            var child = sTree.children[i];

            if(child.cat === cat){
                numX0++;
            }
            if(numX0 > 1){
                x0SistersFound = true;
                break;
            }

            x0SistersFound = x0Sisters(child, cat);
            if(x0SistersFound) break;
        }

    }
    return x0SistersFound;
}

function ternaryNodes(sTree, maxBr){
    var ternaryNodesFound = false;
    if(sTree.children && sTree.children.length){
        if(sTree.children.length > maxBr){
            ternaryNodesFound = true;
            return true;
        }
        for(var i=0; i<sTree.children.length; i++){
            var child = sTree.children[i];
            ternaryNodesFound = ternaryNodes(child, maxBr);
            if(ternaryNodesFound) break;
        }

    }
    return ternaryNodesFound;
}

function unaryNodes(sTree, minBr){
    var unaryNodesFound = false;
    if(sTree.children && sTree.children.length){
        if(sTree.children.length < minBr){
            unaryNodesFound = true;
            return true;
        }
        for(var i=0; i<sTree.children.length; i++){
            var child = sTree.children[i];
            unaryNodesFound = unaryNodes(child, minBr);
            if(unaryNodesFound) break;
        }

    }
    return unaryNodesFound;
}

function headsOnWrongSide(sTree, side, strict){
    var badHeadFound = false;
	
    if(sTree.children && sTree.children.length){
        var i = 0;
        while(!badHeadFound && i<sTree.children.length){
            var numChildren = sTree.children.length;
            var child = sTree.children[i];
            if(child.cat==='x0' && numChildren > 1){
                if((side==='right' && i===0) || (side==='left' && i===numChildren-1)){
                    badHeadFound = true;
                }
                if(strict==='strict'){
                    if((side==='right' && i<sTree.children.length-1) || (side==='left' && i>0)){
                        badHeadFound = true;
                    }
                }
            }
            else{
                badHeadFound = headsOnWrongSide(child, side);
            }
            i++;
        }
    }
    return badHeadFound;

}

// returns true if sTree is a mirror of an earlier tree in sTreeList
// returns false if sTree is not a mirror image of an earlier tree in sTreeList
function mirrorImages(sTree, sTreeList) {
	var mirrorImageExists = false;
	var index = sTreeList.indexOf(sTree);
	//var reverseTree = JSON.parse(JSON.stringify(sTree));
	for(var i = 0; i < index; i++) {
		var currTree = sTreeList[i];
		if(checkMirror(currTree, sTree)) {
			mirrorImageExists = true;
			return mirrorImageExists;
		}
	}
	return mirrorImageExists;
}

// check for if trees are mirror images of eachother
function checkMirror(sTree, rTree) {
	if(sTree.children && sTree.children.length){
			if(rTree.children === undefined || sTree.children.length !== rTree.children.length) {
				return false;
			}
			for(var i=0; i<sTree.children.length; i++){
					var sChild = sTree.children[i];
					var rChild = rTree.children[sTree.children.length-i-1];
					if (sChild.cat !== rChild.cat) {
						return false;
					}
					if(!checkMirror(sChild, rChild)){
                        return false;
                        //quit early if checkMirror evaluates to false for any child.
                    }
			}
    }
    //if sTree has no children but rTree does
    else if(rTree.children && rTree.children.length > 0){
        return false;
    }
	return true;
}

// Return true if there is any node that has more than two children x such that x.cat === 'xp'.
// Two xp children is fine, but three (or more) is not fine.
function threeXPs(sTree) {
	var threeXPsFound = false;
	if(sTree.children && sTree.children.length){
		// console.log(sTree.children)
		var numXPs = 0;
		for(var i=0; i<sTree.children.length; i++){
			var child = sTree.children[i];
			if(child.cat === 'xp') {
				numXPs += 1;
			}
			if(numXPs > 2) {
				threeXPsFound = true;
				break;
			}
			threeXPsFound = threeXPs(child);
			if(threeXPsFound) break;
		}
	}
	return threeXPsFound;
}

// Return true if there is a node in it whose children are all xps, false if all nodes have an x0 child
function containsAdjunct(sTree) {
	var adjunctFound = false;
	if(sTree.children && sTree.children.length){
		var numXPs = 0;
		for(var i=0; i<sTree.children.length; i++){
			var child = sTree.children[i];
			if(child.cat === 'xp') {
				numXPs += 1;
			}
			if(numXPs == sTree.children.length) {
				adjunctFound = true;
				break;
			}
			adjunctFound = containsAdjunct(child);
			if(adjunctFound) break;
		}
	}
	return adjunctFound;
}

/** Produces an array of arrays representing a tableau
 * Options: GEN options and options for parenthesize trees
 * - trimStree option uses the trimmed version of the sTree
 * - showHeads: for marking and showing heads of prosodic constituents
 * 	If showHeads=== 'right' or 'left', mark heads of all prosodic 
 * 	constituents, using the function markHeads(), defined in 
 *  constraints/recursiveCatEvals.js (this is not a good location -- should move it).
 * 	Otherwise, just pass showHeads along to parenthesizeTree() so that heads get marked with * in the bracket notation.
 * 
 * - ph: prosodic hierarchy object with elements as follows:
 * 		.pCat: custom pCat list to be passed to Gen
 * 		.categoryPairings: custom category pairings to be passed to constraints  
*/ 
function makeTableau(candidateSet, constraintSet, options){
	//all options passed to makeTableau are passed into parenthesizeTree, so make
	//sure your options in dependent functions have unique names from other funcs
	options = options || {};
	
	var tableau = [];
	//Make a header for the tableau, containing all the constraint names.
	//First element is empty, to correspond to the column of candidates.
	var sTreeObject = candidateSet[0] ? candidateSet[0][0] : '';
	var sTree; /*keeping string and object seperate so the trimmed version can be
		added later, if necessary*/
	var trimmedTree;//this will be the (un)trimmed tree in EVAL, I just want to to
		//have wide scope so I can overwrite it a lot
	if (sTreeObject instanceof Object) {
		var sOptions = {}; //must not include tone options
		for (var op in options){
			if (op != "showTones" && op != "addTones"){
				sOptions[op] = options[op]; //don't copy in tone options
			}
		}
		sTree = parenthesizeTree(sTreeObject, sOptions); //JSON.stringify(sTreeName);
	}
	//Build a header for the tableau
	var header = [sTree];
	for(var i=0; i<constraintSet.length; i++){
		/* Split the constraint up into the function name, category, and
		*  any options, in that order. They should be separated by '-'.
		*/
		var conParts = constraintSet[i].split('-');
		var optionString = '';
		//If there are options, truncate their attribute names and append them to the constraint name.
		if(conParts[2] && conParts[2].length){
			var optionObj = JSON.parse(conParts[2]);
			var optionProperties = Object.getOwnPropertyNames(optionObj);
			for(var j in optionProperties){
				if(optionObj[optionProperties[j]]==true){
					var temp = optionProperties[j];
					if(temp.indexOf('require')>=0){
						temp = temp.slice('require'.length);
					}
					optionString += '-'+temp;
				}
				//For constraints that involve head marking, if "side" is defined as an option then take the value "left" or "right" and append it to the constraint name.
				if(optionProperties[j]=="side"){
					optionString += '-'+optionObj[optionProperties[j]];
				}
			}
		}
		var cat = conParts[1] ? '('+conParts[1]+')' : ''
		var constraintOptionsCat = conParts[0]+optionString+cat;
		header.push(constraintOptionsCat);
	}

	if(options.trimStree){
		header[0] = header[0].concat(' trimmed: ', parenthesizeTree(removeSpecifiedNodes(sTreeObject, 'silent')));
	}

	tableau.push(header);

	var getCandidate = options.inputTypeString ? function(candidate) {return candidate;} : globalNameOrDirect;
	
	//Assess violations for each candidate.
	var numCand = candidateSet.length;

	for(var i = 1; i <= numCand; i++){
		var candidate = candidateSet[numCand-i];
		let heads = options.showHeads;
		if(heads === 'right' || heads === 'left')
		{
			candidate[1] = markHeads(candidate[1], options.showHeads);
		}
		var ptreeStr = options.inputTypeString ? candidate[1] : parenthesizeTree(globalNameOrDirect(candidate[1]), options);
		var tableauRow = [ptreeStr];
		// the last element is the getter function that retrieves the category pairings received from GEN in candidategenerator.js
		
		// Maintain a list of constraints that use the cat argument for something 
		// other than an actual category
		var catExceptionConstraints = ['alignRightMorpheme', 'alignLeftMorpheme'];

		for(var j = 0; j < constraintSet.length; j++){
			var [constraint, cat, conOptions] = constraintSet[j].split('-');
			// If the current constraint isn't in the list of exceptional 
			// category constraints, and a category argument was provided, 
			// then check if the category argument is in pCat or sCat.
			if(catExceptionConstraints.indexOf(constraint)<0){
				if(cat && !pCat.includes(cat) && !sCat.includes(cat) && cat!="any"){
					console.log(pCat);
					var errorMsg = "Category argument " + cat + " is not a valid category with the current settings.\nCurrently valid prosodic categories: " + JSON.stringify(pCat) + "\nValid syntactic categories: " + JSON.stringify(sCat);
					displayError(errorMsg);
					throw new Error(errorMsg);
				}
			}
			
			if(!conOptions){
				conOptions = "{}";
			}
			//var numViolations = runConstraint(constraintAndCat[0], candidate[0], candidate[1], constraintAndCat[1]); ++lastSegmentId; // show log of each constraint run
			var oldDebugOn = logreport.debug.on;
			logreport.debug.on = false;
			trimmedTree = options.trimStree ? removeSpecifiedNodes(getCandidate(candidate[0]), 'silent') : getCandidate(candidate[0]);
			//if options.catsMatch --> add it to myConOptions

			//options for this constraint:
			var myConOptions = JSON.parse(conOptions);
			
			var numViolations = globalNameOrDirect(constraint)(trimmedTree, getCandidate(candidate[1]), cat, myConOptions); logreport.debug.on = oldDebugOn; // don't show the log of each constraint run
			tableauRow.push(numViolations);
		}
		tableau.push(tableauRow);
	}
	return tableau;
}

function tableauToCsv(tableau, separator, options) {
    options = options || {};
	if (!(tableau instanceof Array) || !tableau.length)
		return '';
	var lines = [];
	var synTree = tableau[0][0];
    if(!options.noHeader){
        lines.push('');  // empty first row for regexes
        var headerRow = ['', '', ''].concat(tableau[0].slice(1, tableau[0].length));
        lines.push(headerRow.join(separator));
    }
	var lineBreakRegex = /\n/g;
	for (var i = 1; i < tableau.length; i++) {
		var row = [(i === 1) ? synTree : '', tableau[i][0], ''].concat(tableau[i].slice(1, tableau[i].length));
		for (var j = 0; j < row.length; j++) {
			if (typeof row[j] === 'string') {
				row[j] = '"' + row[j] + '"';
			}
		}
		// TODO: handle special characters (i.e.: cell values containing either double quotes or separator characters)
		lines.push(row.join(separator));
	}
	return lines.join('\n');
}

function tableauToHtml(tableau) {
	var trimRegEx = / trimmed: /; //for testing to see if there is a trimmed tree
	if (!(tableau instanceof Array))
		return '';
	var htmlChunks = ['<table class="tableau"><thead><tr>'];
	var headers = tableau[0] || [];
	htmlChunks.push('<th></th>');
	for (var j = 0; j < headers.length; j++) {
		htmlChunks.push('<th>');
		if(trimRegEx.test(headers[j])){
			headers[j] = headers[j].replace(' trimmed: ', '<br>trimmed: ');
		}
		htmlChunks.push(headers[j]);
		htmlChunks.push('</th>');
	}
	htmlChunks.push('</tr></thead><tbody>');
	for (var i = 1; i < tableau.length; i++) {
		htmlChunks.push('<tr>');
		htmlChunks.push('<td>' + i + '.</td>');
		for (var j = 0; j < tableau[i].length; j++) {
			htmlChunks.push(j ? '<td>' : '<td class="candidate">');
			htmlChunks.push(tableau[i][j]);
			htmlChunks.push('</td>');
		}
		htmlChunks.push('</tr>');
	}
	htmlChunks.push('</tbody></table>');
	return htmlChunks.join('');
}
/*defines brackets used in tableau for various categories*/
var categoryBrackets = {
	"i": "{}",
	"cp": "{}",
	"xp": "[]",
	"phi": "()",
	"x0": ["[x0 ","]"],
	"w": ["(w ", ")"],
	"clitic": ["",""],
	"syll": ["",""],
	"Ft": ["(F ", ")"],
	"u": ["{u ", "}"]
};

var subWordBrackets = {
	"i": "{}",
	"cp": "{}",
	"xp": "[]",
	"phi": "()",
	"x0": ["[x0 ","]"],
	"clitic": ["",""],
	"u": ["{u ", "}"],
	"w": ["[","]"],
	"Ft": ["(",")"],
	"syll": ["",""]
};

/* Function that takes a [default=prosodic] tree and returns a string version where phi boundaries are marked with '(' ')'
   Possible options:
   - invisibleCategories: by default, every category in categoryBrackets gets a bracket
   - parens: default mappings in categoryBrackets can be overwritten with a map
   - showNewCats: if true, annotate categories that aren't found in categoryBrackets with [cat ], where cat is the new category
   - showTones: set to addJapaneseTones, addIrishTones_Elfner, etc. to annotate the tree with appropriate tones and show them in its parenthesization
	 - showHeads: if true, mark heads with an astrisk
*/
function parenthesizeTree(tree, options){
	var parTree = [];
	var toneTree = [];
	options = options || {};
	var showNewCats = options.showNewCats || true;
	var invisCats = options.invisibleCategories || [];
	var showTones = options.showTones || false;
	var parens = options.parens || Object.assign({}, (options.subword)? subWordBrackets : categoryBrackets);

	if(options.showTones){
		tree = window[options.showTones](tree);
	}

	function processNode(node){
		var nonTerminal = (node.children instanceof Array) && node.children.length;
		if (showNewCats && !parens.hasOwnProperty(node.cat)){
			parens[node.cat] = ["["+node.cat+" ", "]"];
		}

		var visible = invisCats.indexOf(node.cat) === -1 && parens.hasOwnProperty(node.cat);
		if (nonTerminal) {
			if (visible) {
				var tempLabel = parens[node.cat][0];
				tempLabel = addAttributeLabels(node, tempLabel)
				if (node["func"] || node["silentHead"] || node["foc"]){
					tempLabel += " ";
				}
				parTree.push(tempLabel);
				//parTree.push(parens[0]);
				if(showTones){
					toneTree.push(parens[node.cat][0]);
					if(node.tones){
						toneTree.push(node.tones);
						toneTree.push(' ');
						var toneStringLength = node.tones.length+1;
						parTree.push(' '.repeat(toneStringLength));
					}
				}
			}
			for(var i=0; i<node.children.length; i++){
				processNode(node.children[i]);
				if(i<node.children.length-1){
					parTree.push(' ');
					if(showTones){
						toneTree.push(' ');
					}
				}
			}
			if (visible){
				parTree.push(parens[node.cat][1]);
				if(node.head && options.showHeads){
					parTree.push('*'); //marks head with a *
				}
				//parTree.push(parens[1]);
				if(showTones){
					toneTree.push(parens[node.cat][1]);
					//console.log(parens[node.cat]);
					//console.log(toneTree[toneTree.length-1]);
				}
			}
		}
		//terminal but visible
		else if (visible) {
			var tempLabel = node.id;
			
			parTree.push(addAttributeLabels(node, tempLabel));
			//parTree.push(node.id);
			if(node.cat!='w' && node.cat!='x0'){
				parTree.push('.'+node.cat);
			}
			if(node.head && options.showHeads){
				parTree.push("*");
			}
			if(showTones && node.tones){
				toneTree.push(node.tones);
				var toneIdDiff = node.tones.length - node.id.length;
				if(toneIdDiff > 0)
					parTree.push(' '.repeat(toneIdDiff));
				if(toneIdDiff < 0)
					toneTree.push(' '.repeat(-toneIdDiff));
			}
			if(showTones && !node.tones){
				toneTree.push(' '.repeat(node.id.length))
			}
		}
		//	parTree.push(node.id.split('_')[0]);
	}

	processNode(tree);
	guiTree = parTree.join('');
	if(showTones)
		guiTree = guiTree + '\n' + toneTree.join('');
	return guiTree;
}

function addAttributeLabels(node, tempLabel){
	if (node ["accent"]){
		//add .a if the node has an accent attribute with a value that isn't 'u' or 'U', and the node's id isn't already a or A.
		var idPref = node.id.split('_')[0];
		var accentLabel = (node.accent && idPref !== 'A' && idPref !== 'a')? '.a': '';
		tempLabel += accentLabel;
	}
	if (node["func"]){
		tempLabel += ".f";
	}
	if (node["silentHead"]){
		tempLabel += ".sh";
	}
	if (node["foc"]){
		tempLabel += ".foc";
	}
	return tempLabel;
}
/* copyTree function gives you a new tree so you can have two copies of a tree
 * that do not reference eachother in memory, getting around pass by reference
 */
function copyTree(oldTree){
	var newTree = {}; //copy of old tree with values passed, not references
	for(var i in oldTree){
		if(i !== "children"){
			//copy all of the attributes and values that aren't "children"
			newTree[i] = oldTree[i];
		}
	}
	//now deal with children
	if(oldTree.children && oldTree.children.length){
		newTree.children = [];
		for(var i = 0; i < oldTree.children.length; i++){
			newTree.children.push(copyTree(oldTree.children[i])); //recursive function call
		}
	}
	return newTree;
}


/* function to remove silent heads from a tree. Takes a (syntactic) tree as
 * the input. This is recursive, like everything else that parses trees in SPOT
	Called by trimRedundantNodes()
 */
function trimSilentTerminals(inputTree){
	var treeCopy = copyTree(inputTree); //getting around pass by reference
	function trimSilentInner(tree){ //inner recursive function so we don't copy the tree n times
		if(tree.children && tree.children.length){
			//iterate over tree's children
			for(var i = 0; i < tree.children.length; i++){
				var child = tree.children[i];
				if(child.silent && !(child.children && child.children.length)){
					tree.children.splice(i, 1); //remove child if it is silent and terminal
					if(tree.children.length === 0){
						tree.children = false; //children shouldn't really be an array any more
					}
				}
				else if(child.children && child.children.length){
					child = trimSilentInner(child); //recursive function call
				}
			}
		}
		return tree;
	}
	return trimSilentInner(treeCopy);
}

/*  Function that removes non-lexical heads from a tree. 
	Basically identical to trimSilentTerminals
	Called by trimRedundantNodes()
 */
function trimFunctionalTerminals(inputTree){
	var treeCopy = copyTree(inputTree); //getting around pass by reference
	function trimFunctionalInner(tree){ //inner recursive function so we don't copy the tree n times
		if(tree.children && tree.children.length){
			//iterate over tree's children
			for(var i = 0; i < tree.children.length; i++){
				var child = tree.children[i];
				if(child.func && !(child.children && child.children.length)){
					tree.children.splice(i, 1); //remove child if it is functional and terminal
					if(tree.children.length === 0){
						tree.children = false; //children shouldn't really be an array any more
					}
				}
				else if(child.children && child.children.length){
					child = trimFunctionalInner(child); //recursive function call
				}
			}
		}
		return tree;
	}
	return trimFunctionalInner(treeCopy);
}

//function to trim non-x0 terminals
function trimDeadEndNodes(inputTree){
	var treeCopy = copyTree(inputTree);
	function trimDeadEndInner(node){
		if(node.children && node.children.length){
			var i = 0; //indexing variable
			while(i<node.children.length){ //iterate over children
				var child = node.children[i];
				//if child is a syntactic terminal that is not an x0, get rid of it
				if(!(child.children && child.children.length) && (child.cat != "x0" && child.cat != "clitic")){
					node.children.splice(i, 1); //remove child from children array of node
					if(node.children.length === 0){/*if node doesn't have any children,
						node.children shouldn't really be an array anymore */
						node.children = false;
					}
				}
				else {
					trimDeadEndInner(child); //recursive function call
				 	i++; //iterate indexing variable, we only want to do this if node.children didn't change
				}
			}
		}
		return node;
	}
	return trimDeadEndInner(treeCopy);
}

/* function to remove redundant nodes. A node is redundant iff it dominates all
 * and only the set of terminals that are dominated by one of its children of
 * the same category, eg. [[arbitrary terminals]]
 */
function trimRedundantNodes(inputTree, attribute){
	/*call the other two tree trimming functions first, because they might create
	redundant nodes. trimSilentTerminals() might create dead-end terminals,
	so also call trimDeadEndNodes(). trimSilentTerminals()
	creates a copy of the tree*/
	if(attribute=="silent"){
		var tree = trimSilentTerminals(inputTree);
	}else if(attribute=="func"){
		var tree = trimFunctionalTerminals(inputTree);
	}else{
		tree = inputTree;
	}
	var i = 0;

	//Must call multiple times to make sure all dead-ends are removed. If run only once, a non-x0 terminal will be removed but leave another dead end in its parent.
	var is_finished = false;
	while(!is_finished){
		is_finished = true;
		tree = trimDeadEndNodes(tree);
		leaves = getLeaves(tree);
		for(i = 0; i < leaves.length; i++){
			if(leaves[i].cat != "x0"){
				is_finished = false;
			}
		}
	};

	function trimInner(node){
		if(node.children && node.children.length){
			for(var i = 0; i<node.children.length; i++){
				var child = node.children[i];
				if(child.children && child.children.length){
					if(sameIds(getLeaves(node), getLeaves(child)) && child.cat === node.cat){
						//node is redundant, get rid of it\
						node = trimInner(child); //recursive function call

					}
					else {
						node.children[i] = trimInner(node.children[i]); //recursive function call
					}
				}
			}
		}
		return node;
	}
	return trimInner(tree);
}

/*  This function is untested and isn't called anywhere. 
	Call the other two tree trimming functions first, because they might create
	redundant nodes. trimSilentTerminals() might create dead-end terminals,
	so call that inside of trim deadEndTerminals(). trimSilentTerminals()
	creates a copy of the tree
*/
function trimAttributedNodes(inputTree, attribute){
	
	var tree = copyTree(inputTree);
	function trimInner(node){
		if(node.children && node.children.length){
			for(var i = 0; i<node.children.length; i++){
				var child = node.children[i];
				if(child.children && child.children.length){
					if(node[attribute]){
						//node is redundant, get rid of it\
						node = trimInner(child); //recursive function call
					}
					else {
						node.children[i] = trimInner(node.children[i]); //recursive function call
					}
				}
			}
		}
		return node;
	}
	if(tree[attribute]){
		tree.cat = NaN;
	}
	return trimInner(tree);
}

/* Helper function for markMinMax() in recursiveCatEvals.js
*/
function createDummies(inputTree, attribute){
	/*finds xp's with specified attribute and replaces their cat with "dummy"*/
	tree = copyTree(inputTree)
	function createDummyInner(node, attribute){
		if((attribute==="silent" && node.silentHead)
			|| (attribute==="func" && node.func))
			{
				node.cat = "dummy";
		}
		if(node.children && node.children.length){
			for(var i = 0; i<node.children.length; i++){
				var child = node.children[i];
				if(child.children && child.children.length){
					node.children[i] = createDummyInner(child);
				}
			}
		}
		return node;
	}
	return createDummyInner(tree, attribute);
}

/*  Created during an abandoned approach to evaluating the maximality or 
	minimality of nodes when only lexical nodes are being counted, for
	e.g. MatchMaxLexical.
	Tested during original creation but not tested by any current test files
	due to reworking of markMinMax.
*/
function removeSpecifiedNodes(inputTree, attribute){
	/*removes all terminal nodes with specified attribute and all redundant xp's left over.
	  afterward, replaces xp's with particular attribute with node of category dummy
	*/
	var tree = trimRedundantNodes(inputTree, attribute);
	//create dummmy nodes and return
	return createDummies(tree, attribute);
}