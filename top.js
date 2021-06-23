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
	 * addRecCatWrapped because half of the candidates will have a root node with
	 * only one child, which will be of the same category, ie. {i {i (...) (...)}}
	 */
	var rootlessCand = gen(leaves, recursiveOptions)
	if(options.rootCategory !== options.recursiveCategory){
		rootlessCand = addRecCatWrapped(gen(leaves, recursiveOptions), options);
	}

	var candidates = [];
	for(var i=0; i<rootlessCand.length; i++){
		var pRoot = wrapInRootCat(rootlessCand[i], options);
		if (!pRoot)
			continue;
		if (options.obeysHeadedness && !obeysHeadedness(pRoot))
			continue;
		
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

	if(candidate.length < 2 && options.rootCategory === candidate[0].cat){
		return null;
	}
	//if we get here, there aren't any relevant exhaustivity violations
	return {id: 'root', cat: options.rootCategory, children: candidate};
}

/*Conceptually, returns all possible parenthesizations of leaves that don't
*	have a set of parentheses enclosing all of the leaves
* Format: returns an array of parenthesizations, where each parenthesization
*	is an array of children, where each child is
*	either a node of category recursiveCategory (with descendant nodes attached) 
*	or a leaf (of category terminalCategory)
* Options:
*/
function gen(leaves, options){
	
	var candidates = [];	//each candidate will be an array of siblings
	var cand;
	if(!(leaves instanceof Array))
		throw new Error(leaves+" is not a list of leaves.");

	//Base case: 0 leaves
	if(leaves.length === 0){
		candidates.push([]);
		return candidates;
	}

	//Recursive case: at least 1 terminal. Consider all candidates where the first i words are grouped together
	for(var i = 1; i <= leaves.length; i++){

		//First, create the right sides:
		var rightLeaves = leaves.slice(i, leaves.length);
		
		//recursion at top level
		//var test_output = gen(rightLeaves,options);
		var rightsides = addRecCatWrapped(gen(rightLeaves, options), options);
		/*if(options.noUnary){
			//console.log("gen:",test_output);
			//console.log("rightsides:",rightsides);
		};*/
		//recursion at lower levels
		if(pushRecCat(options)){
			var wRightsides = addRecCatWrapped(gen(rightLeaves, options), options);
			rightsides.concat(wRightsides);
			popRecCat(options);
		}
		
		

		//Then create left sides and combine them with the right sides.

		//Case 1: the first i leaves attach directly to parent (no wrapping in a recursive category)
		var leftside = leaves.slice(0,i);

		// We don't need to check the left side for nonrecursivity, because it's all leaves

		//Combine the all-leaf leftside with all the possible rightsides that have a phi at their left edge (or are empty)
		for(var j = 0; j<rightsides.length; j++){
			var currRightside = rightsides[j];
			var firstRight = currRightside[0];
			if(!currRightside.length || (firstRight.children && firstRight.children.length) || (firstRight.cat != options.terminalCategory && !isLower(pCat, firstRight.cat, options.terminalCategory)))
			{
				cand = leftside.concat(currRightside);
				candidates.push(cand);
			}
		}

		


		
		if(i<leaves.length){
			if(options.noUnary && i<2){
				continue;
				//Don't generate any candidates where the first terminal is in an intermediate level node by itself.
			}

			//Case 2: the first i words are wrapped in an intermediate level node
			//Case 2a: first recursive category
			var phiLeftsides = gen(leaves.slice(0,i), options);
			for(var k = 0; k<phiLeftsides.length; k++)
			{
				var phiNode = wrapInRecCat(phiLeftsides[k], options);
				if (!phiNode){
					continue;
				}
				var leftside = [phiNode];

				for(var j = 0; j<rightsides.length; j++)
				{
					cand = leftside.concat(rightsides[j]);
					candidates.push(cand);
				}
			}

			//Case 3
			//Try to build left-sides that are wrapped in the next lower recursive category but aren't wrapped in the current recursive category
			if(pushRecCat(options)){
				var wLeftsides = gen(leaves.slice(0,i), options);
				for(var k = 0; k<wLeftsides.length; k++){
					var wLeftside = wrapInRecCat(wLeftsides[k], options);
					if(wLeftside){
						//console.log(i, "wLeftside:", wLeftside);
						//Combine the all-leaf leftside with all the possible rightsides that aren't empty
						for(var j = 0; j<rightsides.length; j++){
							if(rightsides[j].length)
							{
								cand = [wLeftside].concat(rightsides[j]);
								candidates.push(cand);
							}
						}
					}
				}
				popRecCat(options);	
			}
 
		}

	}

	//Now try to use recursion at the next recursive category
	if (pushRecCat(options)) {
		
		var wCands = gen(leaves, options);
		
		//Add things that are entirely wrapped in [ ]
		for (var i = 0; i < wCands.length; i++) {
			cand = wCands[i];
			var wrappedCand = wrapInRecCat(cand, options);
			
			if(wrappedCand)
				candidates.push([wrappedCand]);
		} 
		
		popRecCat(options);
	} 


	return candidates;
}

function wrapInRecCat(candidate, options){
	// Check for Exhaustivity violations below the phi, if phi is listed as one of the exhaustivity levels to check
	if (options && options.obeysExhaustivity){
		if ((typeof options.obeysExhaustivity === "boolean" || options.obeysExhaustivity.indexOf(options.recursiveCategory)>=0) && !obeysExhaustivity(options.recursiveCategory, candidate))
			return null;
	}
	if (options && options.obeysNonrecursivity){
		for (var i = 0; i < candidate.length; i++)
			if (candidate[i].cat === options.recursiveCategory){
				return null;
			}
	}
	if (options && options.noUnary && candidate.length === 1){
		return null;
	}			

	// Don't wrap anything in a recursive category that is already wrapped in one
	if (candidate.length === 1 && (candidate[0] && candidate[0].cat === options.recursiveCategory)){
		if(candidate[0].cat==='phi')
			console.log("wrapInRecCat", options.recursiveCategory, candidate);
		//console.log("Not wrapping ", candidate);
		return null;
	}
	return {id: options.recursiveCategory+(options.counters.recNum++), cat: options.recursiveCategory, children: candidate};
}

//Takes a list of candidates and doubles it to root each of them in a phi
//If options.noUnary, skip wrapInRecCat-ing candidates that are only 1 terminal long
function addRecCatWrapped(candidates, options){
	var origLen = candidates.length;
	var result = [];
	if (!options.requireRecWrapper) {
		result = candidates;
	}
	for(var i=0; i<origLen; i++){
		var candLen = candidates[i].length;
		if(candLen) {
			
			var phiNode = wrapInRecCat(candidates[i], options);
			if (phiNode){
				result.push([phiNode]);
			}
			
		}
	}
	return result;
}

//Move to the next recursive category, if there is one.
function pushRecCat(options){
	var nextIndex = options.recursiveCatIndex + 1;
	if(nextIndex > options.recursiveCats.length-1){
		return false;
	}
	else{
		var nextRecCat = options.recursiveCats[nextIndex];
		options.recursiveCategory = nextRecCat;
		options.recursiveCatIndex = nextIndex;
		return true;
	}
	 
}

//Move to the previous recursive category, if there is one.
function popRecCat(options){
	var prevIndex = options.recursiveCatIndex - 1;
	if(prevIndex < 0){
		return false;
	}
	else{
		var prevRecCat = options.recursiveCats[prevIndex];
		options.recursiveCategory = prevRecCat;
		options.recursiveCatIndex = prevIndex;
		return true;
	}
}


})();
/* Takes a list of words and returns the candidate set of trees (JS objects)
   Options is an object consisting of the parameters of GEN. Its properties can be:
   - obeysExhaustivity (boolean or array of categories at which to require conformity to exhaustivity)
   - obeysHeadedness (boolean)
   - obeysNonrecursivity (boolean)
	 - rootCategory (string)
	 - recursiveCategory (string) --> '-' separated list of categories, from highest to lowest (e.g. 'phi-w', not 'w-phi')
	 	-> saved in recursiveCats (see below) + becomes a string rep of the current recursive category
	 - terminalCategory (string)

	 - recursiveCatIndex (int): tracks which recursive category we're currently using
	 - recursiveCats (list of strings): list of recursive categories to use
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
	
	//Set the relevant category hierarchy (syntactic or prosodic) based on the GEN option syntactic
	var categoryHierarchy = options.syntactic ? sCat : pCat;
	var defaultRecCat = options.syntactic ? "xp" : "phi"; //sets the default of recursiveCategory option to "phi" if prosodic, "xp" if syntactic

	options.recursiveCategory = options.recursiveCategory || defaultRecCat;

	// Check for multiple recursive categories
	if(options.recursiveCategory && options.recursiveCategory.length){
		if(typeof options.recursiveCategory === "string"){
			var recCats = options.recursiveCategory.split('-');
		}
		else {
			var recCats = [];
			for(var i = 0; i<options.recursiveCategory.length; i++){
				recCats = recCats.concat(options.recursiveCategory[i]);
			}
		}
		if(recCats.length > 1){
			//console.log(recCats);
			
			options.recursiveCatIndex = 0;
			//Set current recursiveCategory
			options.recursiveCategory = recCats[options.recursiveCatIndex];
			//Save list of all categories	
			options.recursiveCats = recCats;
		}
		if(recCats.length > 2){
			this.alert("You have entered more than 2 recursive categories!")
		}
	}

	if(!options.recursiveCats){
		options.recursiveCats = [options.recursiveCategory];
	}

	//Point to first recursiveCat
	options.recursiveCatIndex = 0;

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

		//private function to avoid code duplication in warning about novel recursive cats
		function novelRecursiveCatEval(recCat){
			if(categoryHierarchy.indexOf(recCat)<0){
				var err = new Error("Specified recursive category "+recCat+novelCatWarning);
				displayError(err.message, err);
				novelCategories = true;
				throw err;
			}
		}

		if(options.rootCategory && categoryHierarchy.indexOf(options.rootCategory)<0){
			var err = new Error("Specified root category "+options.recursiveCategory+novelCatWarning);
			displayError(err.message, err);
			novelCategories = true;
			throw err;
		}

		//Throw an error for any specified recursive category(s) that are valid. 
		//if...else structure because there could be more than 1 recursive cat:

		//Multiple recursive cats: options.recursiveCats is only defined if options.recursiveCategory contained a hyphen and has been split (line 62 above).
		if(options.recursiveCats && options.recursiveCats.length){
			for(let i in options.recursiveCats){
				novelRecursiveCatEval(options.recursiveCats[i]);
			}
		}
		//Only one recursive cat
		else{
			novelRecursiveCatEval(options.recursiveCategory);
		}
		
		// Throws an error for the defined terminal category if it is not a valid category.
		// Don't check terminal category if we're building syntactic trees.
		if(!options.syntactic && options.terminalCategory && categoryHierarchy.indexOf(options.terminalCategory)<0){
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

	//Perform additional checks of layering if novel categories are not involved.
	if(!novelCategories){
		if(categoryHierarchy.isHigher(options.recursiveCategory, options.rootCategory) || categoryHierarchy.isHigher(options.terminalCategory, options.recursiveCategory)){
			displayWarning("You have instructed GEN to produce trees that do not obey layering. See pCat and sCat in prosodicHierarchy.js");
		}
		else{
			//Check that the highest recursive category is immediately below the selected root category.
			if(options.recursiveCategory !== categoryHierarchy.nextLower(options.rootCategory) && options.recursiveCategory !== options.rootCategory)
			{
				displayWarning(""+options.recursiveCategory+" is not directly below "+options.rootCategory+" in the prosodic hierarchy. None of the resulting trees will be exhaustive because GEN will not generate any "+categoryHierarchy.nextLower(options.rootCategory)+"s. See pCat and sCat in prosodicHierarchy.js");
			}
			//Check that the lowest recursive category is immediately above the chosen terminal category.
			if(!options.recursiveCats){
				options.recursiveCats = [options.recursiveCategory];
			}
			var lowestRecCat = options.recursiveCats[options.recursiveCats.length-1];
			if(options.terminalCategory !== categoryHierarchy.nextLower(lowestRecCat) && options.terminalCategory !== lowestRecCat){
				displayWarning(""+options.terminalCategory+" is not directly below "+lowestRecCat+" in the prosodic hierarchy. None of the resulting trees will be exhaustive because GEN will not generate any "+categoryHierarchy.nextLower(lowestRecCat)+"s. Current pCat: "+pCat);
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
	pCat : ["i", "phi", "w", "Ft", "syll"],

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
		let prosodicMismatchMsg = cat1 + " or "+cat2 + " is not in the current category hierarchy "+pCat;
		console.warn(prosodicMismatchMsg);
		return false;
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
		let prosodicMismatchMsg = cat1 + " or "+cat2 + "is not in the current category hierarchy "+pCat;
		console.warn(prosodicMismatchMsg);
		return false;
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
	"w": ["[", "]"],
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