/*  pretty dasm (M68k version)
    Damian Rogers (damian@sudden-desu.net)

*/
(function() {
  // ------------ CONFIG

  // automatically process all pre tags with class 'dasm_68k'?
  var autoProcess = true;

  // assign css classes to each cell?
  var useClasses = false;

  // Comment field content
  // This can be HTML
  var commentContent = '//';

  // offset for popup text (in pixels)
  var vertOffset = -25;
  var horizOffset = 0;

  // ------------ END CONFIG

  // helper to create the popup box elements
  var setupPopup = function(id) {
    var elem = document.createElement('DIV');
    elem.setAttribute('id', id);
    elem.style.display = 'hidden';
    elem.style.position = 'fixed';
    elem.addEventListener(transitionEndEventName(), function() {
      if(elem.style.opacity == 0)
        elem.style.display = 'none';
    });
    document.getElementsByTagName('BODY')[0].appendChild(elem);
    return elem;
  }

  var defbox = setupPopup('dasm_def'),
  combox = setupPopup('dasm_com');

  window.makepretty_68k = function(inElem) {
    var outTable = document.createElement("TABLE");
    outTable.className = "dasm dasm_68k";

    var lines = inElem.innerHTML.split("\n");
    for (var x = 0; x < lines.length; x++) {

      var newRow = document.createElement("TR")
      thisLine = lines[x],
      lineLen = thisLine.length,
      validLine = false,
      temp = null;

      var regex = /([0-9A-Fa-f]{1,}): ([0-9A-Fa-f]{1,} ?[0-9A-Fa-f]{1,} ?[0-9A-Fa-f]{1,} ?[0-9A-Fa-f]{1,})[ ?]{1,}([A-Za-z0-9\.]{1,})[ ]{0,}([a-zA-Z0-9#_$+-,\. \[\]\(\)]{1,})?;?(.{1,})?/g;
      var match = regex.exec(lines[x]);

      if (match == null) {
        var unformattedCol = document.createElement('TD');
        unformattedCol.className = 'dasm_68k_plain';
        unformattedCol.setAttribute('colspan','5');
        unformattedCol.innerHTML = lines[x];
        newRow.appendChild(unformattedCol);
      } else {
        var addrCol = document.createElement('TD'),
          rawCol = document.createElement('TD'),
          opCol = document.createElement('TD');

        if(useClasses) {
          addrCol.className = 'dasm_68k_addrCol';
          rawCol.className = 'dasm_68k_rawCol';
          opCol.className = 'dasm_68k_opCol';
          argCol.className = 'dasm_68k_argCol';
        }

        addrCol.innerHTML = match[1];
        rawCol.innerHTML = match[2];
        opCol.innerHTML = match[3];

        newRow.appendChild(addrCol);
        newRow.appendChild(rawCol);
        newRow.appendChild(opCol);

        var argCol = document.createElement('TD');
        if(match[4]) {


          // format the arg col further
          var args = match[4].split(',');
          for (var argIt = 0; argIt < args.length; argIt++) {
            var newSpan = document.createElement('SPAN');
            var thisArg = args[argIt].trim()

            var defRegex = /(.*)\[(.*)\]/g;
            var defMatch = defRegex.exec(thisArg);

            if (defMatch == null) {
              newSpan.innerHTML = thisArg;
            } else {
              if(useClasses) newSpan.className = 'dasm_68k_arg';
              newSpan.innerHTML = defMatch[1];
              newSpan.className = 'dasm_68k_def';
              newSpan.setAttribute('def', defMatch[2]);
              newSpan.addEventListener('mouseover', defPopup);
              newSpan.addEventListener('mouseout', defClear);
            }


            argCol.appendChild(newSpan);
            if (argIt < (args.length - 1)) {
              newSpan.insertAdjacentHTML('afterend', ', ');
            }
          }
        }
        newRow.appendChild(argCol);

        if (match[5]) {
          var comCol = document.createElement('TD');
          comCol.setAttribute('comment', match[5]);
          comCol.innerHTML = commentContent;
          if(useClasses) comCol.className = 'dasm_68k_com';
          comCol.addEventListener('mouseover', comPopup);
          comCol.addEventListener('mouseout', comClear);
          newRow.appendChild(comCol);
        }
      }

      outTable.appendChild(newRow);
    }

    inElem.parentNode.replaceChild(outTable, inElem);
  }



  function defPopup() {
    defbox.innerHTML = this.getAttribute('def');
    var rect = this.getBoundingClientRect();
    defbox.style.left = (rect.left + horizOffset) + 'px';
    defbox.style.top = (rect.top + vertOffset) + 'px';
    defbox.style.display = 'block';
    defbox.style.opacity = '1';
  }

  function defClear() {
    defbox.style.opacity = '0';
  }

  function comPopup() {
    combox.innerHTML = this.getAttribute('comment');
    var rect = this.parentNode.getBoundingClientRect();
    combox.style.left = (rect.left + horizOffset) + 'px';
    combox.style.top = (rect.top + vertOffset) + 'px';
    combox.style.display = 'block';
    combox.style.opacity = '1';
  }

  function comClear() {
    combox.style.opacity = '0';
  }

  function transitionEndEventName() {
    var i,
        undefined,
        el = document.createElement('div'),
        transitions = {
            'transition':'transitionend',
            'OTransition':'otransitionend',
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        };

    for (i in transitions) {
        if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
            return transitions[i];
        }
    }
    console.log('The browser does not support the transitionend event!')
    return null;
}

  // init
  if(autoProcess) {
    var elems = document.getElementsByClassName('dasm_68k');
    var elemsLen = elems.length;
    // we only want pre tags
    while(elemsLen--)
      if(elems[elemsLen].tagName != 'PRE') elems.splice(elemsLen,1);
    if (elems.length > 0)
      for (var it = 0; it < elems.length; it++)
        makepretty_68k(elems[it]);
  }
})();
