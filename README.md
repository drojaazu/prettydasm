prettydasm
==========
A tool to format text disassemblies into readable HTML tables.

See http://sudden-desu.net/prettydasm for an example.

Usage
-----
Written in plain JavaScript; no framework/library dependencies.

Place the disassmbly text inside a PRE element and add class 'pdasm' to the element. When the page loads, these elements will be converted to tables.

Alternatively, you can disable the `auto_process` setting and manually call `make_pretty_dasm(elem)` with a reference to a specific element. It will return a reference to the newly created formatted table.

Format
------
The code is meant to work with disassemblies from MAME, though it will work with any code formatted like this:

    address   opcode   args    comments
    0F020012: moveq    #1, D6  ; put 1 into register d6

Symbols
-------
In the arguments field, you can define symbols on hexadecimal values. These symbols will replace the hex in the output, with the original value visible by hovering the mouse over the symbol.

The symbol should be wrapped in curly braces and should immediately follow the hex value. Example:

    003952: move.w  #$0, $1c2000.l{symbol_name}

Comments
--------
Comments can be added to specific lines by appending a semicolon to the end of the line. Example:

    003998: jsr     $8e64.l ; jump to the subroutiune at 0x8E64

The comment text is collapsed into a user-defined HTML block (see `comment_content` setting) in order to save space, and the comment will be visible on mouse hover.

Architectures/CPUs
------------------
The hardware architecture from which the disassembly originates can be specified to allow for more detailed formatting. In particular, this adds support for identifying hardware registers. This is done by adding the appropriate CSS class to the PRE element. Example:

    <pre class='pdasm pdasm-arch-m68k'> ... </pre>

The current built in architectures are as follows:
 - Motorole M68000 : pdasm-arch-m68k
 - Hitachi/Renesas SH-2 : pdasm-arch-sh2
 - Zilog Z80 : pdasm-arch-z80
 - MOS 6502 : pdasm-arch-6502
 - Intel i960 : pdasm-arch-i960
 - Hitachi/Renesas H8 : pdasm-arch-h8
 - Intel 8086/8088 : pdasm-arch-8086
 - Intel x86 (32bit) : pdasm-arch-x86
 - ARM : pdasm-arch-arm

If an architecture if not specified, no register formatting is performed and hex values are assumed to have prefixed notation with either `$` or `0x`.

New architecture definitions can be added to the `archs` object. This is documented in the source.

Configuration
--------------
User configuration is set at the top of the .js file.

    auto_process (boolean)
Automatically convert all PRE elements with class 'pdasm' to formatted tables on page load. If set to false, you will need to manually call `make_pretty_dasm(elem)` on specific PRE elements.

    comment_content (string)
Defines the content that will appear in the last column when a comment is collapsed. This can be plain text or HTML (e.g. an IMG tag).

    override_hex_notation (string)
Replaces all hex notation with the specified string. Set to null to disable.

    override_hex_postfix (boolean)
Forces architectures with postfixed hex notation to display prefixed instead.

    capitalize_hex (boolean)
Force all hex values to be capital.

    capitalize_hex_sizes (boolean)
Force all size specifiers on hex values to be capital. (e.g. $12F0.l -> $12F0.L)

    add_arch_caption (boolean)
When true, adds a caption to the table element with the architecture name.

CSS Classes/IDs
---------------
`table.pdasm` - Styles all prettydasm formatted tables

`table.pdasm-arch-xxxx` - Where xxxx is the name of the architecture; styles all prettydasm formatted tables that match the architecture

`span.pdasm-hex-notation` - Styles the hexadecimal notation

`span.pdasm-hex-value` - Styels the hexadecimal value

`span.pdasm-hex-size` - Styles the size postfix on a hex value

`span.pdasm-symbol` - Styles a symbol substitution

`span.pdasm-reg` - Styles the hardware registers

`td.pdasm-comment` - Styles the comment marker

`div#pdasm-commentbox` - Styles the popup box for comments

`div#pdasm-symbolbox` - Styles the popup box for symbols

In order to reduce bloat on the generated HTML, there are no class names created for the adress and opcode columns. These can be selected by using the `first-child`/`nth-child` pseudo selectors on the table rows, e.g.:

    .pdasm > tr td:first-child

    .pdasm > tr td:nth-child(2)
