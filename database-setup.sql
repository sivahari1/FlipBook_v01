-- FlipBook DRM Database Setup Script
-- Run this in your Supabase SQL Editor to create all necessary tables
-- This matches your Prisma schema exactly

-- Create ENUM types first
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CREATOR', 'SUBSCRIBER');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "AccessAction" AS ENUM ('VIEW', 'SEARCH', 'NAVIGATE', 'DOWNLOAD', 'SHARE');

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUBSCRIBER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT UNIQUE,
    "emailVerificationExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT UNIQUE,
    "passwordResetExpires" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT UNIQUE,
    "razorpayPaymentId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Documents table
CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "hasPassphrase" BOOLEAN NOT NULL DEFAULT false,
    "passphraseHash" TEXT,
    "storageKey" TEXT NOT NULL,
    "shareKey" TEXT UNIQUE,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "tilePrefix" TEXT,
    "drmOptions" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "totalPages" INTEGER,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "textExtracted" BOOLEAN NOT NULL DEFAULT false,
    "fileSize" BIGINT,
    "mimeType" TEXT,
    "originalFilename" TEXT,
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Share Links table
CREATE TABLE IF NOT EXISTS "share_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3),
    "maxOpens" INTEGER,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "ipLock" TEXT,
    "uaLock" TEXT,
    "requireOtp" BOOLEAN NOT NULL DEFAULT false,
    "lastOtpHash" TEXT,
    "requirePass" BOOLEAN NOT NULL DEFAULT false,
    "passphraseHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE
);

-- View Audits table
CREATE TABLE IF NOT EXISTS "view_audits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "shareLinkId" TEXT,
    "documentId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "uaHash" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    FOREIGN KEY ("shareLinkId") REFERENCES "share_links"("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id")
);

-- Document Access table
CREATE TABLE IF NOT EXISTS "document_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "duration" INTEGER,
    "pagesViewed" INTEGER NOT NULL DEFAULT 0,
    "violations" TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Page Access table
CREATE TABLE IF NOT EXISTS "page_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "accessTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "renderTime" INTEGER,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- PDF Pages table
CREATE TABLE IF NOT EXISTS "pdf_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "textContent" TEXT,
    "textBounds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    UNIQUE ("documentId", "pageNumber")
);

-- Document Text Search table
CREATE TABLE IF NOT EXISTS "document_text_search" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "searchableText" TEXT NOT NULL,
    "wordPositions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    UNIQUE ("documentId", "pageNumber")
);

-- PDF Processing Jobs table
CREATE TABLE IF NOT EXISTS "pdf_processing_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE
);

-- Document Access Logs table
CREATE TABLE IF NOT EXISTS "document_access_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "action" "AccessAction" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id")
);

-- Document Views table
CREATE TABLE IF NOT EXISTS "document_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "viewerIp" TEXT,
    "viewerUserId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "userAgent" TEXT,
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE,
    FOREIGN KEY ("viewerUserId") REFERENCES "users"("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_documents_ownerId" ON "documents"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_documents_shareKey" ON "documents"("shareKey");
CREATE INDEX IF NOT EXISTS "idx_share_links_code" ON "share_links"("code");
CREATE INDEX IF NOT EXISTS "idx_share_links_documentId" ON "share_links"("documentId");
CREATE INDEX IF NOT EXISTS "idx_view_audits_documentId" ON "view_audits"("documentId");
CREATE INDEX IF NOT EXISTS "idx_document_access_documentId" ON "document_access"("documentId");
CREATE INDEX IF NOT EXISTS "idx_document_access_userId" ON "document_access"("userId");
CREATE INDEX IF NOT EXISTS "idx_pdf_pages_documentId" ON "pdf_pages"("documentId");
CREATE INDEX IF NOT EXISTS "idx_document_views_documentId" ON "document_views"("documentId");

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete! All tables created successfully.';
END $$;
