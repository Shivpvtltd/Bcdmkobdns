# UPlayG - Production-Ready App Store Platform

A premium, backend-driven app store platform built with Node.js, Express, Firebase, and Vanilla JavaScript.

## 🚀 Features

- **Backend-First Architecture**: All critical operations go through secure backend APIs
- **Firebase Integration**: Authentication, Firestore, and Storage
- **Dynamic Hero Slider**: Admin-managed slides with auto-rotation
- **File Upload System**: Direct file uploads to Firebase Storage
- **Rating System**: Play Store-style ratings with reviews
- **Admin Dashboard**: Complete app and content management
- **Responsive Design**: Mobile-first, works on all devices
- **Security First**: Firebase rules, input validation, and rate limiting

## 📁 Project Structure

```
uplayg-prod/
├── backend/                 # Node.js + Express API
│   ├── controllers/         # Request handlers
│   ├── middlewares/         # Auth, error handling, security
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic
│   ├── validators/         # Input validation
│   ├── utils/              # Utilities (Firebase, etc.)
│   ├── server.js           # Entry point
│   └── package.json
├── frontend/               # Single-page vanilla JS app
│   ├── js/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API, auth, storage
│   │   ├── app.js          # Main entry
│   │   └── router.js       # Client-side routing
│   ├── css/styles.css      # Main stylesheet
│   ├── assets/images/      # Static assets
│   └── index.html          # Single HTML entry
├── admin/                  # Admin dashboard
│   ├── dashboard.html
│   ├── css/admin.css
│   └── js/admin.js
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── firebase.json           # Firebase configuration
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- Firebase project with Authentication, Firestore, and Storage enabled
- Service account key for Firebase Admin SDK

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev

# Or start production server
npm start
```

### Frontend Setup

The frontend is a static site that can be served by any web server:

```bash
# Using Python
python -m http.server 5000 --directory frontend

# Using Node.js
npx serve frontend

# Or deploy to Firebase Hosting
firebase deploy --only hosting
```

### Admin Setup

The admin panel is a separate HTML file that connects directly to Firebase:

```bash
# Serve admin panel
python -m http.server 5001 --directory admin
```

### Firebase Configuration

1. Enable Authentication (Google provider)
2. Create Firestore database
3. Enable Storage
4. Deploy security rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

## 🔐 Security

### Firestore Rules

- Users can only modify their own data
- Only admins can publish apps and manage slides
- Ratings are write-protected per user

### Backend Security

- Firebase ID token verification
- Input validation with express-validator
- Rate limiting
- CORS configuration
- Security headers with Helmet

### Storage Rules

- Image type validation
- 5MB file size limit
- Owner-based access control

## 📡 API Endpoints

### Apps
- `GET /api/apps` - List active apps
- `GET /api/apps/:id` - Get app by ID
- `GET /api/apps/slug/:slug` - Get app by slug
- `POST /api/apps` - Create app (auth required)
- `PUT /api/apps/:id` - Update app (owner/admin)
- `DELETE /api/apps/:id` - Delete app (owner/admin)
- `GET /api/apps/my/apps` - Get user's apps
- `GET /api/apps/search?q=query` - Search apps

### Ratings
- `GET /api/ratings/:appId` - Get app ratings
- `GET /api/ratings/:appId/summary` - Get rating summary
- `POST /api/ratings/:appId` - Submit/update rating (auth)
- `DELETE /api/ratings/:appId` - Delete rating (auth)

### Slider
- `GET /api/slider` - Get active slides
- `POST /api/slider` - Create slide (admin)
- `PUT /api/slider/:id` - Update slide (admin)
- `DELETE /api/slider/:id` - Delete slide (admin)
- `POST /api/slider/reorder` - Reorder slides (admin)

### Uploads
- `POST /api/uploads/single` - Upload single file
- `POST /api/uploads/multiple` - Upload multiple files
- `POST /api/uploads/logo` - Upload app logo
- `POST /api/uploads/screenshots` - Upload screenshots
- `DELETE /api/uploads` - Delete file

## 🎨 UI Components

### Hero Slider
- Auto-rotating slides
- Touch/swipe support
- Admin-managed content
- Links to featured apps

### App Cards
- Logo, name, category
- Rating display
- Hover effects
- Responsive grid

### Rating System
- 5-star rating input
- Review text area
- Average rating display
- Rating distribution bars

### File Upload
- Drag-and-drop support
- Image preview
- Multiple file support
- Progress indication

## 🚀 Deployment

### Backend (e.g., Railway, Render, Heroku)

```bash
# Set environment variables
PORT=3000
FIREBASE_SERVICE_ACCOUNT=<your-service-account-json>

# Deploy
git push origin main
```

### Frontend (Firebase Hosting)

```bash
firebase deploy --only hosting
```

### Admin (Firebase Hosting or separate server)

```bash
# Deploy with frontend
firebase deploy --only hosting

# Or serve separately
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON | Yes |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket name | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |
| `NODE_ENV` | Environment mode | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with:
- [Firebase](https://firebase.google.com/)
- [Express.js](https://expressjs.com/)
- [Vanilla JS](http://vanilla-js.com/)
- [Inter Font](https://rsms.me/inter/)
# Bcdmkobdns
