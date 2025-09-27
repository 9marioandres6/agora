# Supabase Storage Setup

Quick setup guide for file storage in the Agora project.

## Steps

1. **Create Storage Bucket**
   - Go to your Supabase dashboard → Storage
   - Create bucket: `agora-project`
   - Enable **Public bucket** ✅
   - Set **File size limit**: 10MB
   - **Allowed types**: `image/*, video/*`

2. **Set Public Access Policy**
   - Click on `agora-project` bucket → Policies
   - Create new policy → "Allow public access to bucket"
   - Save policy

3. **Test**
   - Upload files through the app
   - Files should persist and be accessible

## File Organization

```
agora-project/
└── sections/
    ├── section_123/
    │   ├── image1.jpg
    │   └── video1.mp4
    └── section_456/
        └── image2.png
```

## Troubleshooting

- Verify bucket name is exactly `agora-project`
- Check bucket is public
- Ensure file size < 10MB
- Check supported file types (images/videos only)