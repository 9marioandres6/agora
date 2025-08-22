# Firebase Firestore Setup Guide

## 🚨 IMPORTANT: Fix "Missing or insufficient permissions" Error

The error you're seeing means the Firestore security rules haven't been deployed yet. Follow these steps to fix it:

## 1. Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

## 2. Login to Firebase

```bash
firebase login
```

## 3. Initialize Firebase in your project

```bash
firebase init
```

**Select these options:**
- Choose "Firestore" when prompted for features
- Select your existing Firebase project
- Accept the default `firestore.rules` file location
- Accept the default `firestore.indexes.json` file location

## 4. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

**Expected output:**
```
✔  firestore: released rules firestore.rules to firebase:firestore:your-project-id
```

## 5. Verify Rules are Deployed

Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Rules

You should see your security rules deployed.

## 🔧 Alternative: Manual Rules Setup

If you prefer to set rules manually in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projects collection rules
    match /projects/{projectId} {
      // Allow read access to all authenticated users
      allow read: if request.auth != null;

      // Allow create access to authenticated users
      allow create: if request.auth != null
        && request.auth.uid == resource.data.createdBy;

      // Allow update access to project creator and participants
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.createdBy
            || request.auth.uid in resource.data.participants);

      // Allow delete access only to project creator
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.createdBy;
    }

    // Users collection rules (if you want to store user profiles)
    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

5. Click **Publish**

## 🧪 Test the Integration

After deploying the rules:

1. **Fill out the NewItem form** with:
   - Title: "Test Project"
   - Description: "This is a test project"
   - Scope: Select any option
   - Add some needs (optional)

2. **Click the Send button** - it should now work without permission errors

3. **Check Firebase Console** → Firestore Database → Data to see your project

## 📱 ProjectsService API

The `ProjectsService` provides these methods:

### Create Project
```typescript
const projectId = await this.projectsService.createProject({
  title: "My Project",
  description: "Project description",
  needs: ["Design", "Development"],
  scope: "local",
  createdBy: userId
});
```

### Get User Projects
```typescript
const projects = await this.projectsService.getUserProjects(userId);
```

### Join/Leave Project
```typescript
await this.projectsService.joinProject(projectId, userId);
await this.projectsService.leaveProject(projectId, userId);
```

## 🔒 Security Features

- **Authentication Required**: Only logged-in users can create/access projects
- **Ownership Protection**: Users can only delete their own projects
- **Collaboration**: Project creators and participants can update projects
- **Automatic Tagging**: Projects get auto-generated tags for search
- **Audit Trail**: Creation and update timestamps are tracked

## 🚀 Next Steps

After fixing the permissions:

1. **Test project creation** with the form
2. **View projects** in Firebase Console
3. **Consider adding** a projects list view in your app
4. **Implement search** using the auto-generated tags

## ❗ Troubleshooting

**Still getting permission errors?**
1. Verify you're logged in to the app
2. Check that rules are deployed (Firebase Console → Firestore → Rules)
3. Ensure your Firebase project ID matches in `environment.ts`
4. Check browser console for additional error details

**Need help?**
- Check [Firebase Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- Verify your Firebase project configuration
- Ensure you're using the correct Firebase project
