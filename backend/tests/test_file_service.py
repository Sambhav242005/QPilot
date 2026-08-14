"""Tests for File Service."""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, mock_open
from fastapi import UploadFile

from app.services.file_service import (
    generate_safe_filename,
    validate_file_type,
    validate_file_size,
    extract_text_from_pdf,
    process_upload,
)


def test_generate_safe_filename_has_uuid():
    result = generate_safe_filename("test.pdf")
    assert result.endswith(".pdf")
    assert len(result) > 5
    # UUID format: 8-4-4-4-12
    name = result.replace(".pdf", "")
    assert len(name) == 36
    assert name.count("-") == 4


def test_generate_safe_filename_preserves_extension():
    assert generate_safe_filename("doc.docx").endswith(".docx")
    assert generate_safe_filename("file.txt").endswith(".txt")
    assert generate_safe_filename("UPPER.PDF").endswith(".pdf")


def test_validate_file_type_allowed():
    assert validate_file_type("doc.pdf") is True
    assert validate_file_type("doc.txt") is True
    assert validate_file_type("doc.docx") is True


def test_validate_file_type_rejected():
    assert validate_file_type("doc.exe") is False
    assert validate_file_type("doc.jpg") is False
    assert validate_file_type("doc.py") is False
    assert validate_file_type("doc") is False


def test_validate_file_size_within_limit():
    assert validate_file_size(1024) is True
    assert validate_file_size(0) is True


def test_validate_file_size_exceeds_limit():
    # Default max is typically 10MB
    assert validate_file_size(100 * 1024 * 1024) is False


@patch("app.services.file_service.fitz")
def test_extract_text_from_pdf_success(mock_fitz):
    mock_doc = MagicMock()
    mock_page = MagicMock()
    mock_page.get_text.return_value = "Page 1 text"
    mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))
    mock_fitz.open.return_value = mock_doc

    result = extract_text_from_pdf("/fake/path.pdf")

    assert result == "Page 1 text"
    mock_doc.close.assert_called_once()


@patch("app.services.file_service.fitz")
def test_extract_text_from_pdf_error(mock_fitz):
    mock_fitz.open.side_effect = Exception("File not found")

    with pytest.raises(ValueError, match="Failed to extract"):
        extract_text_from_pdf("/nonexistent.pdf")


@pytest.mark.asyncio
@patch("app.services.file_service.validate_file_type", return_value=True)
@patch("app.services.file_service.validate_file_size", return_value=True)
@patch("app.services.file_service.generate_safe_filename", return_value="uuid.pdf")
async def test_process_upload_txt(mock_name, mock_size, mock_type):
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.txt"
    mock_file.content_type = "text/plain"
    mock_file.read = AsyncMock(return_value=b"Hello world")

    result = await process_upload(mock_file)

    assert result["original_filename"] == "test.txt"
    assert result["size"] == 11
    assert result["extracted_text"] is None  # Not a PDF


@pytest.mark.asyncio
@patch("app.services.file_service.validate_file_type", return_value=False)
async def test_process_upload_invalid_type(mock_type):
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "malware.exe"

    with pytest.raises(ValueError, match="not allowed"):
        await process_upload(mock_file)


@pytest.mark.asyncio
@patch("app.services.file_service.validate_file_type", return_value=True)
@patch("app.services.file_service.validate_file_size", return_value=False)
async def test_process_upload_oversized(mock_size, mock_type):
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "huge.pdf"
    mock_file.read = AsyncMock(return_value=b"x" * (20 * 1024 * 1024))

    with pytest.raises(ValueError, match="exceeds limit"):
        await process_upload(mock_file)
