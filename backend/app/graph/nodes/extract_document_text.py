"""QPilot Backend - Extract Document Text Node."""

from .state import ComplaintState


async def extract_document_text(state: ComplaintState) -> ComplaintState:
    """Extract text from uploaded document."""
    try:
        # If raw_input is already text, use it directly
        if state.input_type == "text":
            state.current_step = "extract_document_text"
            return state

        # For document input, the text should already be extracted
        # and stored in raw_input by the file service
        if not state.raw_input:
            state.error = "No document text to process"
            state.status = "error"
            return state

        state.current_step = "extract_document_text"
        return state

    except Exception as e:
        state.error = f"Document extraction failed: {str(e)}"
        state.status = "error"
        return state
