/* Assign a violation for every node in sTree of category sCat
whose d edge is not aligned with the d edge of a node in pTree 
of the prosodic category corresponding to s

For every sCat node s in sTree, find a node p in pTree of the proper category
such that the first (for align-left) leaf dominated by s has the same id as
the first leaf dominated by p.

TODO Do we ever want to try to align x0 levels?? Or would we ever have an xp as a leaf?
TODO test this function.
*/
function alignLeft(sTree, pTree, sCat){
	return alignSP(sTree, pTree, sCat, 'left');
}

function alignRight(sTree, pTree, sCat){
	return alignSP(sTree, pTree, sCat, 'right');
}

function alignSP(sTree, pTree, sCat, d){
	var getEdge = (d==="left") ? getLeftEdge : getRightEdge;
	var vCount = 0;
	walkTree(sTree, function(sNode){
		if(sNode.cat !== sCat)	 // only go further if sNode has the category we're interested in
			return;
		var sEdge = getEdge(sNode);
		if(!sEdge)
			sEdge = sNode;	// If sNode is a leaf (which it probably shouldn't be but depending on the tree might be),
								// then look for a p-node that matches sNode itself. TODO is this a good idea?
		var noMatch = true;
		walkTree(pTree, function(pNode){
			if(!catsMatch(sCat, pNode.cat))
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

function getLeftEdge(node){
	return getLeaves(node)[0];
}

function getRightEdge(node){
	var leaves = getLeaves(node);
	return leaves[leaves.length-1];
}

function alignPS(sTree, pTree, cat, d){
	return alignSP(pTree, sTree, cat, d);
}

function alignLeftPS(sTree, pTree, cat){
	return alignPS(sTree, pTree, cat, 'left');
}

function alignRightPS(sTree, pTree, cat){
	return alignPS(sTree, pTree, cat, 'right');
}

function wrap(sTree, pTree, cat){
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
			if(!ptree.accent){
				ptree.accent = ptree.id.split('_')[0];
			}
			if(ptree.accent === 'A' || ptree.accent === 'a'){
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
*/
function balancedSisters(stree, ptree, cat){
    var vcount = 0;

    // Base case: no violation if there are no children
    if ((!ptree.children) || ptree.children.length === 0){
        return vcount;
    }

    else{
        if(ptree.cat===cat){
            
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
function binMaxBranches(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		if(ptree.cat === cat && ptree.children.length>2){
			//logreport("VIOLATION: "+ptree.id+" has "+ptree.children.length+" children!");
			vcount++;
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMaxBranches(s, ptree.children[i], cat);
		}
	}
	return vcount;
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
function binMaxBranchesGradient(s, ptree, cat){
	var vcount = 0;
	if(ptree.children && ptree.children.length){
		var numChildren = ptree.children.length;
		if(ptree.cat === cat && numChildren>2){
			var excessChildren = numChildren - 2;
			//logreport(excessChildren+ " VIOLATION(s): "+ptree.id+" has "+numChildren+" children!");
			vcount += excessChildren;
		}
		for(var i = 0; i<ptree.children.length; i++){
			vcount += binMaxBranches(s, ptree.children[i], cat);
		}
	}
	return vcount;
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
function binMaxLeaves(s, ptree, c){
	var vcount = 0;
	//the category we are looking for:
	var target = pCat.nextLower(c);
	//pCat.nextLower defined in prosdic hierarchy.js
	//console.log("the target of binMaxLeaves is " + target);
	if(ptree.children && ptree.children.length){
		var targetDesc = getDescendentsOfCat(ptree, target);
		//console.log("there are " + targetDesc.length + " " + target + "s");
		if(ptree.cat === c && targetDesc.length > 2){
			vcount ++;
		}
		for(var i = 0; i < ptree.children.length; i++){
			vcount += binMaxLeaves(s, ptree.children[i], c);
		}
	}
	return vcount;
}

/* Gradiant BinMax (Leaves)
* I don't know how to define this constraint in prose, but it's binMaxLeaves as
* a gradient constraint instead of a categorical constraint.
*/
function binMaxLeavesGradient(s, ptree, c){
	var vcount = 0;
	//the category we are looking for:
	var target = pCat.nextLower(c);
	//pCat.nextLower defined in prosodicHierarchy.js
	if(ptree.children && ptree.children.length){
		var targetDesc = getDescendentsOfCat(ptree, target);
		if(ptree.cat === c && targetDesc.length > 2){
			vcount += targetDesc.length - 2; //this makes the constraint gradient
		}
		for(var i = 0; i < ptree.children.length; i++){
			vcount += binMaxLeavesGradient(s, ptree.children[i], c);
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

/*</legacyBinarityConstraints>*/

/* Binarity constraints that care about the number of leaves
Note: relies on getLeaves.
In the future we might want to have structure below the level of the (terminal) word, e.g., feet
and in that case would need a type-sensitive implementation of getLeaves
*/
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

function getPhis(pTree)
{
	var phiArray = [];
	var nodes = getNodes(pTree);
	for(var i = 0; i < nodes.length; i++)
	{
		var current = nodes[i];
		if(current.cat == "phi")
		{
			phiArray.push(current);
		}
	};
	return phiArray;
};

function phiMates(ptree,x,y)
{
	var answer = false;
	var phis = getPhis(ptree);
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

function sharePhi(ptree,x,y)
{
	var answer = false;
	var phis = getPhis(ptree);
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

function group(sTree,pTree)
{
	var vcount = 0;
	var sLeaves = getLeaves(sTree);
	for(var i = 0; i < sLeaves.length; i++)
	{
		var currentLeaf = sLeaves[i];
		var comSet = commands(sTree,currentLeaf);
		for(var j = 0; j < comSet.length; j++)
		{
			var currentCommandee = comSet[j];
			if(!sharePhi(pTree,currentLeaf,currentCommandee))
			{
				vcount++;
			}
		}
	}
	return vcount;
};

function groupMin(sTree,pTree)
{
	var vcount = 0;
	var sLeaves = getLeaves(sTree);
	for(var i = 0; i < sLeaves.length; i++)
	{
		var currentLeaf = sLeaves[i];
		var comSet = commands(sTree,currentLeaf);
		for(var j = 0; j < comSet.length; j++)
		{
			var currentCommandee = comSet[j];
			if(!phiMates(pTree,currentLeaf,currentCommandee))
			{
				vcount++;
			}
		}
	}
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

function splitNMC(sTree,pTree)
{
	var vcount = 0;
	var sLeaves = getLeaves(sTree);
	for(var i = 0; i < sLeaves.length; i++)
	{
		var current = sLeaves[i];
		if(nextLeaf(sTree,current).length)
		{
			var next = nextLeaf(sTree,current)[0];
			if(mutualNonCommand(sTree,current,next) && sharePhi(pTree,current,next))
			{
				vcount++;
			}
		}
	}
	return vcount;
};

function splitNMCmin(sTree,pTree)
{
	var vcount = 0;
	var sLeaves = getLeaves(sTree);
	for(var i = 0; i < sLeaves.length; i++)
	{
		var current = sLeaves[i];
		if(nextLeaf(sTree,current).length)
		{
			var next = nextLeaf(sTree,current)[0];
			if(mutualNonCommand(sTree,current,next) && phiMates(pTree,current,next))
			{
				vcount++;
			}
		}
	}
	return vcount;
};/********************
* Some implementations of EqualSisters (Myrberg 2013)
* Myrberg introduces this constraint but doesn't actually define 
* how to count violations if there are more than 2 sisters.
* TODO does the degree of prosodic inequality make a difference to the severity of the violation?
*********************/

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

function exhaust1(s, ptree){
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
			vcount += exhaust1(s, child);
		}
		return vcount;
	}
};
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
            if(node.accent==='a' || node.accent === 'A'){
                spreadLow = true;
            }
            
            /* spreadLow will be true if no phi or iota left edge intervenes
               between the last accented word and the current word
            */ 
            else if(spreadLow && (node.accent==='u' || node.accent==='U')){
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
    if(!node.accent)
        node.accent = node.id.split('_')[0];
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


//TODO: what about null syntactic terminals?? these need to be filtered out of the syntactic input?? write this function later.

function matchSP(sParent, pTree, sCat, options)
/*Assign a violation for every syntactic node of type sCat in sParent that
* doesn't have a  corresponding prosodic node in pTree, where "corresponding"
* is defined as: dominates all and only the same terminals, and has the
* corresponding prosodic category.
* By default, assumes no null syntactic terminals.
* options = {requireLexical: true/false, requireOvertHead: true/false}
* For non-lexical XPs to be ignored, they should be given an attribute func: true.
* For silently-headed XPs to be ignored, they should be given an attribute silentHead: true
*/
{
	options = options || {};
	markMinMax(sParent);

	if(sParent.cat === sCat)
		logreport.debug("\tSeeking match for "+sParent.id + " in tree rooted in "+pTree.id);
	var vcount = 0;

	/*sParent needs to be matched only if it fulfills the following conditions:
	*  - it has the right category
	*  - either it is lexical (sParent.func is false) OR requireLexical is false
	*  - either it has an overt head (sParent.silent is false) OR requireOvertHead is false
	*/
	if(sParent.cat === sCat
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
	markMinMax(pTree);
	if(catsMatch(sNode.cat, pTree.cat)
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

function matchSP_LexicalHead(stree, ptree, cat){
	return matchSP(stree, ptree, cat, {requireLexical:true});
}

function matchSP_OvertHead(stree, ptree, cat){
	return matchSP(stree, ptree, cat, {requireOvertHead:true});
}

function matchSP_OvertLexicalHead(stree, ptree, cat){
	return matchSP(stree, ptree, cat, {requireOvertHead: true, requireLexical:true});
}


/* Match-SP(scat-max, pcat-max): Assign a violation for every node of syntactic
 * category s that is not dominated by another node of category s in the
 * syntactic tree, and is not mapped to a corresponding prosodic node of
 * category p, where p=catMap(s), such that p is not dominated by another node
 * of category p.
 * ex. Match a maximal xp with a maximal phi.
 */

function matchMaxSP(sTree, pTree, sCat){
	return matchSP(sTree, pTree, sCat, {maxSyntax: true, maxProsody: true});
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

//Match Maximal P --> S
//Switch inputs for PS matching:
function matchMaxPS(sTree, pTree, pCat){
	return matchPS(pTree, sTree, pCat, {maxSyntax: true, maxProsody: true});
}

//Match P --> S version of matchMaxSyntax. See comment there for explanation
function matchMaxProsody(sTree, pTree, pCat){
	return matchMaxSyntax(pTree, sTree, pCat, {maxSyntax: true});
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
function noShift(stree, ptree, cat){
    //Get lists of terminals
    
    var sleaves = getLeaves(stree);
    var pleaves = getLeaves(ptree);
    var sorder = new Array(sleaves.length);
    var porder = new Array(pleaves.length);

    if(sleaves.length != pleaves.length){
        throw new Error("NoShift problem: The stree and ptree have different numbers of terminals!");
    }

    for(var i in sleaves){
        sorder[i] = sleaves[i].id;
        porder[i] = pleaves[i].id;
    }
    //for the gradient version, we may want to use parenthesize tree for this, but we'll worry about that later.

    //counter
    var j = 0;
    //flag for whether a shift in order has been detected
    var shiftFound = false;

    while(!shiftFound && j<sorder.length){
        var x = sorder[j];
        // establish lists of x precedes
        var y = sorder.slice(j+1, sorder.length);
        var px = porder.indexOf(sorder[j]);
        var z = porder.slice(px+1, porder.length);

        //if y has more elements than z, y can't possibly be a subset of z
        if(y.length > z.length){
            shiftFound = true;
        }

        //otherwise, y may or may not be a subset of z
        var k = 0;
        while(k<sorder.length){
            if(porder.indexOf(sorder[k])<0){
                shiftFound = true;
            }
            k++;
        }

        //increment outer counter and check the next word
        j++;
    }
    return shiftFound ? 1 : 0;
}/****************
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
				child itself, and add that number to the violatin count. This is where
				violations are actually incured.
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
function isMinimal(node){
	var cat = node.cat;
	var isMin = true;
	//If the node is a leaf, it's minimal.
	if(!node.children || !node.children.length)
		return isMin;
	//Otherwise, we have to look at its children to determine whether it's minimal.
	var i = 0;
	var chil = node.children;
	while(isMin && i<chil.length){
		if(chil[i].cat===cat)
			isMin = false;
		i++;
	}
	return isMin;
}

/*
Returns true even if parent.cat is of a higher level than child.cat
(i.e, assumes layering)
To be revised!!!
For the long run, Ozan suggests pre-processing trees to mark every node as minimal/maximal.
*/
function isMaximal(parent, child){
	if(parent.cat===child.cat)
		return false;
	else return true;
}

// Move this to the prosodic hierarchy file probably?
var sCat = ["cp", "xp", "x0"];

/* Function that takes a tree and labels all the nodes in the tree as being
 * a minimal or maximal instance of whatever category k they are, where:
 * minimal = does not dominate any nodes of category k
 * maximal = is not dominated by any nodes of category k
 * and layering is assumed (a node of category level k will never be dominated
 * by a node of category < k).
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
 * 7/29/19 refactor of an earlier version
 */

function markMinMax(mytree){
	/* If parentCat property is not already defined for this node, it is probably
	 * the root node. Non-root nodes get the property parentCat when this node's
	 * children are marked below.
	 */
	if (!mytree.hasOwnProperty('parentCat')){
		mytree.parentCat = "is root"; //marks the root node
	}

	//mark maximal nodes
	mytree.isMax = (mytree.cat !== mytree.parentCat);

	//mark minimality (relies on isMinimal above)
	mytree.isMin = isMinimal(mytree);

	if(mytree.children && mytree.children.length){
		for(var i = 0; i < mytree.children.length; i++){
			var child = mytree.children[i];
			child.parentCat = mytree.cat; // set the property parentCat
			mytree.children[i] = markMinMax(mytree.children[i]);
		}
	}
	return mytree;
}
/* Assign a violation for every node whose leftmost daughter constituent is of type k
*  and is lower in the prosodic hierarchy than its sister constituent immediately to its right: *(Kn Kn-1)
*  Elfner's StrongStart.
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

		if((leftmostCat === k) && (pCat.isLower(leftmostCat, sisterCat)))
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

/* Assign a violation for every node of category cat whose leftmost daughter constituent
*  and is lower in the prosodic hierarchy than its sister constituent immediately to its right.
*  (intuitive strong start, according to the intuition of Bellik & Kalivoda 2019)
*/

function strongStart(s, ptree, cat){

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	if(ptree.cat === cat && ptree.children.length>1){		
		var leftmostCat = ptree.children[0].cat;
		var sisterCat = ptree.children[1].cat;
		
		//console.log(leftmostCat);
		//console.log(sisterCat);
		//console.log(pCat.isLower(leftmostCat, sisterCat));

		if(pCat.isLower(leftmostCat, sisterCat))
		{
			vcount++;
		}
	}
	
	// Recurse
	for(var i=0; i<ptree.children.length; i++){
		child = ptree.children[i];
		vcount += strongStart(s, child, cat);
	}
	
	return vcount;
}

/* Assign a violation for every node of category cat whose leftmost daughter constituent
*  and is lower in the prosodic hierarchy than its sister constituent immediately to its right.
*  Sensitive to whether nodes are (non)minimal: phi min is lower than phi non-min
*  Not sensitive to the category of the parent.
*  (Van Handel's strongStart from SPOT2 2019)
*/

function strongStart_Elfner_SubCat(s, ptree, cat){
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
		vcount += strongStart_Elfner_SubCat(s, child, cat);
	}
	
	return vcount;
}

/* Assign a violation for every node of category cat whose leftmost daughter constituent
*  is of category < w (a syllable or foot).
*  (proposed by Bennett, Elfner & McCloskey 2016 on Irish clitic placement)
*/
function strongStartClitic(s, ptree, cat){

	//base case: ptree is a leaf or only has one child
	if(!ptree.children){
		return 0;
	}
	
	var vcount = 0;
	
	if(ptree.cat === cat && ptree.children.length>1){		
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
}/*KEY FOR REPRESENTATIONS
	
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
/* Built-in Analyses */

//Template for built in analyses
function my_built_in_analysis(){
  //Set up a built-in analysis in just a few easy steps
  /* Step 1: copy and rename this function, create a button that calls your
   * function in interface1.html
   */
  //Step 2: Define the constraint set. Use the following as an example
  built_in_con([{name: "matchSP", cat:"xp"}, {name: "strongStart_Elfner", cat: "w"}, {name: "binMinBranches", cat: "phi"}, {name: "binMaxBranches", cat: "phi"}]);
  //shows the tree UI
  document.getElementById("treeUI").style.display = "block";
  //Step 3: replace "myTreeHere" with your syntax tree(s). See also built-in_trees.js
  document.getElementById("stree-textarea").value = JSON.stringify(myTreeHere);
  // Step 4: (optional) If you want to annotate your tableaux with tones,
  //uncomment this block:
  /*
  var toneCheckbox = document.getElementById("annotatedWithTones");
  toneCheckbox.checked = true;
  console.log(toneCheckbox.checked);
  var toneButtons = toneCheckbox.parentNode.parentNode.getElementsByTagName("input");
  for(var x = 0; x < toneButtons.length; x++){
    toneButtons[x].parentNode.setAttribute("style", "display: table-cell");
    if(toneButtons[x].value==="addIrishTones_Elfner"){
      toneButtons[x].checked =  "checked";
    }
    else if (toneButtons[x] !== toneCheckbox){
      //we don't want multiple radio buttons to be checked, it gets confusing
      //this isn't doing what it is supposed to, I don't know why -Max 10/10/19
      toneButtons[x].checked = false;
      //toneButtons[x].removeAttribute("checked");
    }
  */
}

//Irish, as analysed in Elfner (2012), with some useful trees
function built_in_Irish(){
  //constraint set for built-in analysis
  built_in_con([{name: "matchSP", cat:"xp"}, {name: "strongStart_Elfner", cat: "w"}, {name: "binMinBranches", cat: "phi"}, {name: "binMaxBranches", cat: "phi"}]);
  //show the tree UI
  document.getElementById("treeUI").style.display = "block";
  //insert specified input to tree UI
  document.getElementById("stree-textarea").value = JSON.stringify(irish_trees);
  //exhaustivity options
  var exhaustivityBox = document.getElementById("exhaustivityBox");
  exhaustivityBox.checked = "checked";
  var exhaustivityDetail = exhaustivityBox.parentNode.parentNode.getElementsByTagName("td");
  for (var x = 0; x < exhaustivityDetail.length; x++){
    exhaustivityDetail[x].setAttribute("style", "display: table-cell");
  }

  //document.getElementById("exhaustivityDetailRow").style.display = "block";
  //some stuff for tones
  var toneCheckbox = document.getElementById("annotatedWithTones");
  toneCheckbox.checked = true;
  console.log(toneCheckbox.checked);
  var toneButtons = toneCheckbox.parentNode.parentNode.getElementsByTagName("input");
  for(var x = 0; x < toneButtons.length; x++){
    toneButtons[x].parentNode.setAttribute("style", "display: table-cell");
    if(toneButtons[x].value==="addIrishTones_Elfner"){
      toneButtons[x].checked =  "checked";
    }
    else if (toneButtons[x] !== toneCheckbox){
      //we don't want multiple radio buttons to be checked, it gets confusing
      //this isn't doing what it is supposed to, I don't know why -Max 10/10/19
      toneButtons[x].checked = false;
      //toneButtons[x].removeAttribute("checked");
    }
  }
}

/* Function to check all of the boxes for a buil-in constaint set in the UI
 * takes an array of objects with the properties "name" and "cat"
 * "name" is the name of a constraint as it is called in SPOT (ie "alignLeft")
 * "cat" is the category which that constraint should be called on (ie "xp")
*/
function built_in_con(input){
  //all of the fieldsets, which contain the constraint inputs
  var conFields = document.getElementsByTagName("fieldset");
  //for the constraint table rows which hide the category options
  var con_trs;
  //for the constraint and category checkboxes
  var con_boxes;

  //iterate over the inputs
  for(var i = 0; i < input.length; i++){
    //iterate over the fieldsets
    for(var x = 0; x < conFields.length; x++){
      //get all of the table rows in this fieldset
      con_trs = conFields[x].getElementsByTagName("tr");
      //iterate over the table rows in this fieldset
      for(var y = 0; y < con_trs.length; y++){
        //get checkboxes in this table row
        con_boxes = con_trs[y].getElementsByTagName("input");
        //check if constraint is in the current slot if the input
        //assumes that constraint is the first checkbox
        if(con_boxes[0].value === input[i].name){
          //select the constraint
          con_boxes[0].checked =  "checked";
          //open the fieldset
          conFields[x].setAttribute("class", "open")
          //reveal the categories
          con_trs[y].setAttribute("class", "constraint-checked")
          //iterate over the check boxes for cateogories
          //assumes that the constraint is the first check box
          for(var z = 1; z < con_boxes.length; z++){
            // select the category if the input calls for it
            if(con_boxes[z].value === input[i].cat){
              // see below comment re "checked" == "built_in"
              con_boxes[z].checked =  "built_in";
            }
            // deselect category unless already selected by built-in system
            else if(con_boxes[z].checked !== "built_in"){
              con_boxes[z].checked = false;;
              /* re "checked" == "built_in"
               * categories that have already been selected (eg. default
               * category for constraint) should be deselected, unless that
               * category has already been selected by the built-in system (ie.
               * both matchSP-xp and matchSP-x0 are desired). By setting
               * "checked" to "built_in", we can keep track of when this happens
               */
            }
          }
        }
      }
    }
  }
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

(function() {
var recNum = 0;
var terminalNum = 0;

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
	- noUnary (boolean): if true, don't create any nodes that immediately dominate only a single terminal.
	- requireRecWrapper (boolean). Formerly "requirePhiStem"
*/
window.GEN = function(sTree, words, options){
	options = options || {}; // if options is undefined, set it to an empty object (so you can query its properties without crashing things)

	/* First, warn the user if they have specified terminalCategory and/or
	 * rootCategory without specifying recursiveCategory
	 */
	 if(!options.recursiveCategory && (options.rootCategory || options.terminalCategory)){
		if(!window.confirm("You have not specified the recursive category for GEN, it will default to 'phi'.\nClick OK if you wish to continue."))
			throw new Error("GEN was canceled by user.");
	}
	/* the prosodic hierarchy should include the categories specified in
	 * options.rootCategory, options.recursiveCategory and options.terminalCategory
	 * But if they are not, the default setting code throws unhelpful errors.
	 * The finally block throws more helpful errors and alert boxes instead
	 */
	try{
		//sets the default of recursiveCategory option to "phi"
		options.recursiveCategory = options.recursiveCategory || "phi";
		//sets the default of rootCategory based on recursiveCategory
		options.rootCategory = options.rootCategory || pCat.nextHigher(options.recursiveCategory);
		//sets the default of terminalCategory based on recursiveCategory
		options.terminalCategory = options.terminalCategory|| pCat.nextLower(options.recursiveCategory);
	}
	finally{
		if(options.rootCategory && pCat.indexOf(options.rootCategory)<0){
			alert("Warning:\n"+options.rootCategory+" is not in SPOT's pre-defined prosodic hierarchy (see pCat in prosodicHierarch.js)");
			throw new Error(options.rootCategory+" is not in SPOT's pre-defined prosodic hierarchy (see pCat in prosodicHierarch.js)");
		}
		if(pCat.indexOf(options.recursiveCategory)<0){
			alert("Warning:\n"+options.recursiveCategory+" is not in SPOT's pre-defined prosodic hierarchy (see pCat in prosodicHierarch.js)");
			throw new Error(options.recursiveCategory+" is not in SPOT's pre-defined prosodic hierarchy (see pCat in prosodicHierarch.js)");
		}
		if(options.terminalCategory && pCat.indexOf(options.terminalCategory)<0){
			alert("Warning:\n"+options.terminalCategory+" is not in SPOT's pre-defined prosodic hierarchy (see pCat in prosodicHierarch.js)");
			throw new Error(options.terminalCategory+" is not in SPOT's pre-defined prosodic hierarchy (see pCat in prosodicHierarch.js)");
		}
	}

	//Warnings for adverse GEN options combinations:
	if(options.rootCategory === options.recursiveCategory && options.obeysNonrecursivity){
		console.warn("You have instructed GEN to produce non-recursive trees and to produce trees where the root node and intermediate nodes are of the same category. Some of the trees GEN produces will be recursive.");
	}
	if(options.rootCategory === options.terminalCategory && options.obeysNonrecursivity){
		console.warn("You have instructed GEN to produce non-recursive trees and to produce trees where the root node and terminal nodes are of the same category. All of the trees GEN produces will be recursive.");
	}
	if(options.recursiveCategory === options.terminalCategory && options.obeysNonrecursivity){
		console.warn("You have instructed GEN to produce non-recursive trees and to produce trees where the intermediate nodes and the terminal nodes are of the same category. You will only get one bracketing.");
	}
	if(pCat.isHigher(options.recursiveCategory, options.rootCategory) || pCat.isHigher(options.terminalCategory, options.recursiveCategory)){
		console.warn("You have instructed GEN to produce trees that do not obey layering. See pCat in prosodicHierarchy.js");
	}
	else{
		if(options.recursiveCategory !== pCat.nextLower(options.rootCategory) && options.recursiveCategory !== options.rootCategory){
			console.warn(""+options.recursiveCategory+" is not directly below "+options.rootCategory+" in the prosodic hierarchy. None of the resulting trees will be exhaustive because GEN will not generate any "+pCat.nextLower(options.rootCategory)+"s. See pCat in prosodicHierarchy.js");
		}
		if(options.terminalCategory !== pCat.nextLower(options.recursiveCategory) && options.terminalCategory !== options.recursiveCategory){
			console.warn(""+options.terminalCategory+" is not directly below "+options.recursiveCategory+" in the prosodic hierarchy. None of the resulting trees will be exhaustive because GEN will not generate any "+pCat.nextLower(options.recursiveCategory)+"s. See pCat in prosodicHierarchy.js");
		}
	}

	if(typeof words === "string") { // words can be a space-separated string of words or an array of words; if string, split up into an array
		if (!words) { // if empty, scrape words from sTree
			words = getLeaves(sTree);
			for (var i = 0; i < words.length; i++) {
				var catSuffix = '';
				if (words[i].cat == 'clitic'){
					catSuffix = '-clitic';
				}
				var accentSuffix = '';
				if(words[i].accent){
					accentSuffix = '-'+words[i].accent;
				}
				words[i] = words[i].id+catSuffix+accentSuffix;
			}
		} else {
			words = words.split(' ');
			words = deduplicateTerminals(words);
		}
	} else {
		words = deduplicateTerminals(words);
	}

	var leaves = [];
	recNum = terminalNum = 0;
	for(var i=0; i<words.length; i++){
		leaves.push(wrapInLeafCat(words[i], options.terminalCategory));
	}

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
	if(options.rootCategory !== options.recursiveCategory)
	 rootlessCand = addRecCatWrapped(gen(leaves, recursiveOptions), options);

	var candidates = [];
	for(var i=0; i<rootlessCand.length; i++){
		var pRoot = wrapInRootCat(rootlessCand[i], options);
		if (!pRoot)
			continue;
		if (options.obeysHeadedness && !obeysHeadedness(pRoot))
			continue;
		/* if (options.addTones){
			try {
				window[options.addTones](pRoot); //calls the function named in the string
				//console.log(parenthesizeTree(pRoot, {showTones: options.addTones}));
			}
			catch(err){
				if (typeof(options.addTones) == "boolean"){
					addJapaneseTones(pRoot); //backwards compatibility
					console.log("The addTones option has been updated. It now takes the name of a function as its value. Next time, try {addTones: 'addJapaneseTones'}");
				}
				else{
					throw new Error("Something isn't right with the addTones option. The value of addTones must be a string with the name of a tone function, no parentheses, eg. {addTones: 'addJapaneseTones'}. You used: "+options.addTones);
				}
			}
		} */
		candidates.push([sTree, pRoot]);
	}
	return candidates;
}

/* Function to check if a tree obeys headedness. Each node must either be be
 * terminal or have at least one child of the category immidately below its own
 * on the prosodic hierarch. Otherwise, return false. Written as a recursive
 * function, basically a constraint.
 */
function obeysHeadedness(tree){
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
			if (children[i].cat === pCat.nextLower(node.cat) 
			|| children[i].cat === node.cat){
				return true;
			}
			return false;
	}

	//outer function
	//first, check the parent node
	if (!nodeIsHeaded(tree))
		return false;
	//return false if one of the children does not obey headedness
	if (tree.children){
		for (var x = 0; x<tree.children.length; x++){
			if (!obeysHeadedness(tree.children[x])) //recursive function call
				return false;
		}
	}
	//if we get this far, the tree obeys headedness
	return true;
}

function obeysExhaustivity(cat, children) {
	for (var i = 0; i < children.length; i++)
		if (cat !== children[i].cat && pCat.nextLower(cat) !== children[i].cat){
			//console.log('violates Exhaustivity:',cat, 'next lower cat:',pCat.nextLower(cat), '; actual child cat:', children[i].cat);
			return false;
		}
	return true;
}

function wrapInRootCat(candidate, options){
	if (options && options.obeysExhaustivity){ // check that options.obeysExhaustivity is defined
		if(typeof options.obeysExhaustivity ==="boolean" && options.obeysExhaustivity && !obeysExhaustivity(options.rootCategory, candidate)){
			return null;
		}
		else if (options.obeysExhaustivity instanceof Array && options.obeysExhaustivity.indexOf(options.rootCategory)>=0 && !obeysExhaustivity(options.rootCategory, candidate)){
			return null;
		}
	}
	//if we get here, there aren't any relevant exhaustivity violations
	return {id: 'root', cat: options.rootCategory, children: candidate};
}

function wrapInLeafCat(word, cat){
	var myCat = cat || 'w';
	var wordId = word;
	var isClitic = word.indexOf('-clitic')>=0;
	if (isClitic){
		myCat = 'syll';
		wordId = wordId.split('-clitic')[0];
	}
	var wordObj = {cat: myCat};
	var accented = word.indexOf('-accented') >= 0;
	var	unaccented = word.indexOf('-unaccented') >= 0;
	if(accented){
		wordObj.accent = 'a';
		wordId = wordId.split('-accented')[0];
	}
	else if(unaccented){
		wordObj.accent = 'u';
		wordId = wordId.split('-unaccented')[0];
	}
	wordObj.id = wordId;
	return wordObj;
}

/*Conceptually, returns all possible parenthesizations of leaves that don't
*	have a set of parentheses enclosing all of the leaves
* Format: returns an array of parenthesizations, where each parenthesization
*	is an array of children, where each child is
*	either a phi node (with descendant nodes attached) or a leaf
* Options:
*/
function gen(leaves, options){
	var candidates = [];	//each candidate will be an array of siblings
	if(!(leaves instanceof Array))
		throw new Error(leaves+" is not a list of leaves.");

	//Base case: 0 leaves
	if(leaves.length === 0){
		candidates.push([]);
		return candidates;
	}

	//Recursive case: at least 1 word. Consider all candidates where the first i words are grouped together
	for(var i = 1; i <= leaves.length; i++){

		var rightsides = addRecCatWrapped(gen(leaves.slice(i, leaves.length), options), options);

		//Case 1: the first i leaves attach directly to parent (no phi wrapping)

		var leftside = leaves.slice(0,i);

		// for case 1, we don't need to check the left side for nonrecursivity, because it's all leaves

		//Combine the all-leaf leftside with all the possible rightsides that have a phi at their left edge (or are empty)
		for(var j = 0; j<rightsides.length; j++){
			if(!rightsides[j].length || rightsides[j][0].cat === options.recursiveCategory)
			{
				var cand = leftside.concat(rightsides[j]);
				candidates.push(cand);
			}
		}



		//Case 2: the first i words are wrapped in a phi
		if(i<leaves.length){
			if(options.noUnary && i<2){
				continue;
				//Don't generate any candidates where the first terminal is in a phi by itself.
			}
			var phiLeftsides = gen(leaves.slice(0,i), options);
			for(var k = 0; k<phiLeftsides.length; k++)
			{
				var phiNode = wrapInRecCat(phiLeftsides[k], options);
				if (!phiNode)
					continue;
				var leftside = [phiNode];

				for(var j = 0; j<rightsides.length; j++)
				{
					cand = leftside.concat(rightsides[j]);
					candidates.push(cand);
				}
			}
		}

	}

	return candidates;
}

function wrapInRecCat(candidate, options){
	// Check for Exhaustivity violations below the phi, if phi is listed as one of the exhaustivity levels to check
	if (options && options.obeysExhaustivity){
		if ((typeof options.obeysExhaustivity === "boolean" || options.obeysExhaustivity.indexOf(options.recursiveCategory)>=0) && !obeysExhaustivity(options.recursiveCategory, candidate))
			return null;
	}
	if (options && options.obeysNonrecursivity)
		for (var i = 0; i < candidate.length; i++)
			if (candidate[i].cat === options.recursiveCategory)
				return null;
	return {id: options.recursiveCategory+(recNum++), cat: options.recursiveCategory, children: candidate};
}

//Takes a list of candidates and doubles it to root each of them in a phi
//If options.noUnary, skip wrapInRecCating candidates that are only 1 terminal long
function addRecCatWrapped(candidates, options){
	var origLen = candidates.length;
	var result = [];
	if (!options.requireRecWrapper) {
		result = candidates;
	}
	for(var i=0; i<origLen; i++){
		var candLen = candidates[i].length;
		if(candLen) {
			if(options.noUnary && candLen == 1){
				continue;
			}
			var phiNode = wrapInRecCat(candidates[i], options);
			if (phiNode)
				result.push([phiNode]);
		}
	}
	return result;
}

})();

function containsClitic(x){
	return x.indexOf("clitic")>-1;
}

function generateWordOrders(wordList, clitic){
	if(typeof wordList === 'string'){
		var cliticTagIndex = wordList.indexOf("-clitic");
		if(cliticTagIndex > 0){
			var wordListParts = wordList.split("-clitic");
			wordList = wordListParts[0]+wordListParts[1];
		}
		wordList = wordList.split(' ');
	}
	//Find the clitic to move around
	var cliticIndex = wordList.indexOf(clitic);
	if(cliticIndex < 0)
		throw new Error("The provided clitic "+clitic+" was not found in the word list");
	//Slice the clitic out
	var beforeClitic = wordList.slice(0,cliticIndex);
	var afterClitic = wordList.slice(cliticIndex+1, wordList.length);
	var cliticlessWords = beforeClitic.concat(afterClitic);

	var orders = new Array(wordList.length);
	for(var i = 0; i <= cliticlessWords.length; i++){
		beforeClitic = cliticlessWords.slice(0,i);
		afterClitic = cliticlessWords.slice(i, cliticlessWords.length);
		orders[i] = beforeClitic.concat([clitic+"-clitic"], afterClitic);
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
function GENwithCliticMovement(stree, words, options){
	// Identify the clitic of interest
	var clitic = '';
	// First try to read words and clitic off the tree
	var leaves = getLeaves(stree);
	if(leaves.length > 0 && leaves[0].id){
		console.log(leaves);
		var leaf = 0;
		while(clitic === '' && leaf < leaves.length){
			if(leaves[leaf].cat==="clitic")
				clitic = leaves[leaf].id;
			leaf++;
		}
		if(clitic === ''){
			console.warn("GENWithCliticMovement was called but no node in stree has category clitic was provided in stree");
			console.log(stree);
			return GEN(stree, words, options);
			//throw new Error("GENWithCliticMovement was called but no node in stree has category clitic was provided in stree");

		}
	}
	//Otherwise, get the clitic from words
	else
	{
		// Make sure words is an array
		if(typeof words === "string"){
			words = words.split(' ');
		}
		var x = words.find(containsClitic);
		if(!x){ //x is undefined if no word in "words" contains "clitic"
			console.warn("GENWithCliticMovement was called but no node in stree has category clitic was provided in stree");
			console.log(stree);
			return GEN(stree, words, options);
		}
		clitic = x.split('-clitic')[0];
		words[words.indexOf(x)] = clitic;
	}

	//Make sure words is defined before using it to generate word orders
	if(!words || words.length<leaves.length){
		words = new Array(leaves.length);
		for(var i in leaves){
			words[i] = leaves[i].id;
		}
		//console.log(words);
	}
	var wordOrders = generateWordOrders(words, clitic);
	var candidateSets = new Array(wordOrders.length);
	for(var i = 0; i<wordOrders.length; i++){
		candidateSets[i] = GEN(stree, wordOrders[i], options);
	}
	//candidateSets;
	return [].concat.apply([], candidateSets);
}
var uTreeCounter = 0;
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
					rowFrags.push('<div id="treeNode-' + node.m.nodeId + '-' + node.m.treeIndex + '" class="' + nodeClasses + '" style="width: ' + pxWidth + 'px">' + stemContainer + '<div class="inputContainer"><input id="' + catInputId + '" class="catInput" type="text" value="' + node.cat + '"></input></div><div class="inputContainer"><input id="' + idInputId + '" class="idInput" type="text" value="' + node.id + '"></input></div></div>');
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

UTree.fromTerminals = function(terminalList) {
	var dedupedTerminals = deduplicateTerminals(terminalList);

	//Make the js tree (a dummy tree only containing the root CP)
	var root = {
		"id":"CP1",
		"cat":"cp",
		"children":[]
	};
	//Add the provided terminals
	for(var i=0; i<dedupedTerminals.length; i++){
		root.children.push({
			"id":dedupedTerminals[i],
			"cat":"x0"
		});
	}
	return new UTree(root);
};

function getSTrees() {
	var spotForm = document.getElementById('spotForm');
	var sTrees;
	sTrees = JSON.parse(spotForm.sTree.value);
	if (!(sTrees instanceof Array)) {
		sTrees = [sTrees];
	}
	return sTrees;

}

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
}

window.addEventListener('load', function(){

	var spotForm = document.getElementById('spotForm');

	if (!spotForm) {
		console.error('no spot form');
		return;
	}

	spotForm.addEventListener('change', function(ev) {
		var target = ev.target;
		if (target.name === 'constraints') {
			var trClassList = target.closest('tr').classList;
			if (target.checked) {
				trClassList.add('constraint-checked');
			}
			else {
				trClassList.remove('constraint-checked');
			}
		}
	});

	spotForm.onsubmit=function(e){
		if (e.preventDefault) e.preventDefault();

		//Build a list of checked constraints.
		var constraintSet = [];
		for(var i=0; i<spotForm.constraints.length; i++){
			var constraintBox = spotForm.constraints[i];
			if(constraintBox.checked){
				var constraint = constraintBox.value;
				//Figure out all the categories selected for the constraint
				if(spotForm['category-'+constraint]){
					var constraintCatSet = spotForm['category-'+constraint];
					for(var j=0; j<constraintCatSet.length; j++){
						var categoryBox = constraintCatSet[j];
						if(categoryBox.checked){
							var category = categoryBox.value;
							constraintSet.push(constraint+'-'+category);
						}
					}
				}
				else
					constraintSet.push(constraint);
			}
		}
		//console.log(constraintSet);
		//Get the input syntactic tree.
		var sTrees;
		try{
			sTrees = getSTrees();
		}
		catch(e){
			console.error(e);
			alert(e.message);
			return;
		}

		//Get input to GEN.
		var pString = spotForm.inputToGen.value;

		//Build a list of checked GEN options.
		var genOptions = {};
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

		var genTones = false; //true if tones are selected

		if(document.getElementById("annotatedWithTones").checked){
			//from radio group near the bottom of spotForm
			genOptions.addTones = spotForm.toneOptions.value;
			genTones = spotForm.toneOptions.value;
			//console.log(genOptions);
		}
		console.log(genOptions);
		console.log(GEN({},'a b',{'noUnary':true}));
		var csvSegs = [];
		for (var i = 0; i < sTrees.length; i++) {
			var sTree = sTrees[i];
			if (genOptions['cliticMovement']){
				var candidateSet = GENwithCliticMovement(sTree, pString, genOptions);
			}
			else{
				var candidateSet = GEN(sTree, pString, genOptions);
			}
			

			//Make the violation tableau with the info we just got.
			var tabl = makeTableau(candidateSet, constraintSet, {showTones: genTones});
			csvSegs.push(tableauToCsv(tabl, ',', {noHeader: i}));
			writeTableau(tabl);
			revealNextSegment();
		}

		saveTextAs(csvSegs.join('\n'), 'SPOT_Results.csv');

		function saveAs(blob, name) {
			var a = document.createElement("a");
			a.display = "none";
			a.href = URL.createObjectURL(blob);
			a.download = name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}

		function saveTextAs(text, name) {
			saveAs(new Blob([text], {type: "text/csv", encoding: 'utf-8'}), name);
		}

		return false;
	};
	//show/hide the tree code area
	document.getElementById('tree-code-box').addEventListener('click', function(){
		if (document.getElementById('tree-code-area').style.display === 'none' && document.getElementById('tree-code-box').checked){
			document.getElementById('tree-code-area').style.display = 'block';
		}
		else{
			document.getElementById('tree-code-area').style.display = 'none';
		}
	});
	document.getElementById('exhaustivityBox').addEventListener('click', function(){
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
	});

	//show extra boxes for annotated with tones on click
	//console.log(document.getElementById('annotatedWithTones'))
	document.getElementById('annotatedWithTones').addEventListener('click', function(){
		if (document.getElementById('japaneseTones').style.display === 'none' && document.getElementById('annotatedWithTones').checked){
			document.getElementById('japaneseTones').style.display = 'table-cell';
			document.getElementById('irishTones').style.display = 'table-cell';
		}
		else{
			document.getElementById('japaneseTones').style.display = 'none';
			document.getElementById('irishTones').style.display = 'none';
			//if (genOptions['usesTones']){
			//	genOptions['usesTones'] = false;
			//}
		}

	});


	/*
	document.getElementById("japaneseTonesInfo").addEventListener("click", toneInfoBlock("japanese"));
	document.getElementById("irishTonesInfo").addEventListener("click", toneInfoBlock("irish"));
	*/

	//Code for generating the JS for a syntactic tree
	var treeTableContainer = document.getElementById('treeTableContainer');

	//Open the tree making GUI
	document.getElementById('goButton').addEventListener('click', function(){
		document.getElementById('treeUI').style.display = 'block';
	});

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

	//Set up the table...
	document.getElementById('goButton').addEventListener('click', function(){
		// Get the string of terminals
		var terminalString = spotForm.inputToGen.value;
		var terminalList = terminalString.trim().split(/\s+/);

		//Make the js tree (a dummy tree only containing the root CP)
		var tree = UTree.fromTerminals(terminalList);
		treeTableContainer.innerHTML += tree.toHtml();
		refreshNodeEditingButtons();

		document.getElementById('treeUIinner').style.display = 'block';
	});

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

	//Look at the html tree and turn it into a JSON tree. Put the JSON in the following textarea.
	document.getElementById('htmlToJsonTreeButton').addEventListener('click', function(){
		spotForm.sTree.value = JSON.stringify(Object.values(treeUIsTreeMap).map(function(tree) {
			return JSON.parse(tree.toJSON()); // bit of a hack to get around replacer not being called recursively
		}), null, 4);
	});

	document.getElementById('danishJsonTreesButton').addEventListener('click', function() {
		spotForm.sTree.value = JSON.stringify(danishTrees(), null, 4);
	});

	treeTableContainer.addEventListener('input', function(e) {
		var target = e.target;
		var idPieces = target.id.split('-');
		var treeIndex = idPieces[2];
		var nodeId = idPieces[1];
		var isCat = idPieces[0] === 'catInput';
		treeUIsTreeMap[treeIndex].nodeMap[nodeId][isCat ? 'cat' : 'id'] = target.value;
	});

	function refreshNodeEditingButtons() {
		var hasSelection = treeTableContainer.getElementsByClassName('selected').length > 0;
		var buttons = document.getElementsByClassName('nodeEditingButton');
		for (var i = 0; i < buttons.length; i++) {
			buttons[i].disabled = !hasSelection;
		}
	}

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

	document.getElementById('treeUImakeParent').addEventListener('click', function() {
		var nodes = getSelectedNodes();
		try {
			treeUIsTreeMap[nodes[0].m.treeIndex].addParent(nodes);
			refreshHtmlTree();
		} catch (err) {
			console.error(err);
			alert('Error, unable to add daughter: ' + err.message);
		}
	});

	document.getElementById('treeUIdeleteNodes').addEventListener('click', function() {
		var nodes = getSelectedNodes();
		if (nodes) {
			var treeIndex = nodes[0].m.treeIndex;
			for (var i = 1; i < nodes.length; i++) {
				if (nodes[i].treeIndex != treeIndex) {
					alert('Attempting to delete nodes from multiple trees. Please delete nodes one tree at a time.');
					return;
				}
			}
		}
		var tree = treeUIsTreeMap[treeIndex];
		for (var i = 0; i < nodes.length; i++) {
			tree.deleteNode(nodes[i]);
		}
		refreshHtmlTree(treeIndex);
	});

	document.getElementById('treeUIclearSelection').addEventListener('click', function() {
		var elements = treeTableContainer.getElementsByClassName('selected');
		for (var i = elements.length-1; i >= 0; i--) {
			elements[i].classList.remove('selected');
		}
		refreshNodeEditingButtons();
	});

	document.body.addEventListener('click', function(event) {
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
	});
});

function toneInfoBlock(language){
	var content = document.getElementById("tonesInfoContent");
	var japaneseContent = "Tokyo Japanese: the left edge of phi is marked with a rising boundary tone (LH), accented words receive an HL on the accented syllable, and H tones that follow a pitch drop (HL) within the maximal phi are downstepped (!H). (See: Pierrehumbert and Beckman 1988; Gussenhoven 2004; Ito and Mester 2007) Accents, boundary tones, and downstep in Lekeitio Basque are realized with the same tones as in Tokyo Japanese.";
	var irishContent = "Conamara Irish (Elfner 2012): The left edge of the non-minimal phi is marked with a rising boundary tone (LH), and the right edge of every phi is marked with a falling boundary tone (HL).";
	if (language == "japanese"){
		if (content.innerHTML == japaneseContent){
			content.innerHTML = '';
		}
		else{
			content.innerHTML = japaneseContent;
		}
	}
	if (language === "irish"){
		if (content.innerHTML == irishContent){
			content.innerHTML = '';
		}
		else {
			content.innerHTML = irishContent;
		}
	}
}
if (!Element.prototype.matches)
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
		};//An array of pairs to define which syntactic categories "match" which prosodic categories.
//For theory comparison, we'll want one array for each theory.
var categoryPairings = {
	"clause": "i",
	"cp": "i",
	"xp": "phi",
	"x0": "w"
};


//Evaluates whether two nodes have corresponding categories.
function catsMatch(aCat, bCat){
	if(aCat === undefined && bCat === undefined)
		return true;	//vacuously true if both nodes are leaves (with no category)
	else if(categoryPairings.hasOwnProperty(aCat))
		return categoryPairings[aCat] === bCat;
	else if(categoryPairings.hasOwnProperty(bCat))
		return categoryPairings[bCat] === aCat;
	else
	{
		//console.warn("Neither argument to catsMatch was a valid syntactic category:", aCat, bCat);	//TODO this gives a false positive warning every time Match PS runs on a tree whose leaves don't have categories.
		return false;
	}
}



//defines the prosodic hierarchy
var pCat = ["u", "i", "phi", "w", "Ft", "syll"];

//Function that compares two prosodic categories and returns whether cat1 is higher in the prosodic hierarchy than cat2
pCat.isHigher = function (cat1, cat2){
	return (pCat.indexOf(cat1) < pCat.indexOf(cat2));
}

// Function that compares two prosodic categories and returns true if cat 1 is lower in the prosodic hierarchy than cat2
pCat.isLower = function (cat1, cat2){
	return (pCat.indexOf(cat1) > pCat.indexOf(cat2));
}

// Function that returns the prosodic category that is one level lower than the given category
pCat.nextLower = function(cat) {
	var i = pCat.indexOf(cat);
	if (i < 0)
		throw new Error(cat + ' is not a prosodic category');
	return pCat[i+1];
}

//function that returns the prosodic category that is one level higher than the given category
pCat.nextHigher = function(cat){
	var i = pCat.indexOf(cat);
	if (i < 0)
		throw new Error(cat + ' is not a prosodic category');
	if (i === 0){
		console.error(cat + ' is the highest prosodic category');
		return cat;
	}
	return pCat[i-1];
}

//pCat(type1).isHigherThan(type2)

function nodeHasLowerCat(node1, node2){
	if(pCat.isLower(node1.cat, node2.cat)){
		return true;
	}
	else if(node1.cat===node2.cat && isMinimal(node1) && !isMinimal(node2)){
		return true;
	}
	else return false;
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
    // if no matching category is found, return a costum error.
    if (!propFound){
      throw(new Error("" + cat + " is not a category defined in categoryPairings (see main/prosodicHierarchy.js)"));
    }
  }
}

var lastSegmentId = 0, nextSegmentToReveal = 0;


var logLines = [];
function logreport(line){
    logLines.push(['<span class="report-line segment-', lastSegmentId, (lastSegmentId >= nextSegmentToReveal) ? ' segment-hidden' : '', '">', line, '<br></span>'].join(''));
    flushLog();
}
logreport.debug = function() {
    if (logreport.debug.on)
        return logreport.call(this, Array.prototype.slice.call(arguments));
}
logreport.debug.on = true;

var resultsContainer;
function flushLog() {
    if (resultsContainer) {
        var fragment = document.createElement('div');
        fragment.innerHTML = logLines.join('');
        resultsContainer.appendChild(fragment);
        logLines = [];
    } else {
        console.error('Tried to flush log before window loaded.');
    }
}

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

// Produces an array of arrays representing a tableau
// Options: GEN options and options for parenthesize trees

function makeTableau(candidateSet, constraintSet, options){
	//all options passed to makeTableau are passed into parenthesizeTree, so make
	//sure your options in dependent functions have unique names from other funcs
	options = options || {};
	var tableau = [];
	//Make a header for the tableau, containing all the constraint names.
	//First element is empty, to correspond to the column of candidates.
	var sTree = candidateSet[0] ? candidateSet[0][0] : '';
	if (sTree instanceof Object) {
		var sOptions = {}; //must not include tone options
		for (var op in options){
			if (op != "showTones" && op != "addTones"){
				sOptions[op] = options[op]; //don't copy in tone options
			}
		}
		sTree = parenthesizeTree(sTree, sOptions); //JSON.stringify(sTreeName);
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
			var options = Object.getOwnPropertyNames(optionObj); 
			for(var j in options){
				if(optionObj[options[j]]==true){
					var temp = options[j];
					if(temp.indexOf('require')>=0){
						temp = temp.slice('require'.length);
					}
					optionString += '-'+temp;
				}
			}
		} 
		var constraintOptionsCat = conParts[0]+optionString+'('+conParts[1]+')';
		header.push(constraintOptionsCat);
	}
	tableau.push(header);

	var getCandidate = options.inputTypeString ? function(candidate) {return candidate;} : globalNameOrDirect;

	//Assess violations for each candidate.
	for(var i = 0; i < candidateSet.length; i++){
		var candidate = candidateSet[i];
		var ptreeStr = options.inputTypeString ? candidate[1] : parenthesizeTree(globalNameOrDirect(candidate[1]), options);
		var tableauRow = [ptreeStr];
		for(var j = 0; j < constraintSet.length; j++){

			var [constraint, cat, conOptions] = constraintSet[j].split('-');
			if(!conOptions){
				conOptions = "{}";
			}
			//var numViolations = runConstraint(constraintAndCat[0], candidate[0], candidate[1], constraintAndCat[1]); ++lastSegmentId; // show log of each constraint run
			var oldDebugOn = logreport.debug.on;
			logreport.debug.on = false;
			var numViolations = globalNameOrDirect(constraint)(getCandidate(candidate[0]), getCandidate(candidate[1]), cat, JSON.parse(conOptions)); logreport.debug.on = oldDebugOn; // don't show the log of each constraint run
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
	if (!(tableau instanceof Array))
		return '';
	var htmlChunks = ['<table class="tableau"><thead><tr>'];
	var headers = tableau[0] || [];
	htmlChunks.push('<th></th>');
	for (var j = 0; j < headers.length; j++) {
		htmlChunks.push('<th>');
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
	"Ft": ["", ""],
	"u": ["{u ", "}"]
};

/* Function that takes a [default=prosodic] tree and returns a string version where phi boundaries are marked with '(' ')'
   Possible options:
   - invisibleCategories: by default, every category in categoryBrackets gets a bracket
   - parens: default mappings in categoryBrackets can be overwritten with a map
   - showNewCats: if true, annotate categories that aren't found in categoryBrackets with [cat ], where cat is the new category
   - showTones: set to addJapaneseTones, addIrishTones_Elfner, etc. to annotate the tree with appropriate tones and show them in its parenthesization
*/
function parenthesizeTree(tree, options){
	var parTree = [];
	var toneTree = [];
	options = options || {};
	var showNewCats = options.showNewCats || false;
	var invisCats = options.invisibleCategories || [];
	var showTones = options.showTones || false;
	var parens = options.parens || Object.assign({}, categoryBrackets);

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
				parTree.push(parens[node.cat][0]);//pushes the right parens
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
				//parTree.push(parens[1]);
				if(showTones){
					toneTree.push(parens[node.cat][1]);
					//console.log(parens[node.cat]);
					//console.log(toneTree[toneTree.length-1]);
				}
			}
		} else if (visible) {
			parTree.push(node.id);
			if(node.cat!='w' && node.cat!='x0'){
				parTree.push('.'+node.cat);
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
