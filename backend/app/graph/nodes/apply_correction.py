"""QPilot Backend - Apply Correction Node."""

from ...services.llm_service import llm_service
from ..state import ComplaintState


async def apply_correction(state: ComplaintState) -> ComplaintState:
    """Apply user correction to complaint fields."""
    try:
        if not state.messages:
            state.error = "No correction message provided"
            return state

        # Get the last user message as the correction
        last_message = state.messages[-1]
        if last_message.get("role") != "user":
            state.error = "Last message must be from user"
            return state

        correction_text = last_message.get("content", "")

        # Build context for LLM
        context = {}
        if state.extraction:
            context["current_extraction"] = state.extraction
        if state.classification:
            context["current_classification"] = state.classification

        # Ask LLM to parse the correction
        prompt = f"""Parse this user correction and return a JSON object with the fields to update.

Current extraction: {state.extraction}
User correction: {correction_text}

Return a JSON object with:
- fields_to_update: Object with field names as keys and new values as values
- explanation: Brief explanation of what was updated

JSON:"""

        messages = [{"role": "user", "content": prompt}]
        response = await llm_service.chat(messages, context)

        import json
        try:
            correction_data = json.loads(response)
            fields_to_update = correction_data.get("fields_to_update", {})

            # Update extraction with new fields
            if state.extraction and fields_to_update:
                state.extraction.update(fields_to_update)
            elif fields_to_update:
                state.extraction = fields_to_update

            # Add correction to user corrections history
            state.user_corrections.append({
                "original": correction_text,
                "fields_updated": list(fields_to_update.keys()),
            })

            state.current_step = "apply_correction"

        except json.JSONDecodeError:
            state.error = "Failed to parse correction response"

    except Exception as e:
        state.error = f"Correction failed: {str(e)}"

    return state
