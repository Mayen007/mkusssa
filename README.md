# MKUSSSA Nairobi Campus Website

MKUSSSA’s site is staying visually familiar on the outside while moving to a dynamic backend for admin-managed content on the inside. The public frontend remains the same; the Node.js API now handles events, leadership, and authentication.

**Mission:** Unite, support, and empower South Sudanese students through academic excellence, cultural celebration, and community solidarity.

## At a Glance

- Public site: static HTML, CSS, and minimal JavaScript
- Backend: Node.js, Express, MongoDB, JWT auth
- Current dynamic modules: events CRUD, admin login, leadership management, announcements, gallery, and membership submissions

## What’s in the Repo

```
mkusssa/
├── index.html
├── css/style.css
├── js/script.js
├── assets/
├── docs/
└── server/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── scripts/
    └── server.js
```

## Public Frontend

Edit these files to change the public experience:

- [index.html](index.html) for content and structure
- [css/style.css](css/style.css) for layout, color, spacing, and responsiveness
- [js/script.js](js/script.js) for the mobile nav and hero carousel

## Backend Overview

The backend in `server/` uses:

- Express for routing
- MongoDB for data storage
- CORS for browser access
- bcryptjs and jsonwebtoken for admin auth

The Express app serves the API and can also serve the public site during local development. The public pages live at the repository root, while the admin experience is split across `admin-login.html` and `admin.html`.

### Server Scripts

Run these from `server/`:

- `npm run dev` starts the API with nodemon
- `npm start` starts the API once
- `npm run seed:admin` creates or updates a local admin account

## Developer Setup

### 1. Configure the API

Create `server/.env`:

```dotenv
PORT=5000
MONGODB_URI=your-mongodb-uri
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

The database name is read from the MongoDB URI path when present.

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

Check the API:

```text
http://localhost:5000/api/health
```

### 3. Seed an admin and test login

The seed script creates a local admin you can use for auth testing.

```bash
cd server
npm run seed:admin
```

Default seed values:

- Email: `admin@mkusssa.local`
- Password: `ChangeMe123!`

Then test login against `POST /api/auth/login` and confirm the token works with `GET /api/auth/me`.

## API Routes

Public:

- `GET /api/health`
- `GET /api/events`
- `GET /api/events/all`
- `GET /api/events/:slug`
- `GET /api/leaders/current`
- `GET /api/leaders/history`
- `GET /api/announcements`
- `GET /api/gallery`
- `GET /api/memberships/all`

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`

Protected writes:

- `POST /api/events`
- `PATCH /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/leaders`
- `PATCH /api/leaders/:id`
- `DELETE /api/leaders/:id`
- `POST /api/announcements`
- `PATCH /api/announcements/:id`
- `DELETE /api/announcements/:id`
- `POST /api/gallery`
- `PATCH /api/gallery/:id`
- `DELETE /api/gallery/:id`
- `POST /api/memberships`

## Editing Notes

- Change the public site in `index.html` and `css/style.css`.
- Change backend behavior in `server/`.
- Do not commit `server/.env`.

## Ownership

This site is proprietary. All rights reserved applies. Collaborators may edit but cannot distribute or sublicense without permission.

Third-party licenses:

- Fonts (Poppins, Inter) use OFL
- Font Awesome uses CC BY 4.0

## Contributing

1. Create a branch: `git checkout -b feature/your-change`
2. Make changes and test locally
3. Verify:
   - No console errors
   - Mobile menu works
   - API routes respond as expected
   - Responsive at 320px, 768px, and desktop
   - Images load
4. Commit with a clear message: `Add event CRUD`, `Update auth flow`
5. Submit a pull request with a description of changes
