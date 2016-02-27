var pre_input = document.getElementById('pre_input');
var pre_submit = document.getElementById('pre_submit');
var plain_pre = document.getElementById('plain_pre');
var pretty_pre_a = document.getElementById('pretty_pre_a');

pre_input.value = "004A66: 7C2A             moveq   #$2a, D6                       ; D6 stores the offset for the string table - 2A is '1UP'\n004A68: 4EB9 0000 C100   jsr     disp_string[$c100]\n004A6E: 7C2B             moveq   #$2b, D6                       ; 0x2B - HISCORE\n004A70: 4EB9 0000 C100   jsr     disp_string[$c100]\n004A76: 7C00             moveq   #$0, D6                        ; 0 - the initial 00 scores under 1UP and HISCORE\n004A78: 4EB9 0000 C100   jsr     disp_string[$c100]\n004A7E: 4A79 0040 902A   tst.w   multiplayer_flag[$40902a]    ; are we in multiplayer mode?\n004A84: 6710             beq     $4a96                          ; if not branch below and skip the 2P stuff\n004A86: 7C2C             moveq   #$2c, D6                       ; 0x2C - 2UP\n004A88: 4EB9 0000 C100   jsr     disp_string[$c100]\n004A8E: 7C2D             moveq   #$2d, D6                       ; 0x2D - MUTEKI -- this line and the next are NOT in revision C!\n004A90: 4EB9 0000 C100   jsr     disp_string[$c100]";

function refreshExamples() {
  var table = document.getElementsByClassName('dasm')[0];

  pretty_pre = document.createElement('PRE');
  pretty_pre.setAttribute('id','pretty_pre');
  pretty_pre.className = 'dasm_68k';
  if(table)
    table.parentNode.replaceChild(pretty_pre, table);
  else
    pretty_pre_a.parentNode.insertBefore(pretty_pre,pretty_pre_a);
  plain_pre.innerHTML = pre_input.value;
  pretty_pre.innerHTML = pre_input.value;
  makepretty_68k(pretty_pre);
}

refreshExamples();
pre_submit.addEventListener('click', refreshExamples);
