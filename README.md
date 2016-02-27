pretty dasm
===========
A tool to format text disassemblies (primarily from MAME/MESS) into readable HTML tables. There is currently only support for Motorola 68k architecture, but at least Z80 will be added in the future, and possibly others.

See http://sudden-desu.net/prettydasm for an example.

Format
------
The code is meant to work with disassemblies from the MAME/MESS emulators, though it will work with any code formatted like this:

    address   raw opcode          opcode  args   comments
    00000000: 0000 0000 0000 0000 moveq #1, D6  ; comment

Symbol Definitions
------------------
In the arguments field, you can add definitions for symbols. prettydasm will format the definition to appear above the symbol when the mouse hovers over it. The definition should immediately follow the symbol and be enclosed in brackets:

    004A70: 4EB9 0000 C100   jsr     disp_string[$C100]

Comments
--------
Comments are collapsed into a user-defined HTML block that can be hovered over to view the whole comment.

Config
------
A handful of config settings appear at the top of the code:

    autoProcess (boolean)
This will cause the script to scan the DOM for all PRE elements with class 'dasm_68k' and automatically convert them on page load.

    useClasses (boolean)
This will enable or disable class tags on each column. This only affects classes: dasm_68k_addrCol, dasm_68k_rawCol, dasm_68k_opCol and dasm_68k_argCol. This is useful for styling columns in a scenario where the :nth-child CSS selectors are unavailable.

    commentContent (string)
Contains the content that will appear in the fifth column when a comment is collapsed. This is what the user will hover over to see the actual comment text. This can be plain text or HTML (such as an image).

    vertOffset, horizOffset (number)
These determine the offset of the comment and symbol definition popup boxes relative to the parent element.

Usage
-----
Written in plain JavaScript, no extra frameworks/libraries needed. Reference the .js file from your HTML as you would any other JavaScript.

To use, insert a PRE element on your page with a class of 'dasm_68k' and call makepretty_68k(element).

    var preWithDisassembly = document.getElemenetByClassName('dasm_68k')[0];
    makepretty_68k(preWithDisassembly);

Alternatively, make sure autoProcess is set to true in the config, and any elements with class 'dasm_68k' will be converted on page load.

CSS Styling
-----------
_Global_:
- #dasm_def - DIV; The symbol definition popup
- #dasm_com - DIV; the comment popup
- .dasm - TABLE; the table containing the formatted data

_Motorola 68k_:
- .dasm_68k - TABLE; the table containing the formatted data
- .dasm_68k_plain - TD; used for lines that could not be parsed
- .dasm_68k_addrCol - TD; the address column
- .dasm_68k_rawCol - TD; the raw opcode column
- .dasm_68k_opCol - TD; the opcode column
- .dasm_68k_argCol - TD; the opcode arguments column
- .dasm_68k_def - SPAN; for symbols with definitions attached
