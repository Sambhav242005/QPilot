"""QPilot Backend - File Service for PDF Ingestion."""

import os
import uuid
from pathlib import Path

import fitz  # PyMuPDF
from fastapi import UploadFile

from ..config import get_settings

settings = get_settings()

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def generate_safe_filename(original_filename: str) -> str:
    """Generate a safe filename using UUID."""
    ext = Path(original_filename).suffix.lower()
    return f"{uuid.uuid4()}{ext}"


def validate_file_type(filename: str) -> bool:
    """Validate file type is allowed."""
    allowed_types = {".pdf", ".txt", ".docx"}
    ext = Path(filename).suffix.lower()
    return ext in allowed_types


def validate_file_size(size: int) -> bool:
    """Validate file size is within limits."""
    return size <= settings.MAX_UPLOAD_SIZE


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF."""
    doc = None
    try:
        doc = fitz.open(file_path)
        text_parts: list[str] = []
        for page in doc:
            text_parts.append(page.get_text())
        text = "\n".join(text_parts).strip()
        if not text:
            raise ValueError("PDF contains no extractable text")
        return text
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    finally:
        if doc is not None:
            doc.close()


async def process_upload(file: UploadFile) -> dict:
    """Process an uploaded file."""
    # Validate file type
    if not validate_file_type(file.filename):
        raise ValueError(f"File type not allowed: {file.filename}")

    # Read file content
    content = await file.read()

    # Validate file size
    if not validate_file_size(len(content)):
        raise ValueError(f"File size exceeds limit: {len(content)} bytes")

    # Generate safe filename
    safe_filename = generate_safe_filename(file.filename)
    file_path = UPLOAD_DIR / safe_filename

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text if PDF
    extracted_text = None
    if file.filename.lower().endswith(".pdf"):
        try:
            extracted_text = extract_text_from_pdf(str(file_path))
        except ValueError:
            file_path.unlink(missing_ok=True)
            raise

    return {
        "filename": safe_filename,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "extracted_text": extracted_text,
        "file_path": str(file_path),
    }


def delete_file(file_path: str) -> bool:
    """Delete a file."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False
