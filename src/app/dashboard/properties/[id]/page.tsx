"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { Inquiry, Property, Review } from "@/types/api";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const propertyId = params.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ NEW

  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [propertyData, reviewsData, inquiriesData] = await Promise.all([
          apiRequest<Property>(`/properties/${propertyId}`),
          apiRequest<Review[]>(`/reviews/${propertyId}`),
          apiRequest<Inquiry[]>(`/inquiries/${propertyId}`)
        ]);
        setProperty(propertyData);
        setSelectedImage(propertyData.images?.[0]?.imageUrl ?? null);
        setReviews(reviewsData);
        setInquiries(inquiriesData);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [propertyId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  function formatPriceRs(price: number | null): string {
    if (price === null) return "Price on request";
    return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(price)}`;
  }

  async function submitInquiry() {
    if (!property || inquiryMessage.trim().length < 5) return;
    await apiRequest("/inquiries", {
      method: "POST",
      body: { propertyId: property.id, message: inquiryMessage }
    });
    const latest = await apiRequest<Inquiry[]>(`/inquiries/${property.id}`);
    setInquiries(latest);
    setInquiryMessage("");
    setFeedback("Inquiry sent successfully.");
  }

  async function submitReview() {
    if (!property || reviewComment.trim().length < 3) return;
    await apiRequest(`/reviews/${property.id}`, {
      method: "POST",
      body: { rating: reviewRating, comment: reviewComment }
    });
    const latest = await apiRequest<Review[]>(`/reviews/${property.id}`);
    setReviews(latest);
    setReviewComment("");
    setFeedback("Review added.");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-6 py-4">Loading...</div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <button className="rounded-lg bg-white px-4 py-2 text-slate-900" onClick={() => router.back()}>
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 rounded border border-white/20 px-3 py-1 text-sm"
        >
          Back to dashboard
        </button>

        <div className="overflow-hidden rounded-2xl border border-white/15 bg-slate-900">
          
          {/* MAIN IMAGE */}
          <img
            src={selectedImage || "https://placehold.co/1200x700?text=No+Image"}
            alt={property.title}
            className="h-96 w-full object-cover cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />

          {/* THUMBNAILS */}
          <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-3">
            {property.images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => {
                  setSelectedImage(image.imageUrl);
                  setIsModalOpen(true);
                }}
              >
                <img src={image.imageUrl} alt={property.title} className="h-16 w-24 rounded object-cover" />
              </button>
            ))}
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-2">
            <div>
              <h1 className="text-2xl font-semibold">{property.title}</h1>
              <p className="mt-2 text-slate-300">{property.description}</p>
              <p className="mt-3 text-slate-400">
                {[property.address, property.city, property.country].filter(Boolean).join(", ")}
              </p>
              <p className="mt-2 text-lg font-semibold text-indigo-200">{formatPriceRs(property.price)}</p>
              <p className="text-sm text-slate-400">
                Type: {property.propertyType} | Status: {property.status}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Contact Agent</h3>
              <textarea
                value={inquiryMessage}
                onChange={(event) => setInquiryMessage(event.target.value)}
                className="mt-2 h-24 w-full rounded border border-white/20 bg-slate-800 p-2 text-sm"
                placeholder="I am interested in this property."
              />
              <button type="button" onClick={submitInquiry} className="mt-2 rounded bg-indigo-500 px-3 py-2 text-sm">
                Send Inquiry
              </button>

              <p className="mt-4 text-sm font-medium">Recent Inquiries</p>
              <div className="mt-2 max-h-28 space-y-2 overflow-y-auto text-sm">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="rounded border border-white/10 p-2">
                    <p className="font-medium">{inquiry.user?.name ?? "User"}</p>
                    <p className="text-slate-300">{inquiry.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REVIEWS */}
          <div className="border-t border-white/10 p-5">
            <h3 className="font-semibold">
              Customer Reviews {averageRating ? `(Avg ${averageRating})` : ""}
            </h3>

            <div className="mt-3 space-y-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded border border-white/10 p-2">
                  <p className="font-medium">{review.user?.name ?? "Anonymous"}</p>
                  <p className="text-yellow-300">{"★".repeat(review.rating ?? 0)}</p>
                  <p className="text-slate-300">{review.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-sm text-slate-400">No reviews yet.</p>}
            </div>

            <div className="mt-3 flex gap-2">
              <select
                value={reviewRating}
                onChange={(event) => setReviewRating(Number(event.target.value))}
                className="rounded border border-white/20 bg-slate-800 px-2 text-sm"
              >
                {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              <input
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Write a review"
                className="w-full rounded border border-white/20 bg-slate-800 px-2 text-sm"
              />

              <button type="button" onClick={submitReview} className="rounded bg-emerald-600 px-3 text-sm">
                Add Review
              </button>
            </div>
          </div>

          {feedback && (
            <p className="border-t border-white/10 p-4 text-sm text-emerald-300">
              {feedback}
            </p>
          )}
        </div>
      </div>

      {/* ✅ IMAGE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-5xl w-full px-4">
            <img
              src={selectedImage || ""}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />

            <button
              className="absolute top-2 right-2 bg-white text-black px-3 py-1 rounded"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

