"""Tests for File Service - detailed PDF ingestion tests."""

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


class TestSafeFilename:
    def test_has_uuid(self):
        result = generate_safe_filename("test.pdf")
        assert result.endswith(".pdf")
        name = result.replace(".pdf", "")
        assert len(name) == 36
        assert name.count("-") == 4

    def test_preserves_extension(self):
        assert generate_safe_filename("doc.docx").endswith(".docx")
        assert generate_safe_filename("file.txt").endswith(".txt")
        assert generate_safe_filename("UPPER.PDF").endswith(".pdf")

    def test_unique_per_call(self):
        names = {generate_safe_filename("test.pdf") for _ in range(10)}
        assert len(names) == 10


class TestFileTypeValidation:
    def test_allowed_types(self):
        assert validate_file_type("doc.pdf") is True
        assert validate_file_type("doc.txt") is True
        assert validate_file_type("doc.docx") is True

    def test_rejected_types(self):
        assert validate_file_type("doc.exe") is False
        assert validate_file_type("doc.jpg") is False
        assert validate_file_type("doc.py") is False
        assert validate_file_type("doc") is False
        assert validate_file_type("doc.zip") is False


class TestFileSizeValidation:
    def test_within_limit(self):
        assert validate_file_size(1024) is True
        assert validate_file_size(0) is True

    def test_exceeds_limit(self):
        assert validate_file_size(100 * 1024 * 1024) is False


class TestPDFExtraction:
    @patch("app.services.file_service.fitz")
    def test_success(self, mock_fitz):
        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Page 1 text"
        mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))
        mock_fitz.open.return_value = mock_doc

        result = extract_text_from_pdf("/fake/path.pdf")

        assert result == "Page 1 text"
        mock_doc.close.assert_called_once()

    @patch("app.services.file_service.fitz")
    def test_multiple_pages(self, mock_fitz):
        mock_doc = MagicMock()
        page1 = MagicMock()
        page1.get_text.return_value = "Page 1"
        page2 = MagicMock()
        page2.get_text.return_value = "Page 2"
        mock_doc.__iter__ = MagicMock(return_value=iter([page1, page2]))
        mock_fitz.open.return_value = mock_doc

        result = extract_text_from_pdf("/fake/path.pdf")

        assert "Page 1" in result
        assert "Page 2" in result

    @patch("app.services.file_service.fitz")
    def test_error_handling(self, mock_fitz):
        mock_fitz.open.side_effect = Exception("File not found")

        with pytest.raises(ValueError, match="Failed to extract"):
            extract_text_from_pdf("/nonexistent.pdf")

    @patch("app.services.file_service.fitz")
    def test_empty_pdf_returns_error(self, mock_fitz):
        mock_doc = MagicMock()
        mock_doc.__iter__ = MagicMock(return_value=iter([]))
        mock_fitz.open.return_value = mock_doc

        with pytest.raises(ValueError, match="no extractable text"):
            extract_text_from_pdf("/empty.pdf")

        mock_doc.close.assert_called_once()


class TestProcessUpload:
    @pytest.mark.asyncio
    @patch("app.services.file_service.validate_file_type", return_value=True)
    @patch("app.services.file_service.validate_file_size", return_value=True)
    @patch("app.services.file_service.generate_safe_filename", return_value="uuid.pdf")
    async def test_valid_txt_upload(self, mock_name, mock_size, mock_type):
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "test.txt"
        mock_file.content_type = "text/plain"
        mock_file.read = AsyncMock(return_value=b"Hello world")

        result = await process_upload(mock_file)

        assert result["original_filename"] == "test.txt"
        assert result["size"] == 11
        assert result["extracted_text"] is None

    @pytest.mark.asyncio
    @patch("app.services.file_service.validate_file_type", return_value=False)
    async def test_invalid_type_rejected(self, mock_type):
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "malware.exe"

        with pytest.raises(ValueError, match="not allowed"):
            await process_upload(mock_file)

    @pytest.mark.asyncio
    @patch("app.services.file_service.validate_file_type", return_value=True)
    @patch("app.services.file_service.validate_file_size", return_value=False)
    async def test_oversized_rejected(self, mock_size, mock_type):
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "huge.pdf"
        mock_file.read = AsyncMock(return_value=b"x" * (20 * 1024 * 1024))

        with pytest.raises(ValueError, match="exceeds limit"):
            await process_upload(mock_file)

    @pytest.mark.asyncio
    @patch("app.services.file_service.validate_file_type", return_value=True)
    @patch("app.services.file_service.validate_file_size", return_value=True)
    @patch("app.services.file_service.generate_safe_filename", return_value="uuid.pdf")
    async def test_pdf_extracts_text(self, mock_name, mock_size, mock_type):
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "complaint.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.read = AsyncMock(return_value=b"%PDF-1.4 fake content")

        with patch("app.services.file_service.extract_text_from_pdf", return_value="Extracted text"):
            result = await process_upload(mock_file)

        assert result["extracted_text"] == "Extracted text"

    def test_dangerous_filename_only_preserves_safe_extension(self):
        result = generate_safe_filename("../../../../secrets.pdf")
        assert result.endswith(".pdf")
        assert "/" not in result
        assert "\\" not in result

    @pytest.mark.asyncio
    @patch("app.services.file_service.validate_file_type", return_value=True)
    @patch("app.services.file_service.validate_file_size", return_value=True)
    @patch("app.services.file_service.generate_safe_filename", return_value="uuid.pdf")
    async def test_extracted_text_is_returned_for_pipeline(self, mock_name, mock_size, mock_type):
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "source.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.read = AsyncMock(return_value=b"%PDF-1.4 fake content")

        with patch("app.services.file_service.extract_text_from_pdf", return_value="Complaint source text"):
            result = await process_upload(mock_file)

        assert result["extracted_text"] == "Complaint source text"
