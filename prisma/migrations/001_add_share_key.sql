-- Add share_key column to documents table
ALTER TABLE "documents" ADD COLUMN "share_key" TEXT;

-- Create unique index on share_key
CREATE UNIQUE INDEX "documents_share_key_key" ON "documents"("share_key");

-- Add document_views table for audit trail
CREATE TABLE "document_views" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "viewer_ip" TEXT,
    "viewer_user_id" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "document_views_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "document_views" ADD CONSTRAINT "document_views_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_views" ADD CONSTRAINT "document_views_viewer_user_id_fkey" FOREIGN KEY ("viewer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add view_count column to documents table
ALTER TABLE "documents" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;