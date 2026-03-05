/**
 * Slugify a string for URL-safe usage.
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Normalize a brand name for duplicate detection.
 * Strips diacritics, common suffixes, punctuation, and extra whitespace.
 */
export function normalizeBrandName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|co|gmbh|sa|ag|plc|group)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Determine which quadrant a product falls into
 * based on its average price and quality scores.
 *
 * Scale: 1-10, midpoint at 5
 */
export function getQuadrant(avgPrice, avgQuality) {
  const mid = 5;

  if (avgPrice >= mid && avgQuality >= mid) return "Premium";
  if (avgPrice < mid && avgQuality >= mid) return "Best Value";
  if (avgPrice >= mid && avgQuality < mid) return "Overpriced";
  return "Budget";
}

/**
 * Get the color for a quadrant label.
 */
export function getQuadrantColor(quadrant) {
  const colors = {
    Premium: "#8b5cf6",     // purple
    "Best Value": "#10b981", // green
    Overpriced: "#ef4444",   // red
    Budget: "#f59e0b",       // amber
  };
  return colors[quadrant] || "#6b7280";
}

/**
 * Recalculate aggregated scores from all votes for a product.
 */
export function computeAggregatedScores(votes) {
  if (!votes || votes.length === 0) {
    return { avgPriceScore: 0, avgQualityScore: 0, totalVotes: 0 };
  }

  const totalPrice = votes.reduce((sum, v) => sum + v.priceScore, 0);
  const totalQuality = votes.reduce((sum, v) => sum + v.qualityScore, 0);
  const count = votes.length;

  return {
    avgPriceScore: parseFloat((totalPrice / count).toFixed(2)),
    avgQualityScore: parseFloat((totalQuality / count).toFixed(2)),
    totalVotes: count,
  };
}
