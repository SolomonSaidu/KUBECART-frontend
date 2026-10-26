import { describe, expect, it } from "vitest";
import {
  bootstrapSchema,
  categorySchema,
  checkoutSchema,
  fulfillmentSchema,
  loginSchema,
  productSchema,
} from "./schemas";

describe("checkoutSchema", () => {
  it("accepts valid guest checkout details", () => {
    const result = checkoutSchema.safeParse({
      email: "buyer@example.com",
      phone: "08123456789",
      shippingAddress: "12 Market Road, Lagos",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email and short address", () => {
    const result = checkoutSchema.safeParse({
      email: "bad-email",
      phone: "0812",
      shippingAddress: "12",
    });
    expect(result.success).toBe(false);
    const fields = result.error.flatten().fieldErrors;
    expect(fields.email).toBeTruthy();
    expect(fields.phone).toBeTruthy();
    expect(fields.shippingAddress).toBeTruthy();
  });
});

describe("loginSchema", () => {
  it("requires a valid email and an 8 character password", () => {
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "longenough" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "short" }).success).toBe(false);
  });
});

describe("bootstrapSchema", () => {
  it("requires a name", () => {
    expect(
      bootstrapSchema.safeParse({ name: "", email: "admin@example.com", password: "longenough" }).success
    ).toBe(false);
  });
});

describe("categorySchema", () => {
  it("accepts a lowercase hyphenated slug", () => {
    expect(categorySchema.safeParse({ name: "Home", slug: "home-goods" }).success).toBe(true);
  });

  it("rejects spaces and uppercase in slugs", () => {
    expect(categorySchema.safeParse({ name: "Home", slug: "Home Goods" }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const valid = {
    categoryId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Smart Watch",
    slug: "smart-watch",
    description: "A useful watch.",
    priceNaira: "15000",
    stock: "4",
    isActive: true,
  };

  it("coerces numeric strings and accepts HTTP image URLs", () => {
    const result = productSchema.safeParse({
      ...valid,
      imageUrl: "https://example.com/watch.jpg",
    });
    expect(result.success).toBe(true);
    expect(result.data.priceNaira).toBe(15000);
    expect(result.data.stock).toBe(4);
  });

  it("rejects non-http image URLs and negative stock", () => {
    expect(productSchema.safeParse({ ...valid, imageUrl: "ftp://example.com/a.jpg" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, stock: "-1" }).success).toBe(false);
  });
});

describe("fulfillmentSchema", () => {
  it("allows only documented fulfillment transitions", () => {
    expect(fulfillmentSchema.safeParse({ status: "PROCESSING" }).success).toBe(true);
    expect(fulfillmentSchema.safeParse({ status: "FULFILLED", note: "Sent" }).success).toBe(true);
    expect(fulfillmentSchema.safeParse({ status: "CANCELLED" }).success).toBe(true);
    expect(fulfillmentSchema.safeParse({ status: "DELIVERED" }).success).toBe(false);
  });
});
