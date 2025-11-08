# FlipBook DRM - Production Cleanup & Rebuild

## Core Functionality Required:
1. User authentication (NextAuth with database)
2. PDF document upload & storage
3. Secure PDF viewing with DRM protection
4. Document sharing with access controls
5. Analytics and tracking
6. Payment integration (Razorpay)

## Files to Remove (Demo/Test/Unnecessary):
- All demo-related files
- Test deployment files
- Emergency servers
- Multiple deployment guides
- Duplicate components
- AWS Amplify files (using Supabase)
- Cognito files (using NextAuth)

## Clean Architecture:
- Database: Supabase PostgreSQL with Prisma
- Auth: NextAuth.js
- Storage: Local file system (production can use S3)
- PDF Processing: PDF-lib + Canvas
- Security: DRM protection, watermarks, access controls