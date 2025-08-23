# Supabase Storage Setup

## Prerequisites
- You have a Supabase project (✅ Already done)
- You have the project URL and anon key (✅ Already done)

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ghvjvnumdfqxtdkyx
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Use these settings:
   - **Name**: `agora-project`
   - **Public bucket**: ✅ Checked (so files can be accessed without authentication)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/*, video/*`

**Note**: The application will automatically create a `sections` folder inside this bucket, and each section will have its own subfolder for better organization.

## Step 2: Set Storage Policies

After creating the bucket, you need to set up policies for public access:

1. Click on your `agora-project` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Choose **Create a policy from template**
5. Select **Allow public access to bucket**
6. Click **Review** and then **Save policy**

## Step 3: Test the Setup

The application will now:
- ✅ Upload files to Supabase storage
- ✅ Store permanent URLs in the database
- ✅ Persist files across page refreshes
- ✅ Handle file deletion from storage
- ✅ Support images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG)

## File Structure in Storage

Files will be organized as:
```
agora-project/
└── sections/
    ├── section_123/
    │   ├── 1703257900000_abc123.jpg
    │   └── 1703257901000_def456.mp4
    ├── section_456/
    │   ├── 1703257901000_ghi789.png
    │   └── 1703257902000_jkl012.mp4
    └── ...
```

This structure provides:
- **Better Organization**: Each section has its own folder
- **Easier Management**: Files are grouped by section
- **Cleaner URLs**: Organized storage paths
- **Scalability**: Easy to manage large numbers of sections

## Benefits

- **Permanent Storage**: Files persist across sessions
- **CDN**: Fast global delivery via Supabase CDN
- **Scalable**: No local storage limitations
- **Secure**: Proper access control and policies
- **Cost-effective**: Generous free tier

## Troubleshooting

If uploads fail:
1. Check bucket name matches `agora-project`
2. Verify bucket is public
3. Check file size limits (10MB max)
4. Ensure file types are supported
5. Check browser console for errors

## Next Steps

Once setup is complete, you can:
- Upload media files that persist permanently
- Share projects with others (files will be accessible)
- Scale to handle larger files and more users
