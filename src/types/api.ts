export type User = {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "admin";
};

export type Property = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  propertyType: string | null;
  status: "available" | "sold";
  createdAt: string;
  images: {
    id: string;
    imageUrl: string;
  }[];
};

export type Review = {
  id: string;
  rating: number | null;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
  } | null;
};

export type Inquiry = {
  id: string;
  message: string | null;
  status: "pending" | "replied";
  createdAt: string;
  user: {
    name: string;
  } | null;
};

