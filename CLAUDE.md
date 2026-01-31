# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gray Media is a cloud file storage application built with Laravel 12 and React 19 via Inertia.js. It provides multi-user file management with hierarchical folders, file uploads with security validation, and an admin panel.

## Development Commands

```bash
# Initial setup (installs deps, generates keys, runs migrations)
composer setup

# Start development (Laravel server + queue + logs + Vite in parallel)
composer dev

# Run tests
composer test

# Code formatting
php artisan pint

# Frontend only
npm run dev
npm run build
```

## Architecture

**Backend (Laravel 12, PHP 8.2+)**
- Controllers in `app/Http/Controllers/` - RESTful with Auth/ and Admin/ subdirectories
- Models in `app/Models/` - User, File, Folder with Eloquent relationships
- Services in `app/Services/` - FileSecurityService handles file validation/sanitization
- Form requests in `app/Http/Requests/` for validation

**Frontend (React 19 + Inertia.js + Tailwind CSS 4)**
- Page components in `resources/js/Pages/` - correspond to Inertia routes
- Reusable components in `resources/js/Components/` - Layout/, Files/, Search/, UI/
- Entry point: `resources/js/app.jsx`

**Key Middleware**
- `HandleInertiaRequests` - shares auth user and flash messages to React
- `AdminMiddleware` - protects admin routes (checks `User::isAdmin()`)

## Database

MySql by default. Three main models:
- **User** - has role field (admin check), hasMany files/folders
- **Folder** - self-referential parent_id for nesting, belongsTo user
- **File** - belongsTo user and folder, has search and filterByType scopes

## Key Patterns

**Inertia.js Integration**: No separate API - controllers return `Inertia::render()` with props that React pages receive directly.

**File Security** (`FileSecurityService`):
- Blocks dangerous extensions (php, js, exe, etc.) and MIME types
- Detects double extensions (file.php.jpg)
- Sanitizes filenames, generates obfuscated storage paths

**Authorization**: Route middleware for admin, controller-level ownership checks for files/folders (returns 403 for non-owners).

**File Model Scopes**: Use `File::search($query)` and `File::filterByType($type)` for filtering.

## Testing

PHPUnit with in-memory SQLite. Tests in `tests/Feature/` and `tests/Unit/`.
