import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoteForm from "@/components/VoteForm";

// Mock next/link (not used here, but just in case)
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("VoteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the product name in the heading", () => {
    render(<VoteForm productId="p1" productName="iPhone 16 Pro" />);
    expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
  });

  it("renders price and quality sliders", () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(2);
  });

  it("shows default score of 5 for both sliders", () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders[0]).toHaveValue("5");
    expect(sliders[1]).toHaveValue("5");
  });

  it("renders the submit button", () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    expect(screen.getByRole("button", { name: /submit vote/i })).toBeInTheDocument();
  });

  it("shows the correct quadrant preview based on defaults (5,5 = Budget)", () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    // 5 < 5.5 for both = Budget
    expect(screen.getByText("Budget")).toBeInTheDocument();
  });

  it("updates quadrant when sliders change", () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    const sliders = screen.getAllByRole("slider");

    // Move price to 8 and quality to 9 → Premium
    fireEvent.change(sliders[0], { target: { value: "8" } });
    fireEvent.change(sliders[1], { target: { value: "9" } });

    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("submits a vote and shows success message", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vote: { id: "v1" } }),
    });

    const onVoteSuccess = vi.fn();
    render(
      <VoteForm productId="p1" productName="Test Product" onVoteSuccess={onVoteSuccess} />
    );

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    await waitFor(() => {
      expect(screen.getByText(/vote submitted/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: "p1", priceScore: 5, qualityScore: 5 }),
    });
    expect(onVoteSuccess).toHaveBeenCalled();
  });

  it("shows an error message when the API returns an error", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Product not found" }),
    });

    render(<VoteForm productId="bad-id" productName="Bad Product" />);

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    await waitFor(() => {
      expect(screen.getByText("Product not found")).toBeInTheDocument();
    });
  });

  it("shows 'Vote again' button after successful submission", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vote: { id: "v1" } }),
    });

    render(<VoteForm productId="p1" productName="Test Product" />);

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    await waitFor(() => {
      expect(screen.getByText(/vote again/i)).toBeInTheDocument();
    });
  });

  it("resets the form when 'Vote again' is clicked", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vote: { id: "v1" } }),
    });

    render(<VoteForm productId="p1" productName="Test Product" />);

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    await waitFor(() => {
      expect(screen.getByText(/vote again/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/vote again/i));

    // Form should be back with the submit button
    expect(screen.getByRole("button", { name: /submit vote/i })).toBeInTheDocument();
    const sliders = screen.getAllByRole("slider");
    expect(sliders[0]).toHaveValue("5");
    expect(sliders[1]).toHaveValue("5");
  });

  it("disables the button while submitting", async () => {
    let resolvePromise;
    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<VoteForm productId="p1" productName="Test Product" />);
    const button = screen.getByRole("button", { name: /submit vote/i });

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();

    // Resolve to avoid hanging
    resolvePromise({ ok: true, json: () => Promise.resolve({ vote: {} }) });
  });
});
