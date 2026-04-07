export type User = {
  id: number;
  email: string;
  name: string;
  role: "BUYER" | "ADMIN";
};

export type Property = {
  id: number;
  title: string;
  location: string;
  price: number;
  createdAt: string;
  updatedAt: string;
};

