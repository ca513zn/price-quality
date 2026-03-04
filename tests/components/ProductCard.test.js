import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductCard from "@/components/ProductCard";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const baseProduct = {
  id: "p1",
  name: "iPhone 16 Pro",
  slug: "iphone-16-pro",
  avgPriceScore: 8.5,
  avgQualityScore: 9.2,
  totalVotes: 25,
  brand: { name: "Apple", slug: "apple" },
};

describe("ProductCard", () => {
  it("renders the product name", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
  });

  it("renders the brand name", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("renders the correct quadrant label", () => {
    render(<ProductCard product={baseProduct} />);
    // High price + high quality = Premium
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("links to the correct product page", () => {
    render(<ProductCard product={baseProduct} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/iphone-16-pro");
  });

  it("displays price, quality, and vote counts", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("9.2")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("shows 'No votes yet' when totalVotes is 0", () => {
    const product = { ...baseProduct, totalVotes: 0 };
    render(<ProductCard product={product} />);
    expect(screen.getByText("No votes yet")).toBeInTheDocument();
  });

  it("shows Budget quadrant for low price / low quality", () => {
    const product = { ...baseProduct, avgPriceScore: 2.0, avgQualityScore: 3.0 };
    render(<ProductCard product={product} />);
    expect(screen.getByText("Budget")).toBeInTheDocument();
  });

  it("shows Best Value quadrant for low price / high quality", () => {
    const product = { ...baseProduct, avgPriceScore: 3.0, avgQualityScore: 8.0 };
    render(<ProductCard product={product} />);
    expect(screen.getByText("Best Value")).toBeInTheDocument();
  });

  it("shows Overpriced quadrant for high price / low quality", () => {
    const product = { ...baseProduct, avgPriceScore: 9.0, avgQualityScore: 2.0 };
    render(<ProductCard product={product} />);
    expect(screen.getByText("Overpriced")).toBeInTheDocument();
  });

  it("falls back to brandName when brand object is missing", () => {
    const product = { ...baseProduct, brand: undefined, brandName: "Fallback Brand" };
    render(<ProductCard product={product} />);
    expect(screen.getByText("Fallback Brand")).toBeInTheDocument();
  });
});
