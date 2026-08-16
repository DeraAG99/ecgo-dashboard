CREATE TYPE "public"."work_order_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"entity_label" text,
	"detail" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"priority" "work_order_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" "work_order_status" DEFAULT 'OPEN' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maintenance_logs_entity_idx" ON "maintenance_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "maintenance_logs_created_idx" ON "maintenance_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "work_orders_status_idx" ON "work_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_orders_priority_idx" ON "work_orders" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "work_orders_assignee_idx" ON "work_orders" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "work_orders_entity_idx" ON "work_orders" USING btree ("entity_type","entity_id");