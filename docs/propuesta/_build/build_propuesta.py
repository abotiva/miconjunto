"""Construye el documento de propuesta del proyecto MiConjunto."""

import os

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import (WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT,
                            WD_TAB_LEADER)
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(BASE, "..", "assets"))
OUT = os.path.normpath(os.path.join(BASE, "..", "Propuesta_MiConjunto_v1.1.docx"))

NAVY = RGBColor(0x17, 0x37, 0x5E)
NAVY_HEX = "17375E"
TEAL = RGBColor(0x1F, 0x7A, 0x6B)
TEAL_HEX = "1F7A6B"
INK = RGBColor(0x1F, 0x2A, 0x36)
MUTED = RGBColor(0x5B, 0x6B, 0x7C)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT = "EEF3F8"
ZEBRA = "F7F9FB"
BORDER = "DCE3EA"

CONTENT_W = 17.4
BODY = "Segoe UI"
HEAD = "Segoe UI Semibold"

doc = Document()


# --------------------------------------------------------------------- helpers
def set_run_fonts(run, name):
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(attr), name)


TBL_ORDER = ("w:tblStyle", "w:tblpPr", "w:tblOverlap", "w:bidiVisual", "w:tblStyleRowBandSize",
             "w:tblStyleColBandSize", "w:tblW", "w:jc", "w:tblCellSpacing", "w:tblInd",
             "w:tblBorders", "w:shd", "w:tblLayout", "w:tblCellMar", "w:tblLook",
             "w:tblCaption", "w:tblDescription")


def _insert_tblpr(tblPr, element, tag):
    idx = TBL_ORDER.index(tag)
    after = TBL_ORDER[idx + 1:]
    tblPr.insert_element_before(element, *after)


def shade(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.insert_element_before(
        shd, "w:noWrap", "w:tcMar", "w:textDirection", "w:tcFitText", "w:vAlign",
        "w:hideMark", "w:headers", "w:cellIns", "w:cellDel", "w:cellMerge",
    )


def cell_margins(table, top=90, bottom=90, left=120, right=120):
    tblPr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for side, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    _insert_tblpr(tblPr, mar, "w:tblCellMar")


def table_borders(table, color=BORDER, size=4, inside=True):
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    edges = {
        "top": ("single", size),
        "bottom": ("single", size),
        "left": ("nil", 0),
        "right": ("nil", 0),
        "insideH": ("single", size) if inside else ("nil", 0),
        "insideV": ("nil", 0),
    }
    for edge, (val, sz) in edges.items():
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), val)
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    _insert_tblpr(tblPr, borders, "w:tblBorders")


def no_borders(table):
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "nil")
        borders.append(el)
    _insert_tblpr(tblPr, borders, "w:tblBorders")


def side_border(table, edge="left", color=TEAL_HEX, size=18):
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for e in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{e}")
        if e == edge:
            el.set(qn("w:val"), "single")
            el.set(qn("w:sz"), str(size))
            el.set(qn("w:color"), color)
        else:
            el.set(qn("w:val"), "nil")
        el.set(qn("w:space"), "0")
        borders.append(el)
    _insert_tblpr(tblPr, borders, "w:tblBorders")


def keep_together(table, header_rows=1):
    for i, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        cant = OxmlElement("w:cantSplit")
        trPr.append(cant)
        if i < header_rows:
            hdr = OxmlElement("w:tblHeader")
            trPr.append(hdr)


def para(text="", size=10, color=INK, bold=False, italic=False, space_after=6,
         space_before=0, align=WD_ALIGN_PARAGRAPH.JUSTIFY, line=1.15, font=BODY,
         indent=0, keep_next=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    pf.line_spacing = line
    pf.alignment = align
    if indent:
        pf.left_indent = Cm(indent)
    pf.keep_with_next = keep_next
    if text:
        r = p.add_run(text)
        r.font.size = Pt(size)
        r.font.color.rgb = color
        r.bold = bold
        r.italic = italic
        set_run_fonts(r, font)
    return p


def h1(number, text):
    p = doc.add_paragraph(style="Heading 1")
    pf = p.paragraph_format
    pf.space_before = Pt(20)
    pf.space_after = Pt(10)
    pf.keep_with_next = True
    r = p.add_run(f"{number}  " if number else "")
    r.font.size = Pt(14.5)
    r.font.color.rgb = TEAL
    r.bold = True
    set_run_fonts(r, HEAD)
    r2 = p.add_run(text)
    r2.font.size = Pt(14.5)
    r2.font.color.rgb = NAVY
    r2.bold = True
    set_run_fonts(r2, HEAD)

    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "8")
    bottom.set(qn("w:space"), "6")
    bottom.set(qn("w:color"), BORDER)
    pBdr.append(bottom)
    pPr.insert_element_before(
        pBdr, "w:shd", "w:tabs", "w:suppressAutoHyphens", "w:kinsoku", "w:wordWrap",
        "w:overflowPunct", "w:topLinePunct", "w:autoSpaceDE", "w:autoSpaceDN", "w:bidi",
        "w:adjustRightInd", "w:snapToGrid", "w:spacing", "w:ind", "w:contextualSpacing",
        "w:mirrorIndents", "w:suppressOverlap", "w:jc", "w:textDirection",
        "w:textAlignment", "w:textboxTightWrap", "w:outlineLvl", "w:divId",
        "w:cnfStyle", "w:rPr", "w:sectPr", "w:pPrChange",
    )
    return p


def h2(text, number=None):
    p = doc.add_paragraph(style="Heading 2")
    pf = p.paragraph_format
    pf.space_before = Pt(12)
    pf.space_after = Pt(4)
    pf.keep_with_next = True
    if number:
        r0 = p.add_run(f"{number}  ")
        r0.font.size = Pt(11.5)
        r0.font.color.rgb = TEAL
        r0.bold = True
        set_run_fonts(r0, HEAD)
    r = p.add_run(text)
    r.font.size = Pt(11.5)
    r.font.color.rgb = NAVY
    r.bold = True
    set_run_fonts(r, HEAD)
    return p


def h3(text):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(9)
    pf.space_after = Pt(2)
    pf.keep_with_next = True
    r = p.add_run(text.upper())
    r.font.size = Pt(8.6)
    r.font.color.rgb = MUTED
    r.bold = True
    r.font.spacing = Pt(0.4)
    set_run_fonts(r, BODY)
    return p


def bullet(text, bold_prefix=None, size=9.8, indent=0.55, space_after=3):
    p = doc.add_paragraph(style="List Bullet")
    pf = p.paragraph_format
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(0)
    pf.line_spacing = 1.12
    pf.left_indent = Cm(indent)
    pf.first_line_indent = Cm(-0.4)
    if bold_prefix:
        r = p.add_run(bold_prefix)
        r.bold = True
        r.font.size = Pt(size)
        r.font.color.rgb = INK
        set_run_fonts(r, BODY)
    r2 = p.add_run(text)
    r2.font.size = Pt(size)
    r2.font.color.rgb = INK
    set_run_fonts(r2, BODY)
    return p


def numbered(items, size=9.8, indent=0.55):
    for i, item in enumerate(items, 1):
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_after = Pt(3)
        pf.line_spacing = 1.12
        pf.left_indent = Cm(indent)
        pf.first_line_indent = Cm(-0.55)
        r0 = p.add_run(f"{i}.  ")
        r0.bold = True
        r0.font.size = Pt(size)
        r0.font.color.rgb = TEAL
        set_run_fonts(r0, BODY)
        r = p.add_run(item)
        r.font.size = Pt(size)
        r.font.color.rgb = INK
        set_run_fonts(r, BODY)


def table(headers, rows, widths, header_bg=NAVY_HEX, font_pt=8.5, zebra=True,
          bold_first=False, align_center=None, header_pt=8.2, keep=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    table_borders(t)
    cell_margins(t)

    hdr = t.rows[0]
    for i, htext in enumerate(headers):
        cell = hdr.cells[i]
        cell.width = Cm(widths[i])
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        shade(cell, header_bg)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(htext)
        r.bold = True
        r.font.size = Pt(header_pt)
        r.font.color.rgb = WHITE
        set_run_fonts(r, BODY)

    for ridx, row in enumerate(rows):
        cells = t.add_row().cells
        for i, value in enumerate(row):
            cell = cells[i]
            cell.width = Cm(widths[i])
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if zebra and ridx % 2 == 1:
                shade(cell, ZEBRA)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.line_spacing = 1.08
            if align_center and i in align_center:
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(str(value))
            r.font.size = Pt(font_pt)
            r.font.color.rgb = INK
            r.bold = bool(bold_first and i == 0)
            set_run_fonts(r, BODY)

    keep_together(t)
    # Las tablas cortas no se parten; las largas sí, con el encabezado repetido.
    if keep is None:
        keep = len(rows) <= 6
    if keep:
        # Mantiene la tabla en una sola página: cada fila "pide" que la
        # siguiente la acompañe, salvo la última.
        for row in t.rows[:-1]:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    paragraph.paragraph_format.keep_with_next = True
    return t


def spacer(pts=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run("")
    r.font.size = Pt(pts)


def vspace(pts):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    pf.line_spacing = Pt(pts)
    r = p.add_run("")
    r.font.size = Pt(1)
    return p


def caption(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(text)
    r.italic = True
    r.font.size = Pt(8)
    r.font.color.rgb = MUTED
    set_run_fonts(r, BODY)


def picture(name, width_cm=17.0):
    doc.add_picture(os.path.join(ASSETS, name), width=Cm(width_cm))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.paragraphs[-1].paragraph_format.space_before = Pt(4)
    doc.paragraphs[-1].paragraph_format.space_after = Pt(0)


def callout(title, body, accent=TEAL_HEX, fill=LIGHT):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    side_border(t, "left", accent, 18)
    cell_margins(t, top=140, bottom=140, left=220, right=180)
    cell = t.rows[0].cells[0]
    cell.width = Cm(CONTENT_W)
    shade(cell, fill)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.05
    if title:
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(9.2)
        r.font.color.rgb = NAVY
        set_run_fonts(r, BODY)
        p2 = cell.add_paragraph()
    else:
        p2 = p
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.line_spacing = 1.12
    p2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r2 = p2.add_run(body)
    r2.font.size = Pt(9.2)
    r2.font.color.rgb = INK
    set_run_fonts(r2, BODY)
    keep_together(t)
    spacer(10)


def code_block(lines):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    side_border(t, "left", "C9D3DD", 12)
    cell_margins(t, top=140, bottom=140, left=200, right=140)
    cell = t.rows[0].cells[0]
    cell.width = Cm(CONTENT_W)
    shade(cell, "F6F8FA")
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    for i, line in enumerate(lines):
        if i:
            p.add_run().add_break()
        r = p.add_run(line)
        r.font.size = Pt(8.2)
        r.font.color.rgb = RGBColor(0x33, 0x40, 0x4D)
        set_run_fonts(r, "Consolas")
    keep_together(t)
    spacer(10)


def add_field(paragraph, instr, placeholder="1"):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = f" {instr} "
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    txt = OxmlElement("w:t")
    txt.text = placeholder
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr_el)
    run._r.append(fld_sep)
    run._r.append(txt)
    run._r.append(fld_end)
    return run


# ------------------------------------------------------------ estilos y página
def setup_document():
    style = doc.styles["Normal"]
    style.font.name = BODY
    style.font.size = Pt(10)
    style.font.color.rgb = INK
    rPr = style.element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(attr), BODY)

    for name, size, color in (("Heading 1", 14.5, NAVY), ("Heading 2", 11.5, NAVY)):
        st = doc.styles[name]
        st.font.name = HEAD
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = color
        st.font.italic = False
        rPr = st.element.get_or_add_rPr()
        rFonts = rPr.find(qn("w:rFonts"))
        if rFonts is None:
            rFonts = OxmlElement("w:rFonts")
            rPr.append(rFonts)
        for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
            rFonts.set(qn(attr), HEAD)

    lb = doc.styles["List Bullet"]
    lb.font.name = BODY
    lb.font.size = Pt(9.8)

    for name in ("Header", "Footer"):
        st = doc.styles[name]
        pf = st.paragraph_format
        pf.tab_stops.clear_all()
        pf.tab_stops.add_tab_stop(Cm(CONTENT_W), WD_TAB_ALIGNMENT.RIGHT)
        st.font.name = BODY
        st.font.size = Pt(8)

    section = doc.sections[0]
    section.page_width = Cm(21.59)
    section.page_height = Cm(27.94)
    section.left_margin = Cm(2.1)
    section.right_margin = Cm(2.1)
    section.top_margin = Cm(2.1)
    section.bottom_margin = Cm(1.9)
    section.header_distance = Cm(1.0)
    section.footer_distance = Cm(0.9)
    section.different_first_page_header_footer = True
    return section


def setup_header_footer(section):
    header = section.header
    hp = header.paragraphs[0]
    hp.paragraph_format.space_after = Pt(4)
    hp.paragraph_format.tab_stops.clear_all()
    hp.paragraph_format.tab_stops.add_tab_stop(Cm(CONTENT_W), WD_TAB_ALIGNMENT.RIGHT)
    r = hp.add_run("MiConjunto")
    r.bold = True
    r.font.size = Pt(8)
    r.font.color.rgb = NAVY
    set_run_fonts(r, BODY)
    r2 = hp.add_run("   ·   Propuesta funcional y técnica")
    r2.font.size = Pt(8)
    r2.font.color.rgb = MUTED
    set_run_fonts(r2, BODY)
    hp.add_run("\t")
    r3 = hp.add_run("v1.1")
    r3.font.size = Pt(8)
    r3.font.color.rgb = MUTED
    set_run_fonts(r3, BODY)

    pPr = hp._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), BORDER)
    pBdr.append(bottom)
    pPr.insert_element_before(
        pBdr, "w:shd", "w:tabs", "w:spacing", "w:ind", "w:jc", "w:outlineLvl", "w:rPr",
    )

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.paragraph_format.tab_stops.clear_all()
    fp.paragraph_format.tab_stops.add_tab_stop(Cm(CONTENT_W), WD_TAB_ALIGNMENT.RIGHT)
    r = fp.add_run("Documento de trabajo · Octubre de 2026")
    r.font.size = Pt(7.6)
    r.font.color.rgb = MUTED
    set_run_fonts(r, BODY)
    fp.add_run("\t")
    r2 = fp.add_run("Página ")
    r2.font.size = Pt(7.6)
    r2.font.color.rgb = MUTED
    set_run_fonts(r2, BODY)
    fr = add_field(fp, "PAGE")
    fr.font.size = Pt(7.6)
    fr.font.color.rgb = MUTED
    fr.bold = True
    set_run_fonts(fr, BODY)
    r3 = fp.add_run(" de ")
    r3.font.size = Pt(7.6)
    r3.font.color.rgb = MUTED
    set_run_fonts(r3, BODY)
    fr2 = add_field(fp, "NUMPAGES", "12")
    fr2.font.size = Pt(7.6)
    fr2.font.color.rgb = MUTED
    set_run_fonts(fr2, BODY)


# --------------------------------------------------------------------- portada
def portada():
    vspace(74)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run("P R O P U E S T A   D E   P R O Y E C T O")
    r.font.size = Pt(8.5)
    r.font.color.rgb = TEAL
    r.bold = True
    set_run_fonts(r, BODY)

    # Bloque de título
    t = doc.add_table(rows=1, cols=1)
    t.autofit = False
    no_borders(t)
    cell_margins(t, top=520, bottom=520, left=480, right=420)
    cell = t.rows[0].cells[0]
    cell.width = Cm(CONTENT_W)
    shade(cell, NAVY_HEX)

    p1 = cell.paragraphs[0]
    p1.paragraph_format.space_after = Pt(2)
    r1 = p1.add_run("MiConjunto")
    r1.font.size = Pt(38)
    r1.bold = True
    r1.font.color.rgb = WHITE
    set_run_fonts(r1, HEAD)

    p2 = cell.add_paragraph()
    p2.paragraph_format.space_after = Pt(2)
    p2.paragraph_format.line_spacing = 1.0
    r2 = p2.add_run("Plataforma de administración")
    r2.font.size = Pt(16)
    r2.font.color.rgb = RGBColor(0xC9, 0xD8, 0xE8)
    set_run_fonts(r2, BODY)

    p3 = cell.add_paragraph()
    p3.paragraph_format.space_after = Pt(14)
    p3.paragraph_format.line_spacing = 1.0
    r3 = p3.add_run("para conjuntos residenciales")
    r3.font.size = Pt(16)
    r3.font.color.rgb = RGBColor(0xC9, 0xD8, 0xE8)
    set_run_fonts(r3, BODY)

    p4 = cell.add_paragraph()
    p4.paragraph_format.space_after = Pt(0)
    r4 = p4.add_run("Sin contabilidad  ·  Sin manejo de dinero  ·  Con trazabilidad")
    r4.font.size = Pt(9)
    r4.font.color.rgb = RGBColor(0x8F, 0xB3, 0xD0)
    set_run_fonts(r4, BODY)

    spacer(18)
    para(
        "Este documento describe qué se va a construir, cómo funcionará cada módulo, "
        "con qué tecnología y en cuánto tiempo. Es la base para aprobar el alcance antes "
        "de escribir la primera línea de código: cualquier ajuste aquí cuesta minutos; "
        "el mismo ajuste con el software ya construido cuesta semanas.",
        size=10.5, color=INK, space_after=16,
    )

    t2 = None
    datos = [
        ("Preparado para", "Administración del conjunto residencial"),
        ("Fecha", "29 de octubre de 2026"),
        ("Versión", "1.1 — actualizada con la infraestructura en producción"),
        ("Contenido", "Alcance funcional, modelo de datos, arquitectura y plan de trabajo"),
    ]
    for k, v in datos:
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_after = Pt(5)
        pf.space_before = Pt(0)
        pf.line_spacing = 1.0
        pf.tab_stops.clear_all()
        pf.tab_stops.add_tab_stop(Cm(4.4), WD_TAB_ALIGNMENT.LEFT)
        rk = p.add_run(k.upper() + "\t")
        rk.font.size = Pt(7.4)
        rk.bold = True
        rk.font.color.rgb = MUTED
        set_run_fonts(rk, BODY)
        rv = p.add_run(v)
        rv.font.size = Pt(9)
        rv.font.color.rgb = INK
        set_run_fonts(rv, BODY)

    vspace(168)
    para(
        "Documento de trabajo. No sustituye el reglamento de propiedad horizontal, "
        "ni constituye asesoría legal o contable.",
        size=7.8, color=MUTED, italic=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=0,
    )

    doc.add_page_break()


# ---------------------------------------------------------------------- índice
INDICE = [
    ("1", "Resumen ejecutivo"),
    ("2", "De dónde partimos"),
    ("3", "Objetivos del proyecto"),
    ("4", "Alcance: lo que entra y lo que no"),
    ("5", "Usuarios y permisos"),
    ("6", "Módulos funcionales"),
    ("7", "Flujos principales"),
    ("8", "Modelo de datos preliminar"),
    ("9", "Arquitectura y tecnología"),
    ("10", "Experiencia de uso"),
    ("11", "Plan de trabajo por fases"),
    ("12", "Criterios de aceptación"),
    ("13", "Riesgos y supuestos"),
    ("14", "Decisiones pendientes y próximos pasos"),
]


def indice():
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("Contenido")
    r.font.size = Pt(20)
    r.bold = True
    r.font.color.rgb = NAVY
    set_run_fonts(r, HEAD)

    para("Quince minutos de lectura. Cada sección responde una pregunta distinta; "
         "si solo tienes cinco, lee el resumen ejecutivo y la sección 4.",
         size=9.5, color=MUTED, space_after=16, align=WD_ALIGN_PARAGRAPH.LEFT)

    for num, title in INDICE:
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_after = Pt(7)
        pf.line_spacing = 1.0
        pf.tab_stops.add_tab_stop(Cm(1.6), WD_TAB_ALIGNMENT.LEFT)
        pf.tab_stops.add_tab_stop(Cm(CONTENT_W), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        r0 = p.add_run(num.zfill(2))
        r0.font.size = Pt(9)
        r0.bold = True
        r0.font.color.rgb = TEAL
        set_run_fonts(r0, BODY)
        r1 = p.add_run("\t" + title)
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = INK
        set_run_fonts(r1, BODY)

    spacer(24)
    callout(
        "Cómo leer este documento",
        "Las decisiones que necesito de tu parte están concentradas en la sección 14. "
        "Si algo del alcance no corresponde a lo que tienes en mente, ese es el momento "
        "de cambiarlo: la propuesta está pensada para discutirse, no para firmarse tal cual.",
    )

    doc.add_page_break()


# ------------------------------------------------------------------- contenido
def seccion_1():
    h1("1", "Resumen ejecutivo")
    para(
        "MiConjunto es una aplicación web para administrar un conjunto residencial: saber "
        "quién vive en cada unidad, quién entra y sale, qué zonas comunes se reservan, qué "
        "solicitudes están abiertas, qué se comunicó y qué se decidió en asamblea. Su propósito "
        "es reemplazar el cuaderno de portería, las hojas de cálculo dispersas y los grupos de "
        "WhatsApp por un registro único, ordenado y consultable."
    )
    para(
        "El alcance excluye deliberadamente la contabilidad y el manejo de dinero. La plataforma "
        "no recibe pagos, no calcula intereses, no emite recibos ni genera estados financieros. "
        "Sí permite registrar y consultar el estado de pago de cada unidad como información de "
        "referencia, con los datos que la administración cargue a mano o importe desde un archivo."
    )
    para("En concreto, la versión 1 entrega siete módulos:", space_after=8)

    table(
        ["Módulo", "Qué resuelve", "Quién lo usa"],
        [
            ["Unidades y residentes", "Ficha única de cada unidad, propietarios, residentes, vehículos y mascotas.",
             "Administración"],
            ["Portería y paquetería", "Autorizaciones de visita, registro de entradas y salidas, control de encomiendas.",
             "Portería, residente"],
            ["Zonas comunes", "Reserva de salón comunal, BBQ, cancha y demás áreas, con reglas y cupos.",
             "Residente, administración"],
            ["PQRS y mantenimiento", "Radicación, asignación, seguimiento y cierre de solicitudes con plazos.",
             "Todos"],
            ["Comunicados y documentos", "Circulares, actas y reglamento con control de lectura.",
             "Administración, residente"],
            ["Asambleas y votaciones", "Convocatoria, registro de asistencia, quórum y votación de decisiones.",
             "Administración, propietario"],
            ["Alícuotas y pagos", "Estado informativo de pago por unidad y periodo, sin mover dinero.",
             "Administración, residente"],
        ],
        widths=[4.5, 9.4, 3.5],
        bold_first=True,
    )
    spacer(8)

    callout(
        "La decisión de alcance más importante",
        "La plataforma no mueve dinero. El módulo de alícuotas es un tablero de estado: muestra "
        "quién está al día y quién no, según lo que la administración registre. No hay pasarela de "
        "pagos, no hay recaudo, no hay conciliación bancaria y no se generan obligaciones contables. "
        "Si más adelante se quiere cobrar en línea, se integra un servicio externo y se revisa el "
        "alcance con un contador; hoy esa puerta queda cerrada a propósito.",
    )

    para("Lo que cambia para el conjunto, en términos prácticos:", space_after=4)
    bullet("la portería deja de depender de la memoria de quien está en el turno;", bold_prefix="Trazabilidad: ")
    bullet("cada solicitud tiene responsable, estado y fecha, y nada se pierde en un chat;",
           bold_prefix="Solicitudes: ")
    bullet("el residente consulta y reserva sin llamar a la administración;", bold_prefix="Autonomía: ")
    bullet("los comunicados quedan publicados con evidencia de quién los leyó;", bold_prefix="Comunicación: ")
    bullet("la asamblea tiene lista de asistencia, quórum calculado y resultados en acta.",
           bold_prefix="Decisiones: ")


def seccion_2():
    h1("2", "De dónde partimos")
    para(
        "Casi todos los conjuntos pequeños y medianos operan con las mismas herramientas: un "
        "cuaderno en portería, una hoja de cálculo con los residentes, un grupo de WhatsApp y la "
        "memoria de la administradora. Funciona hasta que cambia el turno, se va la administradora "
        "o hay que demostrar algo que pasó hace tres meses."
    )
    table(
        ["Situación típica hoy", "Con MiConjunto"],
        [
            ["El registro de visitantes está en un cuaderno físico: ilegible, incompleto y sin respaldo.",
             "Registro digital con hora, unidad visitada, quién autorizó y salida."],
            ["Los paquetes se entregan \"al que pregunte\" y a veces se pierden.",
             "Cada encomienda tiene receptor, fecha, aviso al residente y firma de entrega."],
            ["Las reservas del salón se piden por llamada y se cruzan dos eventos el mismo día.",
             "Calendario con cupos, reglas por zona y bloqueo automático de cruces."],
            ["Las quejas se cuentan de palabra y no se sabe en qué quedaron.",
             "Radicado con número, responsable, plazo y bitácora de seguimiento."],
            ["El comunicado se pierde entre 200 mensajes y nadie sabe si se leyó.",
             "Publicación segmentada con acuse de lectura y fecha."],
            ["La asamblea se decide \"a mano alzada\" y el acta queda incompleta.",
             "Lista de asistencia, quórum calculado por coeficiente y votación registrada."],
            ["La mora se comenta pero nadie tiene el panorama completo.",
             "Tablero informativo de estado de pago por unidad y periodo."],
        ],
        widths=[8.7, 8.7],
    )
    spacer(6)
    para(
        "El objetivo no es digitalizar por digitalizar. Es que la información resida en un solo "
        "lugar, que sobreviva a los cambios de personal y que cualquier decisión de la administración "
        "pueda sustentarse con un registro.",
        space_before=6,
    )


def seccion_3():
    h1("3", "Objetivos del proyecto")
    h2("Objetivo general", "3.1")
    para(
        "Construir una aplicación web que centralice la operación no financiera de un conjunto "
        "residencial, de modo que administración, portería y residentes trabajen sobre la misma "
        "información y cada actuación quede registrada."
    )

    h2("Objetivos específicos", "3.2")
    numbered([
        "Unificar en una sola ficha la información de unidades, propietarios, residentes, vehículos y mascotas.",
        "Digitalizar el control de visitantes y de paquetería con registro de entrada, salida y responsable.",
        "Automatizar la reserva de zonas comunes aplicando cupos y reglas sin intervención manual.",
        "Dar trazabilidad completa a las PQRS y a las órdenes de mantenimiento, con plazos visibles.",
        "Publicar comunicados y documentos con evidencia de lectura y vigencia.",
        "Facilitar la convocatoria, el quórum y la votación de asambleas con resultados verificables.",
        "Ofrecer a la administración un tablero informativo del estado de alícuotas por unidad.",
    ])

    h2("Criterios de éxito", "3.3")
    table(
        ["Indicador", "Meta para los primeros tres meses"],
        [
            ["Visitas registradas en la plataforma", "100 % de las visitas del conjunto"],
            ["Encomiendas con firma de entrega", "Mínimo 95 %"],
            ["PQRS cerradas dentro del plazo", "Mínimo 90 %"],
            ["Residentes con cuenta activa", "Mínimo 70 % de las unidades"],
            ["Comunicados con acuse de lectura", "100 % de los publicados"],
        ],
        widths=[8.7, 8.7],
        bold_first=True,
    )


def seccion_4():
    h1("4", "Alcance: lo que entra y lo que no")
    para(
        "Un proyecto se desordena cuando el alcance no está escrito. Esta sección fija la frontera: "
        "lo de arriba se construye en la versión 1; lo de abajo queda explícitamente fuera y, si se "
        "quiere, se evalúa después como fase separada."
    )

    h2("Dentro del alcance", "4.1")
    para(
        "Los siete módulos descritos en la sección 6, más lo transversal: inicio de sesión con roles, "
        "panel de indicadores, notificaciones por correo, exportación de reportes a PDF y Excel, "
        "bitácora de auditoría y respaldo automático de la información. La aplicación funciona en "
        "navegador de computador y de celular, sin necesidad de instalar nada."
    )

    h2("Fuera del alcance de esta versión", "4.2")
    table(
        ["Excluido", "Por qué queda fuera"],
        [
            ["Contabilidad y estados financieros", "Requieren un contador, un plan de cuentas y software certificado."],
            ["Presupuesto, ejecución y balance", "Es materia contable y de revisión fiscal."],
            ["Pasarela de pagos y recaudo en línea", "Implica manejo de dinero, comisiones y cumplimiento financiero."],
            ["Facturación electrónica y recibos de pago", "Obligaciones tributarias ajenas a la operación del conjunto."],
            ["Cálculo de intereses de mora y acuerdos de pago", "Es cálculo financiero con efectos jurídicos."],
            ["Conciliación bancaria y tesorería", "Depende de extractos y de la contabilidad."],
            ["Nómina y contratación de personal", "Sistema distinto, con obligaciones laborales."],
            ["Aplicación móvil nativa (iOS/Android)", "La versión web instalable (PWA) cubre la necesidad sin duplicar esfuerzo."],
            ["Integración con tornos, biometría o CCTV", "Requiere hardware y proveedores externos; se evalúa como fase futura."],
            ["Chat interno entre residentes", "Fuera del propósito; los canales existentes ya cubren la conversación informal."],
        ],
        widths=[7.2, 10.2],
        bold_first=True,
    )

    h2("El caso particular del «reporte de pagos»", "4.3")
    para(
        "El módulo 7 se llama Alícuotas y pagos, y conviene precisar qué significa. La plataforma "
        "guarda el estado de cada unidad frente a la alícuota del periodo: pagado, pendiente, parcial, "
        "en acuerdo de pago o exonerado, con fecha, medio y comprobante adjunto si la administración "
        "lo tiene. Con eso produce un tablero y un reporte exportable."
    )
    para(
        "Lo que no hace es mover ese dinero ni llevar la cuenta de él. No hay botón de pago, no hay "
        "saldo contable, no hay causación, no hay intereses calculados y no hay conciliación. La "
        "plataforma es un tablero de semáforo, no un libro de tesorería.",
        space_after=8,
    )
    table(
        ["Lo que sí hace", "Lo que no hace"],
        [
            ["Registrar el estado de pago por unidad y periodo.", "Recibir o procesar pagos."],
            ["Adjuntar comprobantes y observaciones.", "Emitir recibos o facturas."],
            ["Importar un archivo con los estados del mes.", "Calcular intereses, sanciones o cuotas."],
            ["Generar un reporte informativo en PDF o Excel.", "Producir estados financieros o balances."],
            ["Marcar unidades en mora para gestión interna.", "Conciliar con extractos bancarios."],
        ],
        widths=[8.7, 8.7],
        font_pt=8.4,
    )


def seccion_5():
    h1("5", "Usuarios y permisos")
    para(
        "La aplicación tiene tres experiencias sobre el mismo sistema. No son tres aplicaciones "
        "distintas: es la misma información vista con permisos diferentes, para que nadie tenga que "
        "aprender dos herramientas."
    )

    table(
        ["Rol", "Quién es", "Qué necesita resolver"],
        [
            ["Administración", "Administrador del conjunto o su equipo.",
             "Configurar el conjunto, mantener la información, atender solicitudes, publicar, convocar y reportar."],
            ["Portería", "Vigilante o auxiliar de portería, en turnos.",
             "Registrar visitas y paquetes con rapidez, consultar autorizaciones y dejar constancia de novedades."],
            ["Residente", "Propietario, arrendatario o familiar autorizado.",
             "Ver su unidad, autorizar visitas, reservar zonas, radicar PQRS, leer comunicados y votar."],
        ],
        widths=[3.4, 4.6, 9.4],
        bold_first=True,
    )
    spacer(8)

    h2("Matriz de permisos", "5.1")
    table(
        ["Módulo", "Administración", "Portería", "Residente"],
        [
            ["Unidades y residentes", "Total", "Consultar", "Su unidad"],
            ["Portería y paquetería", "Total", "Total", "Autorizar y consultar"],
            ["Zonas comunes", "Total", "Consultar", "Reservar"],
            ["PQRS y mantenimiento", "Total", "Registrar novedad", "Radicar y seguir"],
            ["Comunicados y documentos", "Total", "Consultar", "Consultar"],
            ["Asambleas y votaciones", "Total", "—", "Asistir y votar"],
            ["Alícuotas y pagos", "Total", "—", "Su estado"],
        ],
        widths=[5.6, 4.2, 3.6, 4.0],
        bold_first=True,
        align_center={1, 2, 3},
    )
    spacer(6)
    para(
        "«Total» incluye crear, editar, desactivar y exportar. «Consultar» es solo lectura. Los "
        "permisos se validan siempre en el servidor: aunque alguien manipule la interfaz, no puede "
        "ver ni modificar lo que su rol no permite.",
        size=9, color=MUTED, space_after=6,
    )

    callout(
        "Sobre las cuentas de residente",
        "No todos los residentes usarán la aplicación, y está bien. El sistema debe funcionar aunque "
        "solo el 60 % tenga cuenta: la portería puede registrar una visita autorizada por teléfono y "
        "dejar la constancia de quién la autorizó. La adopción se mide, no se impone.",
        accent="C58A2E", fill="FBF3E6",
    )


def modulo(num, title, proposito, funciones, reglas, pantallas):
    h2(title, f"6.{num}")
    para(proposito, space_after=4)
    h3("Funciones principales")
    for f in funciones:
        bullet(f, size=9.4)
    h3("Reglas de negocio")
    for r in reglas:
        bullet(r, size=9.4)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(9)
    p.paragraph_format.space_after = Pt(2)
    r0 = p.add_run("Pantallas:  ")
    r0.bold = True
    r0.font.size = Pt(8.6)
    r0.font.color.rgb = TEAL
    set_run_fonts(r0, BODY)
    r1 = p.add_run(pantallas)
    r1.font.size = Pt(8.6)
    r1.font.color.rgb = MUTED
    set_run_fonts(r1, BODY)


def seccion_6():
    h1("6", "Módulos funcionales")
    para(
        "Cada módulo se describe con su propósito, sus funciones, las reglas que debe respetar y las "
        "pantallas que lo componen. Las reglas son la parte que más conviene revisar: son las que "
        "determinan si el sistema se comporta como el conjunto realmente opera."
    )

    modulo(
        1, "Unidades, residentes y propietarios",
        "Es la base de todo lo demás. Sin una ficha confiable de cada unidad no se pueden validar "
        "visitas, reservas ni estados de pago.",
        [
            "Registro de torres, unidades (apartamento, casa, local, parqueadero) y coeficiente de copropiedad.",
            "Personas vinculadas a una unidad con su rol: propietario, residente, arrendatario o autorizado.",
            "Datos de contacto, número de personas en el hogar, vehículos con placa y mascotas.",
            "Historial de cambios: quién modificó qué y cuándo.",
            "Importación masiva desde Excel para la carga inicial y exportación para respaldo.",
        ],
        [
            "Una unidad puede tener varios propietarios y un propietario varias unidades; el coeficiente se reparte entre ellos.",
            "Una persona no puede estar activa en dos unidades del mismo conjunto sin marcarse como caso especial.",
            "Al desactivar una persona se conserva el historial, pero pierde acceso a la aplicación de inmediato.",
            "Los datos personales se tratan con la finalidad declarada y con consentimiento registrado.",
        ],
        "Listado de unidades con filtros · Ficha de unidad · Ficha de persona · Importar / exportar.",
    )

    modulo(
        2, "Portería: visitantes y paquetería",
        "Es el módulo de uso más intenso. Debe funcionar en una tablet con pantalla táctil, en menos "
        "de treinta segundos por registro y sin depender de que el residente conteste el teléfono.",
        [
            "Autorización previa de visita por parte del residente, con nombre, documento, placa y vigencia.",
            "Código corto o QR que el visitante presenta en portería para validar la autorización.",
            "Registro de entrada y salida con hora, unidad visitada, funcionario que registró y observaciones.",
            "Bitácora de novedades del turno: incidentes, rondas, cambios de turno y pendientes.",
            "Recepción de paquetes con foto, transportadora, destinatario y aviso automático al residente.",
            "Entrega de paquete con firma digital o captura del nombre de quien recibe.",
        ],
        [
            "Una autorización vence al terminar su vigencia o al registrarse la salida, lo que ocurra primero.",
            "Si el visitante no tiene autorización, portería puede llamar al residente y registrar la autorización verbal dejando constancia.",
            "Las visitas sin salida registrada se marcan como pendientes al cierre del turno y aparecen en el informe diario.",
            "Los paquetes sin reclamar después de cinco días generan alerta a la administración.",
            "Toda modificación de un registro queda en la bitácora de auditoría; nada se borra, se anula con motivo.",
        ],
        "Tablero de portería · Autorizaciones del día · Registro de visita · Paquetes pendientes · Bitácora del turno.",
    )

    modulo(
        3, "Reservas de zonas comunes",
        "Reemplaza la llamada a la administración y el cuaderno de reservas por un calendario con "
        "reglas claras que se aplican solas.",
        [
            "Catálogo de zonas con aforo, horario, duración máxima, cupo por unidad y tarifa simbólica opcional (solo informativa).",
            "Calendario por zona con vista de día y de semana, y disponibilidad en tiempo real.",
            "Solicitud de reserva con fecha, franja, número de asistentes y aceptación del reglamento.",
            "Aprobación automática según reglas o aprobación manual de la administración, configurable por zona.",
            "Cancelación con motivo y registro de uso real (asistió / no asistió).",
        ],
        [
            "No se permiten dos reservas activas en la misma zona y franja.",
            "Cada unidad tiene un cupo mensual por zona, configurable; al agotarlo, la solicitud se rechaza con explicación.",
            "La reserva debe hacerse con una anticipación mínima y máxima definidas por zona.",
            "Quien no usa una reserva sin cancelar acumula una inasistencia; tras tres, se restringe la reserva por un mes.",
            "Las zonas pueden bloquearse por mantenimiento sin afectar reservas ya confirmadas (se notifica el cambio).",
        ],
        "Calendario de zonas · Detalle de zona · Mis reservas · Panel de aprobación · Reporte de uso.",
    )

    modulo(
        4, "PQRS y mantenimiento",
        "Convierte quejas dispersas en solicitudes con número, dueño, plazo y evidencia. Es el módulo "
        "que más reduce la sensación de «nadie me responde».",
        [
            "Radicación con categoría (petición, queja, reclamo, sugerencia, mantenimiento), descripción y adjuntos.",
            "Asignación a un responsable con plazo calculado en días hábiles y semáforo de vencimiento.",
            "Hilo de seguimiento visible para quien radicó, con respuestas y cambios de estado.",
            "Órdenes de mantenimiento con proveedor, costo estimado (sin contabilizar), evidencia fotográfica y cierre.",
            "Encuesta breve de satisfacción al cerrar y reporte de tiempos de respuesta.",
        ],
        [
            "Toda PQRS recibe un número consecutivo visible para el residente.",
            "El plazo por defecto es de quince días hábiles y se detiene si se solicita información al ciudadano.",
            "El cierre exige una respuesta escrita y, si aplica, evidencia de la corrección.",
            "Una PQRS reabierta conserva su número original y su historial completo.",
            "Los casos de seguridad o riesgo se escalan de inmediato a la administración y no esperan el plazo normal.",
        ],
        "Bandeja de PQRS · Formulario de radicación · Detalle con historial · Órdenes de mantenimiento · Reporte de tiempos.",
    )

    modulo(
        5, "Comunicados y documentos",
        "Un solo lugar donde está lo que el conjunto dijo y lo que el conjunto aprobó, con evidencia "
        "de quién lo leyó.",
        [
            "Publicación de comunicados con título, contenido, adjuntos y fecha de vigencia.",
            "Segmentación por torre, tipo de unidad o rol; programación de publicación.",
            "Acuse de lectura por residente, con fecha y hora, y recordatorio a quienes no han leído.",
            "Biblioteca de documentos: reglamento, actas, manuales, pólizas, contratos y certificados.",
            "Versionado de documentos: se conserva la versión anterior y la fecha de reemplazo.",
        ],
        [
            "Un comunicado puede marcarse como «requiere lectura»; en ese caso se muestra al ingresar hasta que se confirme.",
            "Los documentos con datos personales o información sensible se restringen por rol.",
            "Nada se elimina de la biblioteca sin dejar registro de quién lo hizo y por qué.",
        ],
        "Muro de comunicados · Editor de comunicado · Biblioteca de documentos · Reporte de lectura.",
    )

    modulo(
        6, "Asambleas y votaciones",
        "El módulo más delicado en términos de confianza: debe demostrar que el quórum y los votos "
        "corresponden a la realidad, y que el resultado es verificable.",
        [
            "Convocatoria con fecha, hora, lugar, orden del día y documentos anexos.",
            "Registro de asistencia presencial y virtual, con validación por unidad y coeficiente.",
            "Cálculo de quórum en tiempo real: porcentaje de coeficientes representados.",
            "Votación por punto del orden del día, con opciones configurables y registro de abstención.",
            "Generación del acta con asistencia, quórum, votaciones y resultados; publicación en la biblioteca.",
        ],
        [
            "La convocatoria se publica con la antelación que exijan el reglamento y la Ley 675 de 2001; el sistema no permite publicarla después del límite.",
            "El quórum se calcula sobre coeficientes de copropiedad, no sobre número de personas.",
            "Cada unidad emite un voto por punto; si hay varios propietarios, se define un representante antes de votar.",
            "El voto es inmutable una vez registrado; solo se corrige mediante acta y con autorización de la administración.",
            "El resultado muestra votos a favor, en contra, abstenciones y coeficiente representado.",
        ],
        "Listado de asambleas · Convocatoria · Sala de asamblea (quórum y votación) · Acta generada · Historial.",
    )

    modulo(
        7, "Alícuotas y estado de pagos",
        "Módulo informativo. Responde a la pregunta «¿cómo va la cartera?» sin convertirse en un "
        "sistema contable ni en una pasarela de pagos.",
        [
            "Definición de periodos (mensual, bimestral) y del valor de alícuota por tipo de unidad, como dato de referencia.",
            "Registro del estado por unidad y periodo: pagado, pendiente, parcial, en acuerdo, exonerado.",
            "Carga manual o importación desde archivo con fecha de pago, medio y comprobante adjunto.",
            "Tablero con porcentaje de recaudo informativo, unidades en mora y evolución por periodo.",
            "Reporte exportable en PDF y Excel para llevar a la reunión de consejo.",
        ],
        [
            "El sistema nunca calcula intereses, sanciones ni ajustes: solo registra lo que la administración informa.",
            "Un pago marcado como «pagado» requiere fecha y medio; el comprobante es opcional pero recomendado.",
            "Los cambios de estado quedan en auditoría con usuario, fecha y valor anterior.",
            "El residente ve únicamente el estado de su unidad, nunca el de las demás.",
            "Los reportes llevan la leyenda «información de referencia, no constituye estado financiero».",
        ],
        "Tablero de cartera · Detalle por unidad · Carga e importación · Reporte por periodo.",
    )


def seccion_7():
    h1("7", "Flujos principales")
    para(
        "Dos flujos concentran la mayor parte del uso diario. Si estos dos funcionan rápido y sin "
        "fricción, el resto de la aplicación se adopta solo."
    )
    picture("flujos.png", 16.6)
    caption("Figura 1. Flujo de una visita y flujo de una reserva, de principio a fin.")
    para(
        "El flujo de visita está diseñado para que el residente pueda autorizar desde el celular en "
        "diez segundos, incluso si el visitante llega sin aviso. El flujo de reserva está diseñado "
        "para que la respuesta sea inmediata cuando las reglas se cumplen, y para que la negativa "
        "explique siempre el motivo."
    )


def seccion_8():
    h1("8", "Modelo de datos preliminar")
    para(
        "El modelo se organiza alrededor de tres ideas: la unidad es el centro de la información, la "
        "persona se vincula a la unidad con un rol, y todo lo que ocurre genera un registro con fecha "
        "y responsable. La tabla siguiente es un borrador de trabajo; los campos definitivos se "
        "ajustan durante la fase 1."
    )
    table(
        ["Entidad", "Propósito", "Campos principales"],
        [
            ["Conjunto", "Configuración general.", "Nombre, NIT, dirección, coeficiente total, reglamento."],
            ["Torre", "Agrupación de unidades.", "Nombre, número de pisos."],
            ["Unidad", "Apartamento, casa, local o parqueadero.", "Identificador, tipo, coeficiente, área, estado."],
            ["Persona", "Propietario, residente o autorizado.", "Nombre, documento, correo, teléfono, consentimiento."],
            ["Vinculación", "Relación persona–unidad.", "Rol, fecha inicio, fecha fin, es representante."],
            ["Vehículo / Mascota", "Bienes asociados a la unidad.", "Placa, tipo, marca; nombre, especie, raza."],
            ["Perfil", "Cuenta de Supabase Auth ligada al conjunto.", "Correo, rol, conjunto, unidad y estado."],
            ["Autorización", "Permiso de visita.", "Visitante, documento, placa, vigencia, código."],
            ["Visita", "Registro de entrada y salida.", "Unidad, autorización, entrada, salida, funcionario."],
            ["Paquete", "Encomienda recibida.", "Transportadora, destinatario, recepción, entrega, firma."],
            ["Zona y regla", "Área común y sus condiciones.", "Aforo, horario, duración, cupo, aprobación."],
            ["Reserva", "Uso programado de una zona.", "Unidad, zona, fecha, franja, estado, uso real."],
            ["PQRS", "Solicitud del residente.", "Número, categoría, descripción, estado, plazo, responsable."],
            ["Seguimiento", "Historial de una PQRS.", "Autor, comentario, estado anterior y nuevo, adjuntos."],
            ["Comunicado / Documento", "Información oficial.", "Título, cuerpo, segmento, vigencia, versión."],
            ["Acuse de lectura", "Evidencia de lectura.", "Comunicado, usuario, fecha y hora."],
            ["Asamblea", "Reunión de copropietarios.", "Fecha, tipo, convocatoria, quórum, estado."],
            ["Punto y votación", "Orden del día y decisión.", "Punto, opciones, votos, coeficiente, resultado."],
            ["Periodo / Estado de pago", "Referencia de alícuota.", "Periodo, unidad, estado, fecha, medio, comprobante."],
            ["Auditoría", "Trazabilidad del sistema.", "Usuario, acción, entidad, valor anterior, fecha, IP."],
        ],
        widths=[3.6, 4.8, 9.0],
        font_pt=7.9,
        bold_first=True,
    )
    spacer(6)
    para("Relaciones que conviene tener claras desde el inicio:", space_after=4, space_before=4)
    bullet("una unidad tiene muchos registros de visita, paquete, reserva, PQRS y estado de pago;", size=9.2)
    bullet("una persona puede vincularse a varias unidades, pero solo una vinculación activa por unidad;", size=9.2)
    bullet("un voto pertenece a una unidad y a un punto de asamblea, y es único por unidad y punto;", size=9.2)
    bullet("todo registro tiene creador, fecha de creación y fecha de actualización, y nada se elimina físicamente.", size=9.2)


def seccion_9():
    h1("9", "Arquitectura y tecnología")
    para(
        "La infraestructura ya está construida y en producción: Supabase para datos y autenticación, "
        "Vercel para la aplicación, GitHub para el código. Esta sección describe cómo quedó y por qué, "
        "no un diseño hipotético."
    )

    callout(
        "Estado a la fecha de esta versión",
        "Base de datos con ocho tablas y diecisiete políticas de aislamiento, autenticación funcionando, "
        "panel protegido por rol y despliegue automático desde la rama principal. La propuesta describe "
        "el sistema que ya opera, con los módulos restantes por construir.",
    )

    h2("Pila tecnológica", "9.1")
    table(
        ["Capa", "Tecnología", "Por qué"],
        [
            ["Interfaz", "Next.js 16 (App Router, React 19)", "Un solo proyecto para pantallas y servidor; carga rápida y buen comportamiento en celular."],
            ["Estilos", "Tailwind CSS 4", "Diseño consistente y adaptable sin hojas de estilo interminables."],
            ["Lógica", "Server Actions y validación en servidor", "Las reglas viven donde nadie puede alterarlas desde el navegador."],
            ["Base de datos", "Supabase · PostgreSQL", "Multiusuario real, acceso desde cualquier lugar y respaldo administrado."],
            ["Aislamiento", "Row Level Security (RLS)", "Cada consulta se filtra en la base por conjunto y por unidad, no en la interfaz."],
            ["Autenticación", "Supabase Auth", "Inicio de sesión, recuperación de contraseña y sesión por cookies httpOnly."],
            ["Archivos", "Supabase Storage", "Documentos, fotos y comprobantes fuera del código, con control de acceso."],
            ["Despliegue", "Vercel", "Publicación automática desde GitHub, HTTPS y entorno de vista previa por rama."],
            ["Correo", "SMTP configurable", "Avisos de visitas, paquetes y comunicados."],
        ],
        widths=[3.0, 5.6, 8.8],
        font_pt=8.2,
        bold_first=True,
    )
    spacer(8)

    callout(
        "Por qué una base de datos administrada y no un archivo local",
        "Un conjunto de 200 a 500 unidades genera del orden de 100.000 registros al año, un volumen "
        "que PostgreSQL maneja sin esfuerzo. La diferencia frente a un archivo local no es la capacidad "
        "sino la operación: acceso desde el celular del residente, respaldos administrados, aislamiento "
        "por fila y ninguna copia que se pueda perder con el computador de la portería.",
    )

    h2("Requisitos mínimos de operación", "9.2")
    table(
        ["Componente", "Mínimo recomendado"],
        [
            ["Navegador", "Chrome, Edge, Safari o Firefox en versión reciente; no hay nada que instalar en los equipos."],
            ["Conexión a internet", "Banda ancha estable en administración y portería; 5 Mbps son suficientes para todo el conjunto."],
            ["Cuentas", "Un proyecto de Supabase y uno de Vercel; el plan gratuito alcanza para operar y probar."],
            ["Dominio", "Opcional; se puede usar el subdominio gratuito de Vercel mientras se decide."],
            ["Correo saliente", "Opcional en la primera fase; se configura cuando se activen las notificaciones."],
        ],
        widths=[4.6, 12.8],
        font_pt=8.4,
        bold_first=True,
    )
    spacer(10)

    h2("Cómo se organiza el sistema", "9.3")
    picture("arquitectura.png", 16.8)
    caption("Figura 2. Arquitectura en capas: usuarios, aplicación en Vercel, datos en Supabase y servicios de apoyo.")

    para(
        "La aplicación no guarda datos propios: cada petición se autentica y consulta Supabase, que "
        "aplica las políticas de aislamiento antes de devolver una sola fila. Por eso la seguridad no "
        "depende de que la interfaz oculte botones ni de que el residente escriba una dirección distinta.",
        space_before=8,
    )
    para(
        "Tampoco hay un servidor que administrar: no se actualiza un sistema operativo, ni un motor de "
        "base de datos, ni un certificado. El conjunto se concentra en operar, no en mantener infraestructura."
    )

    h2("Estructura del proyecto", "9.4")
    code_block([
        "app/",
        "  page.tsx                  redirige según la sesión",
        "  ingresar/                 inicio de sesión (Server Action)",
        "  panel/                    área privada: layout, panel y acciones",
        "  estado/                   diagnóstico de conexión",
        "utils/supabase/",
        "  env.ts                    lectura validada de variables",
        "  server.ts                 cliente para servidor",
        "  client.ts                 cliente para navegador",
        "  proxy.ts                  refresco de sesión",
        "proxy.ts                    equivalente a middleware en Next 16",
        "supabase/",
        "  migrations/0001_nucleo.sql        tablas, índices y políticas RLS",
        "  scripts/0002_primer_conjunto.sql  conjunto inicial y administrador",
        "scripts/",
        "  check-supabase.mjs        verificación de conexión",
        "  vercel-deploy.mjs         despliegue por API",
        "docs/propuesta/             este documento",
    ])

    h2("Seguridad y privacidad", "9.5")
    bullet("RLS activo en las ocho tablas del núcleo, con diecisiete políticas de acceso por rol y por unidad;", size=9.3)
    bullet("el rol vive en la base de datos, no en la interfaz: manipular la pantalla no amplía permisos;", size=9.3)
    bullet("la clave publicable puede viajar al navegador; la clave secreta y la cadena de conexión nunca salen del servidor;", size=9.3)
    bullet("sesión en cookie httpOnly, con refresco en cada petición y cierre al cerrar sesión;", size=9.3)
    bullet("HTTPS obligatorio, con certificado administrado por Vercel;", size=9.3)
    bullet("datos personales tratados conforme a la Ley 1581 de 2012: finalidad, consentimiento y derechos del titular;", size=9.3)
    bullet("respaldos administrados por Supabase, con exportación periódica a un destino propio.", size=9.3)

    h2("Entornos de trabajo", "9.6")
    table(
        ["Entorno", "Dónde vive", "Para qué sirve"],
        [
            ["Local", "Tu computador, con el proyecto y Supabase real", "Desarrollo y pruebas antes de publicar."],
            ["Vista previa", "Una URL de Vercel por rama o por pull request", "Revisar un cambio sin afectar a los residentes."],
            ["Producción", "miconjunto-rose.vercel.app", "Uso real del conjunto; se actualiza al integrar en la rama principal."],
        ],
        widths=[3.4, 6.6, 7.4],
        font_pt=8.3,
        bold_first=True,
    )
    spacer(10)

    h2("Operación y costos", "9.7")
    table(
        ["Servicio", "Plan para arrancar", "Cuándo conviene subir"],
        [
            ["Supabase", "Gratuito: 500 MB de base, autenticación y respaldos. Se pausa tras siete días sin uso.",
             "Plan Pro (unos 25 USD/mes) cuando el uso sea diario y la pausa deje de ser aceptable."],
            ["Vercel", "Hobby: suficiente para operar y probar, pero reservado a uso personal no comercial.",
             "Plan Pro (unos 20 USD/mes) cuando el conjunto lo use como sistema oficial."],
            ["Dominio", "Opcional: se arranca con el subdominio de Vercel.",
             "Unos 12 USD al año si se quiere una dirección propia, por ejemplo miconjunto.co."],
        ],
        widths=[3.2, 7.4, 6.8],
        font_pt=8.3,
        bold_first=True,
    )
    spacer(6)
    para(
        "Con esto, el costo de operación arranca en cero y no debería superar los 45 USD mensuales "
        "cuando el conjunto lo adopte como sistema oficial. El respaldo de la base de datos no es un "
        "costo aparte: viene incluido en el servicio.",
        size=9.2,
    )


def seccion_10():
    h1("10", "Experiencia de uso")
    para(
        "Una herramienta que la gente no usa no sirve, así que la experiencia de uso no es un adorno "
        "final: es parte del alcance. Estos son los principios que guían el diseño de las pantallas."
    )
    table(
        ["Principio", "Qué significa en la práctica"],
        [
            ["Móvil primero", "El residente usará el celular; el diseño se piensa para pantalla pequeña y luego se amplía."],
            ["Tres pasos o menos", "Autorizar una visita, reservar una zona o radicar una PQRS no debe requerir más de tres decisiones."],
            ["Lenguaje del conjunto", "«Alícuota», «torre», «portería» y «asamblea», no «tenant», «building» ni «workflow»."],
            ["Portería sin fricción", "Botones grandes, búsqueda por nombre o placa, y registro en menos de treinta segundos."],
            ["Nada se pierde", "Cada acción confirma qué quedó registrado y con qué número, para poder reclamarlo después."],
            ["Accesible", "Contraste suficiente, tamaños de texto legibles y navegación con teclado en el panel administrativo."],
        ],
        widths=[4.4, 13.0],
        bold_first=True,
    )
    spacer(6)
    para(
        "El panel de administración se organiza por tareas, no por módulos: «lo que debo atender hoy», "
        "«lo que vence esta semana» y «lo que está en mora». El menú por módulos existe, pero el "
        "primer pantallazo responde a la pregunta que la administradora se hace al sentarse.",
    )


def seccion_11():
    h1("11", "Plan de trabajo por fases")
    para(
        "El desarrollo se organiza en fases cortas, cada una con algo que se puede ver y probar. La "
        "estimación supone una persona dedicada al proyecto y la disponibilidad de la administración "
        "para validar cada entrega."
    )
    table(
        ["Fase", "Contenido", "Duración", "Entregable"],
        [
            ["0. Preparación", "Aprobación de esta propuesta, definición de reglas del conjunto y datos iniciales.",
             "1 semana", "Documento aprobado y reglas documentadas."],
            ["1. Núcleo", "Acceso, roles, unidades, personas, vehículos, mascotas y panel de inicio.",
             "2–3 semanas", "Sistema con usuarios reales y datos cargados."],
            ["2. Operación diaria", "Portería, visitantes, paquetería y reservas de zonas comunes.",
             "3 semanas", "Portería operando en paralelo al cuaderno."],
            ["3. Servicio al residente", "PQRS, mantenimiento, comunicados, documentos y notificaciones.",
             "3 semanas", "Residentes radicando y leyendo desde la app."],
            ["4. Participación y cartera", "Asambleas, votaciones y estado de alícuotas.",
             "2–3 semanas", "Primera asamblea con quórum calculado en el sistema."],
            ["5. Piloto y salida", "Migración de datos, capacitación, ajustes y puesta en marcha.",
             "1–2 semanas", "Conjunto operando sin el cuaderno."],
        ],
        widths=[3.4, 8.2, 2.2, 3.6],
        font_pt=8.0,
        bold_first=True,
    )
    spacer(6)
    para(
        "Duración total estimada: entre diez y trece semanas. La fase 0 y la infraestructura de la fase 1 ya están hechas —base de datos, autenticación, panel y despliegue—, así que el trabajo pendiente ronda las ocho a diez semanas. No es un cronograma rígido: las fases 2 "
        "y 3 pueden solaparse si la validación es ágil, y la fase 4 puede posponerse sin afectar la "
        "operación diaria.",
        size=9.2,
    )
    callout(
        "Regla de trabajo",
        "Cada fase termina con una demostración sobre datos reales del conjunto y un acta breve de "
        "aceptación. Si algo no cumple lo acordado, se corrige antes de avanzar; así el proyecto no "
        "acumula deuda invisible.",
    )


def seccion_12():
    h1("12", "Criterios de aceptación")
    para(
        "Un módulo se considera terminado cuando cumple estos criterios en una prueba con datos "
        "reales. No son aspiraciones: son condiciones verificables."
    )
    table(
        ["Módulo", "Se acepta cuando…"],
        [
            ["Unidades y residentes", "Se puede cargar el conjunto completo desde Excel y consultar cualquier unidad en menos de tres clics."],
            ["Portería y paquetería", "Un vigilante registra una visita en menos de treinta segundos y el informe del turno cuadra con la realidad."],
            ["Zonas comunes", "Dos residentes no pueden reservar la misma franja, y el rechazo explica el motivo."],
            ["PQRS", "Toda solicitud tiene número, responsable y plazo visible; el reporte de tiempos coincide con los cierres."],
            ["Comunicados", "El reporte de lectura identifica a cada residente que abrió el comunicado, con fecha y hora."],
            ["Asambleas", "El quórum calculado coincide con la suma de coeficientes de los asistentes y el acta se genera sin retipear."],
            ["Alícuotas", "El tablero refleja exactamente el último archivo cargado y el reporte se exporta sin errores."],
            ["Transversal", "Un residente no puede ver datos de otra unidad ni modificando la URL ni los parámetros."],
        ],
        widths=[4.2, 13.2],
        bold_first=True,
        font_pt=8.3,
    )


def seccion_13():
    h1("13", "Riesgos y supuestos")
    table(
        ["Riesgo", "Impacto", "Mitigación"],
        [
            ["Baja adopción de los residentes.", "Alto", "Funcionar con o sin ellos; portería y administración no dependen de la app del residente."],
            ["Datos iniciales incompletos o desactualizados.", "Alto", "Carga gradual por torres y validación con la administración antes de publicar."],
            ["Conectividad limitada en portería.", "Medio", "Modo de registro con reintento y captura local cuando vuelve la conexión."],
            ["Resistencia al cambio del personal.", "Medio", "Capacitación corta, manual de una página y acompañamiento las dos primeras semanas."],
            ["Duplicidad durante la transición.", "Medio", "Operación en paralelo un mes, con corte definido y verificación semanal."],
            ["Datos personales mal tratados.", "Alto", "Minimización de datos, consentimiento, control de acceso y política de retención."],
            ["Crecimiento del alcance a mitad de proyecto.", "Medio", "Todo lo nuevo entra a una lista de versión 2 y se prioriza con la administración."],
            ["Dependencia de una sola persona.", "Medio", "Documentación, respaldos probados y acceso de la administración a las credenciales."],
        ],
        widths=[6.6, 2.0, 8.8],
        font_pt=8.2,
        bold_first=True,
        align_center={1},
    )
    spacer(8)

    h2("Supuestos", "13.1")
    bullet("el conjunto cuenta con conexión a internet estable en la portería y en la administración;", size=9.3)
    bullet("la administración puede dedicar dos horas semanales a validar entregas y a cargar datos;", size=9.3)
    bullet("existe un reglamento vigente (Ley 675 de 2001) que define horarios, cupos y sanciones;", size=9.3)
    bullet("el conjunto no requiere facturación electrónica ni integración con sistemas contables en esta versión;", size=9.3)
    bullet("los datos de residentes se pueden tratar con el consentimiento informado de cada persona.", size=9.3)


def seccion_14():
    h1("14", "Decisiones pendientes y próximos pasos")
    para(
        "Cuatro decisiones ya están tomadas y no se discuten en esta versión: la plataforma corre en "
        "Supabase y Vercel, el aislamiento se aplica con RLS en la base, el modelo admite varios "
        "conjuntos y el manejo de dinero queda fuera. Lo que sigue es lo que todavía necesito de ti."
    )
    table(
        ["Decisión", "Opciones", "Mi recomendación"],
        [
            ["Alcance de la versión 1", "Todo lo propuesto, o núcleo + portería primero.",
             "Núcleo + portería + reservas primero: es lo que más se usa y lo que más rápido muestra valor."],
            ["Quién administra el día a día", "Una persona, o un equipo con varios usuarios.",
             "Un administrador principal y un suplente con los mismos permisos."],
            ["Nivel de detalle de alícuotas", "Solo estado, o valor por unidad y periodo.",
             "Solo estado en la versión 1; el valor se agrega cuando el dato sea confiable."],
            ["Votación en asamblea", "Presencial con registro digital, o voto remoto.",
             "Presencial con registro digital primero; el voto remoto requiere reglamento y validación jurídica."],
            ["Identidad visual", "Nombre y colores del conjunto, o identidad neutra.",
             "Identidad neutra ahora, personalización cuando el sistema esté en uso."],
        ],
        widths=[4.4, 6.4, 6.6],
        font_pt=8.1,
        bold_first=True,
    )
    spacer(10)

    h2("Próximos pasos", "14.1")
    numbered([
        "Revisar esta versión y marcar qué se ajusta, qué se elimina y qué falta.",
        "Definir las reglas concretas: zonas comunes, cupos, horarios, plazos de PQRS y quórum.",
        "Entregar los datos del conjunto: listado de unidades con coeficientes y reglamento.",
        "Cargar las unidades y las personas del conjunto piloto.",
        "Construir el módulo de unidades y residentes sobre el esquema que ya existe.",
        "Abrir el uso a la administración y a la portería, y después a los residentes.",
    ])

    spacer(12)
    callout(
        "Qué necesito de ti para empezar",
        "Tres cosas: una lista de unidades con sus coeficientes, el reglamento del conjunto y una "
        "persona de la administración con disponibilidad semanal. Con eso arranco la fase 1 mientras "
        "se definen los detalles de los demás módulos. La estructura inicial del proyecto ya está "
        "creada en la carpeta de trabajo, lista para recibir el primer módulo.",
        accent=NAVY_HEX,
    )


# ----------------------------------------------------------------------- build
def build():
    section = setup_document()
    setup_header_footer(section)
    portada()
    indice()
    seccion_1()
    seccion_2()
    seccion_3()
    seccion_4()
    seccion_5()
    seccion_6()
    seccion_7()
    seccion_8()
    seccion_9()
    seccion_10()
    seccion_11()
    seccion_12()
    seccion_13()
    seccion_14()

    doc.core_properties.title = "MiConjunto — Propuesta de plataforma de administración"
    doc.core_properties.subject = "Propuesta funcional, técnica y plan de trabajo"
    doc.core_properties.author = "Equipo de proyecto"
    doc.core_properties.comments = "Versión 1.1 para revisión"

    doc.save(OUT)
    print("DOCX:", OUT)


if __name__ == "__main__":
    build()
