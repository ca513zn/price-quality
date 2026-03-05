import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoteForm from "@/components/VoteForm";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

const authenticatedUser = { id: "user1", name: "Test User", email: "test@example.com", role: "USER" };

describe("VoteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Default: authenticated user, no existing votes
    mockUseAuth.mockReturnValue({ user: authenticatedUser, loading: false });
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ votes: [] }),
    });
  });

  it("shows sign-in prompt when not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<VoteForm productId="p1" productName="iPhone 16 Pro" />);
    expect(screen.getAllByText(/sign in to vote/i).length).toBeGreaterThan(0);
  });

  it("renders the product name in the heading when authenticated", async () => {
    render(<VoteForm productId="p1" productName="iPhone 16 Pro" />);
    await waitFor(() => {
      expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
    });
  });

  it("renders price and quality sliders", async () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider");
      expect(sliders).toHaveLength(2);
    });
  });

  it("shows default score of 5 for both sliders", async () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider");
      expect(sliders[0]).toHaveValue("5");
      expect(sliders[1]).toHaveValue("5");
    });
  });

  it("renders the submit button", async () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit vote/i })).toBeInTheDocument();
    });
  });

  it("shows the correct quadrant preview based on defaults (5,5 = Premium)", async () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    await waitFor(() => {
      expect(screen.getByText("Premium")).toBeInTheDocument();
    });
  });

  it("updates quadrant when sliders change", async () => {
    render(<VoteForm productId="p1" productName="Test Product" />);
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider");
      fireEvent.change(sliders[0], { target: { value: "8" } });
      fireEvent.change(sliders[1], { target: { value: "9" } });
      expect(screen.getByText("Premium")).toBeInTheDocument();
    });
  });

  it("submits a vote and shows success message", async () => {
    // First call: fetch my-votes (no existing)
    // Second call: POST vote
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ votes: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vote: { id: "v1", productId: "p1", priceScore: 5, qualityScore: 5 } }),
      });

    const onVoteSuccess = vi.fn();
    render(
      <VoteForm productId="p1" productName="Test Product" onVoteSuccess={onVoteSuccess} />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit vote/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    await waitFor(() => {
      expect(screen.getByText(/vote (submitted|updated)/i)).toBeInTheDocument();
    });

    expect(onVoteSuccess).toHaveBeenCalled();
  });

  it("shows an error message when the API returns an error", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ votes: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Product not found" }),
      });

    render(<VoteForm productId="bad-id" productName="Bad Product" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit vote/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    await waitFor(() => {
      expect(screen.getByText("Product not found")).toBeInTheDocument();
    });
  });

  it("shows existing vote with edit/delete buttons if already voted", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        votes: [{ id: "v1", productId: "p1", priceScore: 7, qualityScore: 8, product: { slug: "test" } }],
      }),
    });

    render(<VoteForm productId="p1" productName="Test Product" />);

    await waitFor(() => {
      expect(screen.getByText(/your vote for/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edit vote/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });
  });

  it("shows loading spinner while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    const { container } = render(<VoteForm productId="p1" productName="Test Product" />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
