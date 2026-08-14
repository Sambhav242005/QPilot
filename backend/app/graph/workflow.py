"""QPilot Backend - LangGraph Workflow."""

from langgraph.graph import END, StateGraph

from .nodes.classify import classify
from .nodes.completeness import check_completeness
from .nodes.extract_fields import extract_fields
from .nodes.risk import assess_risk
from .nodes.apply_correction import apply_correction
from .state import ComplaintState


def create_workflow() -> StateGraph:
    """Create the complaint processing workflow."""

    workflow = StateGraph(ComplaintState)

    # Add nodes
    workflow.add_node("extract_fields", extract_fields)
    workflow.add_node("classify", classify)
    workflow.add_node("assess_risk", assess_risk)
    workflow.add_node("check_completeness", check_completeness)
    workflow.add_node("apply_correction", apply_correction)

    # Set entry point
    workflow.set_entry_point("extract_fields")

    # Add edges
    workflow.add_edge("extract_fields", "classify")
    workflow.add_edge("classify", "assess_risk")
    workflow.add_edge("assess_risk", "check_completeness")
    workflow.add_edge("check_completeness", END)

    # Correction workflow re-enters from extraction
    workflow.add_edge("apply_correction", "extract_fields")

    return workflow.compile()


# Compiled workflow singleton
complaint_workflow = create_workflow()


def create_correction_workflow() -> StateGraph:
    """Create a workflow for processing corrections."""

    workflow = StateGraph(ComplaintState)

    # Add nodes
    workflow.add_node("apply_correction", apply_correction)
    workflow.add_node("extract_fields", extract_fields)
    workflow.add_node("classify", classify)
    workflow.add_node("assess_risk", assess_risk)
    workflow.add_node("check_completeness", check_completeness)

    # Set entry point
    workflow.set_entry_point("apply_correction")

    # Add edges
    workflow.add_edge("apply_correction", "extract_fields")
    workflow.add_edge("extract_fields", "classify")
    workflow.add_edge("classify", "assess_risk")
    workflow.add_edge("assess_risk", "check_completeness")
    workflow.add_edge("check_completeness", END)

    return workflow.compile()


# Correction workflow singleton
correction_workflow = create_correction_workflow()
