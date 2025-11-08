# Move flipbook-drm to Repository Root

Since Vercel can't find the Root Directory setting, we need to move the Next.js app to the repository root.

## Steps:

1. **In your terminal, navigate to the parent directory** (where both `flipbook-drm` and `flipbook-deploy` folders are):
   ```bash
   cd E:\App-Projects-2025\Flipbook
   ```

2. **Copy all files from flipbook-drm to root**:
   ```bash
   # Windows Command Prompt
   xcopy flipbook-drm\* . /E /H /Y /EXCLUDE:flipbook-drm\.git

   # OR Windows PowerShell
   Copy-Item -Path "flipbook-drm\*" -Destination "." -Recurse -Force -Exclude ".git"
   ```

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Move Next.js app to repository root for Vercel deployment"
   git push origin main
   ```

## OR Simpler Solution: Create New Vercel Project

Instead of moving files, just create a fresh Vercel project:

1. Go to: https://vercel.com/new
2. Select `FlipBook_v01` repository
3. **IMPORTANT**: Set Root Directory to `flipbook-drm`
4. Add environment variables
5. Deploy

The Root Directory option WILL appear when creating a NEW project!
