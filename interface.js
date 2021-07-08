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
      Permutations" and the analysis cannot be saved at this time.');
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
}/**
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

	/** ===CHECKING showHeads IF BinMaxHead or BinMinHead CHECKED=== */
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


});
/** 
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
    genOptions.recursiveCategory = "";
    //genOpsRC is an array passed in from the recursiveCategory checkboxes
    var genOpsRC = spotForm['genOptions-recursiveCategory'];
    for (var i = 0; i<genOpsRC.length; i++){
        if(genOpsRC[i].value && genOpsRC[i].checked){
            if(genOptions.recursiveCategory.length){
                genOptions.recursiveCategory = genOptions.recursiveCategory.concat("-")
            }
            genOptions.recursiveCategory = genOptions.recursiveCategory.concat(genOpsRC[i].value);
        }
    }
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
