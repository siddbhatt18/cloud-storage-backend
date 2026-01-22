# Cloud Storage Backend

A robust RESTful API for cloud file storage built with Node.js, Express, TypeScript, and Supabase. This backend service provides comprehensive file management capabilities including upload, download, sharing, trash management, and folder organization.

## Features

### Authentication
- User registration and login
- JWT-based authentication with Supabase Auth
- Secure session management

### File Management
- **Upload**: Store files securely in Supabase Storage
- **List**: View all active files
- **Search**: Full-text search across file names
- **Rename**: Update file names
- **Download**: Generate secure signed URLs for file access
- **Favorites**: Mark files as favorites for quick access

### Trash & Recovery
- **Soft Delete**: Move files to trash instead of permanent deletion
- **Restore**: Recover files from trash
- **Permanent Delete**: Remove files permanently from storage and database
- **Trash View**: List all deleted files

### Organization
- **Folders**: Create hierarchical folder structures
- **Parent-Child Relationships**: Organize files in nested folders

### Sharing
- **File Sharing**: Share files with other users by email
- **Role-Based Access**: Define viewer/editor permissions

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **File Upload**: Multer

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cloud-storage-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

4. Set up your Supabase project:
   - Create a storage bucket named `cloud-storage`
   - Create the following tables:
     - `files` (id, name, size, mime_type, storage_key, owner_id, is_deleted, is_favorite, created_at, updated_at)
     - `folders` (id, name, owner_id, parent_id, created_at)
     - `shares` (id, file_id, shared_with_email, role, owner_id, created_at)

## Development

Run the development server with hot reload:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### File Operations

All file endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

#### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: <binary_data>
```

#### List Files
```http
GET /api/files
```

#### Search Files
```http
GET /api/files/search?q=<search_query>
```

#### Rename File
```http
PATCH /api/files/:id
Content-Type: application/json

{
  "name": "new_filename.txt"
}
```

#### Toggle Favorite
```http
PATCH /api/files/:id/favorite
```

#### Move to Trash (Soft Delete)
```http
DELETE /api/files/:id
```

#### Get Download Link
```http
GET /api/files/:id/link
```

#### List Trash Files
```http
GET /api/files/trash
```

#### Restore File
```http
POST /api/files/:id/restore
```

#### Permanent Delete
```http
DELETE /api/files/:id/permanent
```

### Folder Operations

#### Create Folder
```http
POST /api/folders
Content-Type: application/json

{
  "name": "My Folder",
  "parent_id": null
}
```

### Sharing

#### Share File
```http
POST /api/shares
Content-Type: application/json

{
  "fileId": "uuid",
  "targetEmail": "recipient@example.com",
  "role": "viewer"
}
```

## Project Structure

```
cloud-storage-backend/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── controllers/
│   │   ├── authController.ts     # Authentication logic
│   │   ├── fileController.ts     # File management logic
│   │   ├── folderController.ts   # Folder operations
│   │   └── shareController.ts    # Sharing functionality
│   ├── middleware/
│   │   └── authMiddleware.ts     # JWT verification
│   ├── routes/
│   │   ├── authRoutes.ts         # Auth endpoints
│   │   ├── fileRoutes.ts         # File endpoints
│   │   ├── folderRoutes.ts       # Folder endpoints
│   │   └── shareRoutes.ts        # Share endpoints
│   └── index.ts                  # Application entry point
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- Password hashing via Supabase Auth
- JWT token-based authentication
- Row-level security through ownership validation
- Signed URLs with expiration for file downloads
- Protected routes requiring authentication

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

ISC

## Author

Siddharth Bhattacharya

## Support

For issues or questions, please open an issue in the repository.
