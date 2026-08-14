"""Generate sample complaint PDF for testing."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent.parent / "uploads" / "sample_complaint.pdf"

def build():
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title2", parent=styles["Title"], fontSize=16, spaceAfter=12)
    normal = styles["Normal"]

    elements = []

    elements.append(Paragraph("CUSTOMER COMPLAINT REPORT", title_style))
    elements.append(Spacer(1, 0.2 * inch))

    data = [
        ["Complaint ID:", "CMP-2026-0847"],
        ["Date:", "August 12, 2026"],
        ["Source:", "Phone Call"],
    ]
    t = Table(data, colWidths=[2 * inch, 4 * inch])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph("<b>Customer Information</b>", styles["Heading2"]))
    elements.append(Paragraph("Name: Sarah Mitchell", normal))
    elements.append(Paragraph("Company: Greenfield Pharmacy, 42 Oak Street, Springfield, IL 62704", normal))
    elements.append(Paragraph("Contact: sarah.mitchell@greenfieldpharmacy.com | (217) 555-0193", normal))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph("<b>Product Details</b>", styles["Heading2"]))
    elements.append(Paragraph("Product: Amoxicillin 500mg Capsules", normal))
    elements.append(Paragraph("NDC: 12345-678-90", normal))
    elements.append(Paragraph("Batch / Lot Number: AMX-2026-B147", normal))
    elements.append(Paragraph("Manufacturing Date: March 2026", normal))
    elements.append(Paragraph("Expiry Date: March 2028", normal))
    elements.append(Paragraph("Quantity Affected: 120 capsules (2 bottles)", normal))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph("<b>Complaint Details</b>", styles["Heading2"]))
    elements.append(Paragraph("Type: Product Defect", normal))
    elements.append(Paragraph(
        "Upon opening the sealed bottle, several capsules were found stuck together "
        "and discolored (yellowish-brown instead of the expected white/light-blue). "
        "The capsules appear to have melted or clumped due to apparent heat exposure "
        "during transit. The outer seal was intact but the inner foil barrier was "
        "compromised. Patient safety concern: affected capsules were not administered.",
        normal,
    ))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph("<b>Attachments</b>", styles["Heading2"]))
    elements.append(Paragraph("- 2 photographs of affected capsules (attached separately)", normal))
    elements.append(Paragraph("- Copy of shipping receipt showing ambient temp excursion", normal))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph(
        "<b>Requested Action:</b> Replacement of affected stock and investigation "
        "into cold-chain shipping integrity for this batch.",
        normal,
    ))

    doc.build(elements)
    print(f"Created: {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")

if __name__ == "__main__":
    build()
