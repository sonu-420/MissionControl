# MissionControl

A React + Vite todo app with Appwrite authentication and database-backed todos.

## Run Locally

```bash
npm install
npm run dev
```

## Where To Add Appwrite Credentials

Create a `.env` file in the project root, next to `package.json`, and add:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_APPWRITE_DATABASE_ID=your_database_id_here
VITE_APPWRITE_TODOS_COLLECTION_ID=your_todos_collection_id_here
```

You can copy the keys from `.env.example`.

## Appwrite Setup

In your Appwrite console:

1. Create a project.
2. Add a Web platform for your local app, usually `http://localhost:5173`.
3. Enable Email/Password auth under Auth settings.
4. Create a database.
5. Create a collection for todos.
6. Add these collection attributes:
   - `title` as String, required
   - `completed` as Boolean, required
   - `userId` as String, required
7. Set collection permissions so authenticated users can create documents.
8. Enable document security if you want each todo restricted to only the user who created it.

The Appwrite client and database functions live in `src/lib/appwrite.js`.
