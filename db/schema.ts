import {
  pgTable,
  serial,
  integer,
  text,
  doublePrecision,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

export const businesses = pgTable("businesses", {
  id: serial().primaryKey(),
  name: text().notNull(),
  address: text().notNull(),
  city: text().notNull(),
  state: text().notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
  website: text(),
  phone: text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: serial().primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  category: text().notNull(),
  title: text().notNull(),
  description: text(),
  terms: text(),
  discountLabel: text("discount_label"),
  price: text(),
  originalPrice: text("original_price"),
  expirationText: text("expiration_text"),
  expirationDate: date("expiration_date"),
  emoji: text(),
  score: doublePrecision(),
  verifiedText: text("verified_text"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
