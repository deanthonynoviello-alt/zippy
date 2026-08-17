import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { businesses, deals } from "../../db/schema.js";

export default async () => {
  try {
    const rows = await db
      .select({
        id: deals.id,
        businessId: deals.businessId,
        category: deals.category,
        title: deals.title,
        description: deals.description,
        terms: deals.terms,
        discountLabel: deals.discountLabel,
        price: deals.price,
        originalPrice: deals.originalPrice,
        expirationText: deals.expirationText,
        expirationDate: deals.expirationDate,
        emoji: deals.emoji,
        score: deals.score,
        verifiedText: deals.verifiedText,
        businessName: businesses.name,
        address: businesses.address,
        city: businesses.city,
        state: businesses.state,
        zipCode: businesses.zipCode,
        latitude: businesses.latitude,
        longitude: businesses.longitude,
      })
      .from(deals)
      .innerJoin(businesses, eq(deals.businessId, businesses.id))
      .where(eq(deals.isActive, true));

    return Response.json({ deals: rows });
  } catch (error) {
    console.error("Failed to load deals:", error);
    return Response.json(
      { error: "Unable to load deals right now." },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/api/deals",
  method: "GET",
};
