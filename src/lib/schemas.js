import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const checkoutSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long"),
  shippingAddress: z
    .string()
    .trim()
    .min(5, "Enter a complete delivery address")
    .max(500, "Delivery address must be 500 characters or fewer"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const bootstrapSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or fewer"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or fewer")
    .regex(slugPattern, "Use lowercase letters, numbers, and single hyphens"),
  description: z.string().trim().optional(),
});

export const productSchema = z.object({
  categoryId: z.string().uuid("Choose a category"),
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name must be 255 characters or fewer"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(255, "Slug must be 255 characters or fewer")
    .regex(slugPattern, "Use lowercase letters, numbers, and single hyphens"),
  description: z.string().trim().min(1, "Description is required"),
  priceNaira: z.coerce
    .number({ invalid_type_error: "Enter a price in naira" })
    .positive("Price must be greater than zero"),
  stock: z.coerce
    .number({ invalid_type_error: "Enter a stock quantity" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  isActive: z.boolean().default(true),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .max(2048, "Image URL is too long")
    .refine((value) => /^https?:\/\//i.test(value), "Image URL must use HTTP or HTTPS")
    .optional()
    .or(z.literal("")),
});

export const fulfillmentSchema = z.object({
  status: z.enum(["PROCESSING", "FULFILLED", "CANCELLED"]),
  note: z
    .string()
    .trim()
    .max(500, "Note must be 500 characters or fewer")
    .optional(),
});

export const productImageSchema = z.object({
  isPrimary: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  replaceImageId: z.string().optional(),
});
