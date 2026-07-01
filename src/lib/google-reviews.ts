export type GoogleReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
};

export type GoogleReviewsData = {
  rating: number;
  totalCount: number;
  reviews: GoogleReview[];
  mapsUrl: string;
  source: "google" | "fallback";
};

const MAPS_URL =
  "https://www.google.com/maps/place/Rayz+barbers/@51.5414445,-0.1249692,17z/data=!4m8!3m7!1s0x48761b78342fc01d:0x9b653161723fc1da!8m2!3d51.5414445!4d-0.1249692!9m1!1b1";

/** Curated from the live Google Maps listing — used when Places API is not configured. */
const FALLBACK_REVIEWS: GoogleReview[] = [
  {
    id: "google-user",
    author: "Google User",
    rating: 5,
    relativeTime: "2 years ago",
    text: "Best barber in London! Started from humble beginnings, an inspiration for any upcoming as well as existing barbers. Underrated, professional and a consistent service. Very few barbers who can work a crazy fade as well as fine scissor work.",
  },
  {
    id: "t-manandhar",
    author: "T Manandhar",
    rating: 5,
    relativeTime: "1 year ago",
    text: "Been coming here for a couple years, since then I've never gone anywhere else. Top class service in a nice environment. Easy to find, 6min walk from Kings Cross station. Specialised in skin fades. Great value for money.",
  },
  {
    id: "azaan-azhar",
    author: "Azaan Azhar",
    rating: 5,
    relativeTime: "1 year ago",
    text: "Amazing, provided me with a last minute appointment. Ray never disappoints — I'm very particular about my hair being cut and Ray will deliver. Switched my usual barber shop in NW London to here now.",
  },
  {
    id: "jay",
    author: "Jay",
    rating: 5,
    relativeTime: "1 year ago",
    text: "The best bit about coming here is the consistency. As a customer wanting their hair cut, the most important thing from a barber is a good quality cut and consistency every time. Very professional service.",
  },
  {
    id: "mahi-islam",
    author: "Mahi Islam",
    rating: 5,
    relativeTime: "6 months ago",
    text: "Best fade you'll ever get, worth every single penny — definitely will be coming back soon.",
  },
  {
    id: "93s96",
    author: "93s96",
    rating: 5,
    relativeTime: "2 years ago",
    text: "Consistently delivering amazing cuts. Best in the borough of Camden/Islington for sure, possibly best in the whole of London. Def recommend.",
  },
  {
    id: "a-a",
    author: "A A",
    rating: 5,
    relativeTime: "1 year ago",
    text: "Always a great experience. My hair cuts come out great every time. Highly recommend Rayz as he's a top barber!",
  },
  {
    id: "bogdan-stefan",
    author: "Bogdan Stefan",
    rating: 5,
    relativeTime: "1 week ago",
    text: "New open, great experience, and really good price.",
  },
];

function fallbackReviews(): GoogleReviewsData {
  return {
    rating: 4.6,
    totalCount: 16,
    reviews: FALLBACK_REVIEWS,
    mapsUrl: MAPS_URL,
    source: "fallback",
  };
}

type PlacesReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
};

type PlacesDetails = {
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesReview[];
  googleMapsUri?: string;
};

function mapPlacesReview(review: PlacesReview, index: number): GoogleReview | null {
  const text = review.text?.text?.trim();
  const author = review.authorAttribution?.displayName?.trim();
  if (!text || !author || !review.rating || review.rating < 4) return null;

  return {
    id: review.name ?? `review-${index}`,
    author,
    rating: review.rating,
    text,
    relativeTime: review.relativePublishTimeDescription ?? "",
  };
}

async function fetchFromPlacesApi(
  apiKey: string,
  placeId: string,
): Promise<GoogleReviewsData | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "rating,userRatingCount,reviews,googleMapsUri",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.error("Google Places API error:", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as PlacesDetails;
  const reviews = (data.reviews ?? [])
    .map(mapPlacesReview)
    .filter((review): review is GoogleReview => review !== null)
    .slice(0, 8);

  if (reviews.length === 0) return null;

  return {
    rating: data.rating ?? 4.6,
    totalCount: data.userRatingCount ?? reviews.length,
    reviews,
    mapsUrl: data.googleMapsUri ?? MAPS_URL,
    source: "google",
  };
}

async function resolvePlaceId(apiKey: string): Promise<string | null> {
  const configured = process.env.GOOGLE_PLACE_ID;
  if (configured) return configured;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({
      textQuery: "Rayz barbers 186 York Wy London N7 9AT",
    }),
    next: { revalidate: 604800 },
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { places?: { id?: string }[] };
  const id = json.places?.[0]?.id;
  return id?.startsWith("places/") ? id.slice("places/".length) : id ?? null;
}

export async function getGoogleReviews(): Promise<GoogleReviewsData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return fallbackReviews();

  try {
    const placeId = await resolvePlaceId(apiKey);
    if (!placeId) return fallbackReviews();

    const live = await fetchFromPlacesApi(apiKey, placeId);
    return live ?? fallbackReviews();
  } catch (err) {
    console.error("Google reviews fetch failed:", err);
    return fallbackReviews();
  }
}
