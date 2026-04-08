ALTER TABLE "saved_item" ALTER COLUMN "id" SET DATA TYPE uuid  USING id::uuid;--> statement-breakpoint
ALTER TABLE "saved_item" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();