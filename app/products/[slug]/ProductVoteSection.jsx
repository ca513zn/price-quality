"use client";

import { useRouter } from "next/navigation";
import VoteForm from "@/components/VoteForm";

export default function ProductVoteSection({ productId, productName }) {
  const router = useRouter();

  function handleVoteSuccess() {
    // Refresh server components to show updated scores
    router.refresh();
  }

  return (
    <VoteForm
      productId={productId}
      productName={productName}
      onVoteSuccess={handleVoteSuccess}
    />
  );
}
