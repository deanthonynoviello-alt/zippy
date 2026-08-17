CREATE TABLE "businesses" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "zip_code" text NOT NULL,
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "website" text,
  "phone" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
  "id" serial PRIMARY KEY,
  "business_id" integer NOT NULL,
  "category" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "terms" text,
  "discount_label" text,
  "price" text,
  "original_price" text,
  "expiration_text" text,
  "expiration_date" date,
  "emoji" text,
  "score" double precision,
  "verified_text" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals"
  ADD CONSTRAINT "deals_business_id_businesses_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id");
--> statement-breakpoint
INSERT INTO "businesses"
  ("id","name","address","city","state","zip_code","latitude","longitude","website","phone")
VALUES
  (1,'Beachside Burger Co.','210 Dunlawton Ave','Port Orange','FL','32127',29.144248,-80.973890,NULL,NULL),
  (2,'Sunrise Coffee','4855 S Ridgewood Ave','Port Orange','FL','32127',29.149195,-80.997140,NULL,NULL),
  (3,'Coastal Kicks','5321 S Williamson Blvd','Port Orange','FL','32128',29.126404,-80.955179,NULL,NULL),
  (4,'Strike Zone','1620 Ridgewood Ave','South Daytona','FL','32119',29.094055,-81.001532,NULL,NULL),
  (5,'Volusia Pizza House','3740 Nova Rd','Port Orange','FL','32129',29.163402,-80.976007,NULL,NULL),
  (6,'Glow & Co.','250 N Atlantic Ave','Daytona Beach','FL','32118',29.080565,-80.954437,NULL,NULL);
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('"businesses"', 'id'), (SELECT MAX(id) FROM "businesses"));
--> statement-breakpoint
INSERT INTO "deals"
  ("id","business_id","category","title","description","terms","discount_label","price","original_price","expiration_text","expiration_date","emoji","score","verified_text","is_active")
VALUES
  (1,1,'Food','$7.99 Burger + Fries','Classic burger with fries for one low price. A strong nearby dinner deal when you want something quick without paying full menu price.','Dine-in or takeout. One offer per customer. Not valid with other discounts. Availability may vary by location.','SAVE 35%','$7.99','$12.29','Ends tonight',NULL,'🍔',9.2,'Verified today',true),
  (2,2,'Coffee','Buy One, Get One Free','Buy one handcrafted drink and get a second eligible drink free. Great for two people or a two-coffee kind of day.','Equal or lesser value drink is free. Participating drinks only. Limit one redemption per visit.','BOGO','$4.75','$9.50','Ends 6 PM',NULL,'☕',9.6,'Verified today',true),
  (3,3,'Shopping','40% Off Select Shoes','Save 40% on select casual and athletic shoes while promotional inventory lasts.','Select styles only. Excludes clearance and limited releases. In-store availability may differ.','SAVE 40%','$53.99','$89.99','Ends Sunday',NULL,'👟',8.8,'Verified yesterday',true),
  (4,4,'Fun','$12 Unlimited Bowling','Unlimited bowling during the promotional evening window for $12 per person.','Shoe rental may be separate. Lane availability is first come, first served. Valid during posted promotional hours.','SAVE 45%','$12','$22','Tonight only',NULL,'🎳',9.0,'Verified today',true),
  (5,5,'Food','$10 Large Cheese Pizza','Large cheese pizza for $10. Add toppings at regular menu pricing.','Carryout only. One discounted pizza per order. Taxes and add-ons are extra.','SAVE 38%','$10','$16.25','Ends 9 PM',NULL,'🍕',9.4,'Verified today',true),
  (6,6,'Shopping','Buy 2, Get 1 Free','Mix and match eligible skincare and body-care items and receive the lowest-priced item free.','Eligible items only. Lowest-priced qualifying item is free. Cannot be combined with other offers.','3 FOR 2','$18','$27','Ends Aug 18',NULL,'🧴',8.4,'Verified yesterday',true);
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('"deals"', 'id'), (SELECT MAX(id) FROM "deals"));
