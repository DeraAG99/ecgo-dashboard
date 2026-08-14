CREATE TYPE "public"."slot_state" AS ENUM('EMPTY', 'CHARGING', 'FULL', 'LOCKED', 'FAULT');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE');--> statement-breakpoint
CREATE TABLE "cabinets" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"branch" text NOT NULL,
	"status" "status" DEFAULT 'ONLINE',
	"total_slots" integer DEFAULT 12,
	"last_heartbeat" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cabinets_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" text PRIMARY KEY NOT NULL,
	"cabinet_id" text NOT NULL,
	"slot_number" integer NOT NULL,
	"state" "slot_state" DEFAULT 'EMPTY',
	"soc" integer,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"cabinet_id" text NOT NULL,
	"user_id" text NOT NULL,
	"old_battery_id" text NOT NULL,
	"new_battery_id" text NOT NULL,
	"swapped_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_cabinet_id_cabinets_id_fk" FOREIGN KEY ("cabinet_id") REFERENCES "public"."cabinets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cabinet_id_cabinets_id_fk" FOREIGN KEY ("cabinet_id") REFERENCES "public"."cabinets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cabinets_status_idx" ON "cabinets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "slots_cabinet_id_idx" ON "slots" USING btree ("cabinet_id");--> statement-breakpoint
CREATE INDEX "transactions_cabinet_swapped_idx" ON "transactions" USING btree ("cabinet_id","swapped_at");