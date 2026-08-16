CREATE TYPE "public"."battery_status" AS ENUM('AVAILABLE', 'IN_USE', 'CHARGING', 'FAULT', 'RETIRED');--> statement-breakpoint
CREATE TABLE "batteries" (
	"id" text PRIMARY KEY NOT NULL,
	"battery_code" text NOT NULL,
	"status" "battery_status" DEFAULT 'AVAILABLE',
	"cycle_count" integer DEFAULT 0,
	"health" integer DEFAULT 100,
	"cabinet_id" text,
	"last_swap_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "batteries_battery_code_unique" UNIQUE("battery_code")
);
--> statement-breakpoint
ALTER TABLE "batteries" ADD CONSTRAINT "batteries_cabinet_id_cabinets_id_fk" FOREIGN KEY ("cabinet_id") REFERENCES "public"."cabinets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batteries_status_idx" ON "batteries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "batteries_cabinet_idx" ON "batteries" USING btree ("cabinet_id");