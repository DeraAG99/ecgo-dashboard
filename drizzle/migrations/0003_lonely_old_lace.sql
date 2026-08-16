CREATE TYPE "public"."alert_severity" AS ENUM('INFO', 'WARNING', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('CABINET_OFFLINE', 'SLOT_FAULT', 'BATTERY_LOW', 'SWAP_ANOMALY');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "alert_type" NOT NULL,
	"severity" "alert_severity" DEFAULT 'WARNING' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_id" text,
	"read" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "alerts_type_idx" ON "alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alerts_read_idx" ON "alerts" USING btree ("read");--> statement-breakpoint
CREATE INDEX "alerts_entity_idx" ON "alerts" USING btree ("entity_id");