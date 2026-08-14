import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommitButton } from "@/components/review/CommitButton";

function getTriggerButton(container: HTMLElement): HTMLElement {
  // Base UI composes the dialog trigger and Button into one accessible button.
  const allButtons = container.querySelectorAll("button");
  return allButtons[0] as HTMLElement;
}

describe("CommitButton", () => {
  it("renders commit button", () => {
    const { container } = render(<CommitButton onCommit={vi.fn()} />);
    expect(getTriggerButton(container)).toBeTruthy();
  });

  it("disables button when disabled prop is true", () => {
    const { container } = render(<CommitButton onCommit={vi.fn()} disabled />);
    expect(getTriggerButton(container)).toBeDisabled();
  });

  it("disables button when status is not review or ready_to_commit", () => {
    const { container } = render(<CommitButton onCommit={vi.fn()} status="pending" />);
    expect(getTriggerButton(container)).toBeDisabled();
  });

  it("enables button when status is review", () => {
    const { container } = render(<CommitButton onCommit={vi.fn()} status="review" />);
    expect(getTriggerButton(container)).not.toBeDisabled();
  });

  it("enables button when status is ready_to_commit", () => {
    const { container } = render(<CommitButton onCommit={vi.fn()} status="ready_to_commit" />);
    expect(getTriggerButton(container)).not.toBeDisabled();
  });

  it("shows loading text", () => {
    render(<CommitButton onCommit={vi.fn()} loading />);
    expect(screen.getByText(/committing/i)).toBeInTheDocument();
  });

  it("opens dialog when clicked", () => {
    const { container } = render(<CommitButton onCommit={vi.fn()} status="review" />);
    fireEvent.click(getTriggerButton(container));
    expect(screen.getByText(/confirm qms commit/i)).toBeInTheDocument();
  });

  it("calls onCommit when confirmed", () => {
    const onCommit = vi.fn();
    const { container } = render(<CommitButton onCommit={onCommit} status="review" />);
    fireEvent.click(getTriggerButton(container));
    fireEvent.click(screen.getByRole("button", { name: /confirm commit/i }));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("does not call onCommit when cancelled", () => {
    const onCommit = vi.fn();
    const { container } = render(<CommitButton onCommit={onCommit} status="review" />);
    fireEvent.click(getTriggerButton(container));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCommit).not.toHaveBeenCalled();
  });
});
