CREATE TYPE "public"."check_in_reason" AS ENUM('LOW_ACCURACY', 'INVALID_COORDINATE', 'NO_BRANCH_ASSIGNED');--> statement-breakpoint
CREATE TYPE "public"."check_in_result" AS ENUM('VALID', 'OUT_OF_RANGE', 'REJECTED');--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"accuracy_m" integer NOT NULL,
	"result" "check_in_result" NOT NULL,
	"reason" "check_in_reason",
	"branch_id" text,
	"distance_m" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cabinets" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "cabinets" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "cabinets" ADD COLUMN "radius_m" integer DEFAULT 150;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_branch_id_cabinets_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."cabinets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkins_user_created_idx" ON "checkins" USING btree ("user_id","created_at");