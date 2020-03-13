/*  prettydasm 2.0
    Damian Rogers (damian@sudden-desu.net)
    https://github.com/ryogamasaki/prettydasm
    Released under ISC License

    A tool for prettify-ing disassembly text from MAME
    (and any other tools that use the same text format)

    *** IMPORTANT ***
    When dumping from MAME, be sure to exclude raw opcodes
    To do this, set the fourth option of the dasm command to 0
    i.e.:  dasm file.dasm,0,100,0
*/

(function () {
  // -------------------- USER CONFIG

  // automatically process all PRE tags with class 'pdasm'?
  // if set to false, you will need to manually call make_pretty_dasm
  // on the PRE elements of your choice
  const auto_process = true;

  // Comment field content that will be displayed in the fourth
  // table column when a comment is present
  // (This can be HTML)
  const comment_content = '//';

  // Override the default hex notation of an architecture
  // (not used for regex; does not need to be escaped)
  // const override_hex_notation = '0x';
  const override_hex_notation = null;

  // If an architecture uses postfixed hex notation, this will
  // force the notation to be prefixed instead
  const override_hex_postfix = false;

  // always capitalize all hexadecimal values
  const capitalize_hex = false;

  // always capitalize length specifiers attached to hex values
  const capitalize_hex_sizes = true;

  // add caption tag to table with the name of the architecture (if available)
  const add_arch_caption = true;


  // -------------------- ARCHITECTURE DEFINITIONS
  /*
    name: name of the CPU/architecture
    hex_notation: the hexadecimal marker used by this architecture's notation
    hex_postfix: indicates that the hex notation is postfixed to the value (e.g. 10F0h)
    zero_prefix: indicates that hex values with an alphabetical letter as the most
                 significant digit will be prefixed with 0. This will likely only be
                 used with postfix notation (see the x86 family).
    opcode_sizes: this arch includes size specifiers in opcodes (i.e. move.w)
    registers: list of hardware registers

    'hex_notation' and 'registers' are both used in regex matching, and as such
    should must be properly regex (and javascript string) escaped.

    When writing the registers list, keep in mind that for registers with similar
    names, longer registers should be listed first, e.g. r11|r1, or af'|af|a|f.
    Of course, you can use any valid matching for your register list, such as
    d[0-7]|a[0-7].
  */

  var archs = {
    'm68k': {
      name: 'Motorola M68000',
      hex_notation: '\\$',
      hex_postfix: false,
      zero_prefix: false,
      opcode_sizes: true,
      registers: 'pc|sr|ccr|[us]sp|sp|d[0-7]|a[0-7]'
    },

    'sh2': {
      name: 'Hitachi SH-2',
      hex_notation: '\\$',
      hex_postfix: false,
      zero_prefix: false,
      opcode_sizes: true,
      registers: 'pc|sr|gbr|r1[0-5]|r[0-9]'
    },

    'z80': {
      name: 'Zilog Z80',
      hex_notation: '\\$',
      hex_postfix: false,
      zero_prefix: false,
      opcode_sizes: false,
      registers: 'pc|sp|af\'|af|a|f|bc\'|bc|b|c|de\'|de|d|e|hl\'|hl|h|l|ei[xy]|i|r'
    },

    '6502': {
      name: 'MOS 6502',
      hex_notation: '\\$',
      hex_postfix: false,
      zero_prefix: false,
      opcode_sizes: false,
      registers: 'pc|sp|a|x|y|p'
    },

    'i960': {
      name: 'Intel i960',
      hex_notation: '0x',
      hex_postfix: false,
      zero_prefix: false,
      opcode_sizes: false,
      registers: 'pc|sp|r1[0-5]|r[0-9]|g1[0-5]|g[0-9]'
    },

    'h8': {
      name: 'Hitachi H8',
      hex_notation: 'h\'',
      hex_postfix: false,
      zero_prefix: false,
      opcode_sizes: true,
      registers: 'pc|ccr|r[0-7][hl]|r[0-7]'
    },

    '8086': {
      name: 'Intel 8086/8088',
      hex_notation: 'h',
      hex_postfix: true,
      zero_prefix: true,
      opcode_sizes: false,
      registers: 'pc|[acdb][xhl]|[sb]p|[sd]i|[cdse]s'
    },

    'x86': {
      name: 'Intel x86 (32bit)',
      hex_notation: 'h',
      hex_postfix: true,
      zero_prefix: true,
      opcode_sizes: false,
      registers: 'pc|e[acdb]x|[acdb][xhl]|e[sb]p|[sb]p|e[sd]i|[sd]i|[cdsefg]s|dr[0-7]|cr[0-7]|tr[3-7]'
    },

    'arm': {
      name: 'ARM',
      hex_notation: '\\$',
      hex_postfix: false,
      zero_prefix: false,
      opcode_sizes: false,
      registers: 'pc|r1[0-5]|r[0-9]'
    }
  };

  // -------------------- INTERNAL CONFIGURATION
  const PDASM_PREFIX = 'pdasm';
  // css classes & id's
  const CSSCLASS_ARCH_PREFIX = PDASM_PREFIX + '-arch-';
  const CSSCLASS_UNFORMATTED = PDASM_PREFIX + '-plain';
  const CSSCLAS_SYMBOL = PDASM_PREFIX + '-symbol';
  const CSSCLASS_REGISTER = PDASM_PREFIX + '-reg';
  const CSSCLASS_HEX_NOTATION = PDASM_PREFIX + '-hex-notation';
  const CSSCLASS_HEX_VALUE = PDASM_PREFIX + '-hex-value';
  const CSSCLASS_SIZE = PDASM_PREFIX + '-size';
  const CSSCLASS_COMMENT = PDASM_PREFIX + '-comment';

  const CSSID_HOVER_COMMENT = PDASM_PREFIX + '-commentbox';
  const CSSID_HOVER_SYMBOL = PDASM_PREFIX + '-symbolbox';

  // regex
  const REGEX_MAIN = /([0-9a-f]{1,}): (\S{1,})(?: {1,}(.*))?/i;
  const REGEX_SIZE_POSTFIX = /((?:\.[q|l|w|b]))/i;
  const REGEX_HEX_CORE = '([0-9a-f]{1,})+';
  const REGEX_HEX_EXTRA = '((?:\\.[qlwb])?)+(?:\\{(.{1,})\\})?';
  const REGEX_HEX_NOTATION_DEFAULTS = '(\\$|0x{1})+';
  const REGEX_HEX_ZEROPREFIX = /^[a-f]/i;

  // misc
  const COMMENT_MARKER = ';';
  const HOVER_ATTR = PDASM_PREFIX + '_hover';

  // -------------------- MAIN FUNCTION
  window.make_pretty_dasm = function (elem) {
    var formatted_table = document.createElement("TABLE");
    formatted_table.className = PDASM_PREFIX

    // search for an architecture
    var class_list = elem.className.split(' ');
    var arch = null;
    for (var class_iter = 0; class_iter < class_list.length; ++class_iter) {
      if (class_list[class_iter].indexOf(CSSCLASS_ARCH_PREFIX) > -1) {
        arch = archs[class_list[class_iter].replace(CSSCLASS_ARCH_PREFIX, '')];
        if (arch != null) {
          formatted_table.className += ' ' + class_list[class_iter];
          // stop at the first one found
          break;
        }
      }
    }

    // set caption
    if (arch != null && add_arch_caption) {
      var caption = document.createElement("CAPTION")
      caption.innerHTML = arch.name;
      formatted_table.appendChild(caption);
    }

    // iterate over each line in the pre and regex it
    var lines = elem.innerHTML.split("\n");

    for (var line_iter = 0; line_iter < lines.length; line_iter++) {
      var new_row = document.createElement("TR"),
        this_line = lines[line_iter],
        lineLen = this_line.length,
        validLine = false,
        temp = null;

      // basic capture: address, opcode, arguments

      var match = REGEX_MAIN.exec(this_line);

      if (match == null) {
        // didn't match, add a row with just the plain unformatted text as a fallback
        var unformatted_col = document.createElement('TD');
        unformatted_col.className = CSSCLASS_UNFORMATTED;
        unformatted_col.setAttribute('colspan', '4');
        unformatted_col.innerHTML = this_line;
        new_row.appendChild(unformatted_col);
      } else {
        var addr_col = document.createElement('TD'),
          opcode_col = document.createElement('TD'),
          args_col = document.createElement('TD');

        new_row.appendChild(addr_col);
        new_row.appendChild(opcode_col);
        new_row.appendChild(args_col);

        // do any necessary formatting on the captured text
        // and assign it to the table cells
        addr_col.textContent = match[1];

        opcode_col.textContent = match[2];
        if (arch != null && arch.opcode_sizes) {
          parse_opcode_sizes(opcode_col);
        }

        if (match[3] != null) {
          args_col.textContent = match[3];
          parse_args(args_col, arch);
        }
      }

      formatted_table.appendChild(new_row);
    }

    elem.parentNode.replaceChild(formatted_table, elem);

    return formatted_table;
  }

  // -------------------- PARSING FUNCTIONS
  function parse_args(node, arch) {

    // parse comment here
    // (no need to loop over nodes, there should only ever be one comment)
    parse_comment(node);

    // for each node
    //  check if it is text node; if not, skip to next
    //  send node text to parsers: hex, then regs
    //  (a parser takes the node, searches text, extracts if found, splits node)

    for (var child_iter = 0; child_iter < node.childNodes.length; child_iter++) {
      var this_node = node.childNodes[child_iter];
      // is this a text node?
      if (this_node.nodeType != 3) continue;

      parse_hex(this_node, arch);
      if (arch != null) parse_regs(this_node, arch);
    }
  }

  function parse_comment(node) {
    var split = node.textContent.split(COMMENT_MARKER, 2);
    if (split.length < 2) return node;

    node.textContent = split[0].trim();

    var comment_td = document.createElement('TD');
    comment_td.setAttribute(HOVER_ATTR, split[1].trim());
    comment_td.innerHTML = comment_content;
    comment_td.className = CSSCLASS_COMMENT;
    comment_td.addEventListener('mouseover', comment_popup);
    comment_td.addEventListener('mouseout', comment_clear);
    node.parentNode.insertBefore(comment_td, node.nextSibling);

    return node;
  }

  function parse_opcode_sizes(node) {
    var match = REGEX_SIZE_POSTFIX.exec(node.textContent);
    // we should only ever have one size in the opcode
    // so don't bother with any fancy node loopin'
    if (match != null) {
      node.innerHTML = node.innerHTML.replace(match[1], '<span class="' + CSSCLASS_SIZE + '" >' + match[1] + '</span>');
    }

    return node;
  }

  function parse_hex(node, arch) {
    // group 0 - full string
    // group 1 - prefix (or value if postfix type)
    // group 2 - value (or postfix)
    // group 3 - size (optional)
    // group 4 - label (optional)
    var use_postfix = (arch != null && arch.hex_postfix) ? true : false;

    var hex_regexp;
    if (arch != null) {
      if (use_postfix) {
        hex_regexp = REGEX_HEX_CORE + '(' + arch.hex_notation + '{1})+' + REGEX_HEX_EXTRA;
      }
      else {
        hex_regexp = '(' + arch.hex_notation + '{1})+' + REGEX_HEX_CORE + REGEX_HEX_EXTRA;
      }
    }
    else {
      // no arch specified, assume prefix and auto detect
      hex_regexp = REGEX_HEX_NOTATION_DEFAULTS + REGEX_HEX_CORE + REGEX_HEX_EXTRA;
    }

    var match = new RegExp(hex_regexp, 'i').exec(node.textContent);
    if (match != null) {

      var hex_notation_idx = 1, hex_value_idx = 2;
      if (use_postfix) {
        hex_notation_idx = 2; hex_value_idx = 1;
      }

      if (arch != null && arch.zero_prefix) {
        // a zero prefixed notation can never have a 
        // letter as the first digit
        var zeroprefix_match = REGEX_HEX_ZEROPREFIX.exec(match[hex_value_idx]);
        if (zeroprefix_match != null) return node;
      }

      var hex_value = capitalize_hex ? match[hex_value_idx].toUpperCase() : match[hex_value_idx];
      var hex_notation = override_hex_notation == null ? match[hex_notation_idx] : override_hex_notation;
      var hex_size = capitalize_hex_sizes ? match[3].toUpperCase() : match[3];

      var hex_txt_idx = node.textContent.indexOf(match[0]);
      node.textContent = node.textContent.replace(match[0], '');

      var split_node = node.splitText(hex_txt_idx);

      var hex_value_elem = document.createElement('SPAN');

      if (match[4] != null) {
        // we caught a label
        // show the label, and show the actual hex value on hover
        hex_value_elem.className = CSSCLAS_SYMBOL;
        hex_value_elem.textContent = match[4];
        hex_value_elem.setAttribute(HOVER_ATTR, (use_postfix ? hex_value + hex_notation : hex_notation + hex_value) + (hex_size == null ? '' : hex_size));
        hex_value_elem.addEventListener('mouseover', symbol_popup);
        hex_value_elem.addEventListener('mouseout', symbol_clear);
        node.parentNode.insertBefore(hex_value_elem, split_node);
      }
      else {
        hex_value_elem.className = CSSCLASS_HEX_VALUE;
        hex_value_elem.textContent = hex_value;

        var hex_notation_elem = document.createElement('SPAN');
        hex_notation_elem.className = CSSCLASS_HEX_NOTATION;
        hex_notation_elem.textContent = hex_notation;
        if (use_postfix && !override_hex_postfix) {
          node.parentNode.insertBefore(hex_value_elem, split_node);
          node.parentNode.insertBefore(hex_notation_elem, split_node);
        }
        else {
          node.parentNode.insertBefore(hex_notation_elem, split_node);
          node.parentNode.insertBefore(hex_value_elem, split_node);
        }


        if (hex_size != null) {
          var hex_size_elem = document.createElement('SPAN');
          hex_size_elem.className = CSSCLASS_SIZE;
          hex_size_elem.textContent = hex_size;
          node.parentNode.insertBefore(hex_size_elem, split_node);
        }
      }
    }

    return node;
  }

  function parse_regs(node, arch) {
    var match = new RegExp('(' + arch.registers + ')', 'i').exec(node.textContent);
    if (match != null) {
      // remove reg text from node
      // split text node at reg txt location
      // create new span elem
      // insert span
      var reg_txt_idx = node.textContent.indexOf(match[0]);
      node.textContent = node.textContent.replace(match[0], '');
      var split_node = node.splitText(reg_txt_idx);
      var reg_elem = document.createElement('SPAN');
      reg_elem.className = CSSCLASS_REGISTER;
      reg_elem.textContent = match[0];
      node.parentNode.insertBefore(reg_elem, split_node);
    }

    return node;
  }


  // -------------------- HOVER DISPLAY FUNCTIONS
  function symbol_popup() {
    symbol_box.innerHTML = this.getAttribute(HOVER_ATTR);
    var rect = this.getBoundingClientRect();

    symbol_box.style.visibility = 'hidden';
    symbol_box.style.display = 'block';
    symbol_box.style.left = rect.left + 'px';
    symbol_box.style.top = (rect.top - symbol_box.getBoundingClientRect().height) + 'px';
    symbol_box.style.visibility = 'visible';
    symbol_box.style.opacity = '1';
  }

  function symbol_clear() {
    symbol_box.style.opacity = '0';
    symbol_box.style.display = 'none';
  }

  function comment_popup() {
    comment_box.innerHTML = this.getAttribute(HOVER_ATTR);
    var rect = this.getBoundingClientRect();

    comment_box.style.visibility = 'hidden';
    comment_box.style.display = 'block';
    comment_box.style.left = rect.left + 'px';
    comment_box.style.top = (rect.top - comment_box.getBoundingClientRect().height) + 'px';
    comment_box.style.visibility = 'visible';
    comment_box.style.opacity = '1';
  }

  function comment_clear() {
    comment_box.style.opacity = '0';
    comment_box.style.display = 'none';
  }

  function create_hover_elem(id) {
    var elem = document.createElement('DIV');
    elem.setAttribute('id', id);
    elem.style.display = 'none';
    elem.style.position = 'fixed';
    elem.style.opacity = '0';
    document.body.appendChild(elem);
    return elem;
  }

  // -------------------- INIT & PROCESS ELEMENTS
  var symbol_box = create_hover_elem(CSSID_HOVER_SYMBOL),
    comment_box = create_hover_elem(CSSID_HOVER_COMMENT);

  if (auto_process) {
    var elems = document.getElementsByClassName(PDASM_PREFIX);

    if (elems.length > 0)
      for (var elem_iter = 0; elem_iter < elems.length; elem_iter++) {
        if (elems[elem_iter].tagName != 'PRE') continue;
        make_pretty_dasm(elems[elem_iter]);
      }
  }
})();
