import io
from datetime import datetime
from typing import Any, Dict, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and render total page count."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, 36, letter[0] - 40, 36)

        # Footer Left: Confidential Notice
        self.drawString(40, 24, "MeetIQ Executive Intelligence • Confidential • 30-Day Synthesis")

        # Footer Right: Page X of Y
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 24, page_str)
        self.restoreState()


def generate_briefing_pdf(meeting_data: Dict[str, Any], report_data: Dict[str, Any]) -> bytes:
    """
    Generate an executive-grade briefing PDF using ReportLab.
    Returns the raw PDF binary content.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0f172a")
    )

    tagline_style = ParagraphStyle(
        "Tagline",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b")
    )

    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#475569")
    )

    meta_val_style = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    exec_summary_style = ParagraphStyle(
        "ExecSummary",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1e293b")
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    source_cell_style = ParagraphStyle(
        "SourceCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#334155")
    )

    source_url_style = ParagraphStyle(
        "SourceUrl",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#2563eb")
    )

    story = []

    # 1. Header Banner
    company = report_data.get("company") or meeting_data.get("company", "Target Company")
    meeting_type = meeting_data.get("meeting_type", "Executive Briefing")
    meeting_date = meeting_data.get("meeting_date", "Upcoming")
    objective = meeting_data.get("objective", "Strategic Discussion")
    website = meeting_data.get("website", "")

    header_table_data = [
        [
            Paragraph("<b>MEETIQ</b> <font color='#64748b'>| EXECUTIVE BRIEFING</font>", title_style),
            Paragraph(f"Generated: {datetime.utcnow().strftime('%b %d, %Y')}<br/><font color='#2563eb'>CONFIDENTIAL</font>", tagline_style)
        ]
    ]
    header_table = Table(header_table_data, colWidths=[380, 150])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceBefore=6, spaceAfter=10))

    # 2. Metadata Box
    meta_rows = [
        [
            Paragraph("<b>Target Company:</b>", meta_label_style),
            Paragraph(f"<b>{company}</b>", meta_val_style),
            Paragraph("<b>Meeting Type:</b>", meta_label_style),
            Paragraph(meeting_type, meta_val_style)
        ],
        [
            Paragraph("<b>Target Website:</b>", meta_label_style),
            Paragraph(website or "N/A", meta_val_style),
            Paragraph("<b>Meeting Date:</b>", meta_label_style),
            Paragraph(str(meeting_date), meta_val_style)
        ],
        [
            Paragraph("<b>Objective:</b>", meta_label_style),
            Paragraph(objective, meta_val_style),
            Paragraph("<b>Focus:</b>", meta_label_style),
            Paragraph(meeting_data.get("additional_context") or "Standard 30-Day Public Signal Analysis", meta_val_style)
        ]
    ]
    meta_table = Table(meta_rows, colWidths=[80, 200, 75, 175])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#edf2f7")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # 3. Executive Summary
    story.append(Paragraph("EXECUTIVE SUMMARY", h1_style))
    summary_text = report_data.get("executive_summary", "No executive summary available.")
    summary_table = Table([[Paragraph(summary_text, exec_summary_style)]], colWidths=[530])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ("LINELEFT", (0, 0), (0, -1), 3, colors.HexColor("#2563eb")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 4. Recent Developments
    recent_devs = report_data.get("recent_developments", [])
    if recent_devs:
        story.append(Paragraph("KEY RECENT DEVELOPMENTS (PAST 30 DAYS)", h1_style))
        for dev in recent_devs:
            text = dev if isinstance(dev, str) else dev.get("text", dev.get("title", str(dev)))
            story.append(Paragraph(f"• <b>Signal:</b> {text}", bullet_style))
        story.append(Spacer(1, 6))

    # 5. Opportunities & Risks (Two Columns)
    opportunities = report_data.get("opportunities", [])
    risks = report_data.get("risks", [])

    if opportunities or risks:
        opp_flowables = [Paragraph("<b>STRATEGIC OPPORTUNITIES</b>", ParagraphStyle("OppTitle", parent=h1_style, fontSize=10, textColor=colors.HexColor("#15803d")))]
        for opp in opportunities:
            text = opp if isinstance(opp, str) else opp.get("text", str(opp))
            opp_flowables.append(Paragraph(f"+ {text}", bullet_style))

        risk_flowables = [Paragraph("<b>STRATEGIC RISKS & CHALLENGES</b>", ParagraphStyle("RiskTitle", parent=h1_style, fontSize=10, textColor=colors.HexColor("#b91c1c")))]
        for risk in risks:
            text = risk if isinstance(risk, str) else risk.get("text", str(risk))
            risk_flowables.append(Paragraph(f"! {text}", bullet_style))

        opp_risk_table = Table([[opp_flowables, risk_flowables]], colWidths=[260, 260])
        opp_risk_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(KeepTogether(opp_risk_table))
        story.append(Spacer(1, 8))

    # 6. Recommended Strategic Questions
    questions = report_data.get("questions", [])
    if questions:
        story.append(Paragraph("RECOMMENDED MEETING QUESTIONS", h1_style))
        for idx, q in enumerate(questions, 1):
            text = q if isinstance(q, str) else q.get("text", q.get("question", str(q)))
            story.append(Paragraph(f"<b>Q{idx}:</b> {text}", bullet_style))
        story.append(Spacer(1, 6))

    # 7. Sources Cited
    sources = report_data.get("sources", [])
    if sources:
        story.append(Paragraph("VERIFIED SOURCES & CITATIONS", h1_style))
        source_rows = [
            [
                Paragraph("<b>Title / Document</b>", meta_label_style),
                Paragraph("<b>Publisher</b>", meta_label_style),
                Paragraph("<b>Date</b>", meta_label_style),
                Paragraph("<b>URL / Reference</b>", meta_label_style)
            ]
        ]
        for s in sources:
            if isinstance(s, dict):
                title = s.get("title", "Reference")
                pub = s.get("publisher", "Web")
                date = s.get("published_at", "Past 30d")
                url = s.get("url", "")
                source_rows.append([
                    Paragraph(title, source_cell_style),
                    Paragraph(str(pub), source_cell_style),
                    Paragraph(str(date), source_cell_style),
                    Paragraph(url[:45] + "..." if len(url) > 45 else url, source_url_style)
                ])

        src_table = Table(source_rows, colWidths=[200, 85, 65, 180])
        src_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(src_table)
        story.append(Spacer(1, 8))

    # 8. Research Limitations
    limitations = report_data.get("research_limitations", [])
    if limitations:
        story.append(Paragraph("RESEARCH SCOPE & LIMITATIONS", h1_style))
        for lim in limitations:
            text = lim if isinstance(lim, str) else lim.get("text", str(lim))
            story.append(Paragraph(f"• {text}", bullet_style))

    # Build document with custom canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
