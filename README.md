# FreelancePro

A comprehensive freelance management platform built with Next.js 14, TypeScript, and modern web technologies. Manage clients, projects, invoices, and expenses all in one place.

## Features

### 🔐 Authentication & Security

- Secure authentication with NextAuth.js
- Protected routes and API endpoints
- Session management

### 👥 Client Management

- Add, edit, and delete clients
- Store client contact information and company details
- View client project history

### 📋 Project Management

- Create and manage projects
- Track project status (Active, Completed, Paused)
- Set hourly or fixed rates
- Assign projects to clients
- Set deadlines and track progress

### 💰 Invoice Management

- Generate professional invoices
- PDF invoice generation and download
- Track invoice status (Paid/Unpaid)
- Link invoices to projects and clients
- Set due dates and payment tracking

### 📊 Expense Tracking

- Record project-related expenses
- Categorize expenses (Software, Equipment, Travel, Other)
- Link expenses to specific projects
- Track expense dates and amounts

### 📈 Dashboard Analytics

- Overview of total revenue and expenses
- Active projects count
- Recent invoices and expenses
- Quick access to key metrics

### 📄 PDF Generation

- Professional invoice PDF generation
- Download and preview capabilities
- Customizable invoice templates

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **PDF Generation**: jsPDF
- **Validation**: Zod
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd freelancepro
```

### 2. Automated Setup

Run the setup script to automatically configure the environment:

```bash
chmod +x setup.sh
./setup.sh
```

This script will:

- Check for Node.js installation
- Install dependencies
- Create environment files
- Generate Prisma client
- Set up the database
- Generate NextAuth secret

### 3. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Install dependencies
npm install

# Copy environment files
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Set up database
npx prisma db push

# Generate NextAuth secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configure Environment Variables

Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Database Setup

### SQLite (Development)

The project is configured to use SQLite for local development:

```env
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (Production)

For production, update your environment variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/freelancepro"
```

Then update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Using Docker (Optional)

A `docker-compose.yml` file is provided for easy PostgreSQL setup:

```bash
docker-compose up -d
```

## Project Structure

```
freelancepro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   └── ui/               # Shadcn/ui components
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts           # Authentication config
│   │   ├── prisma.ts         # Database client
│   │   ├── validations.ts    # Zod schemas
│   │   ├── error-handler.ts  # Error handling
│   │   ├── api-middleware.ts # API middleware
│   │   └── pdf-generator.ts  # PDF generation
│   └── types/                # TypeScript type definitions
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
└── setup.sh                 # Automated setup script
```

## API Routes

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Clients

- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get client by ID
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project by ID
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Invoices

- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get invoice by ID
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice

### Expenses

- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/[id]` - Get expense by ID
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

## Deployment

---

## Next.js + Supabase — Minimal Env and Client Setup

- Environment uses exactly three variables in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase Project URL (public).
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public).
  - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only).
- Install packages: `@supabase/supabase-js` and `@supabase/ssr` (already added).
- Client architecture:
  - Browser client: `src/lib/supabase/browser.ts` using `createBrowserClient`.
  - Server client: `src/lib/supabase/server.ts` using `createServerClient` and cookies.
  - Admin client: `src/lib/supabase/admin.ts` using service role key.
- Minimal `.env.local` example:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_PUBLIC_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

### Middleware (Auth wiring)
- A stub `middleware.ts` is included to wire Supabase auth cookies for protected routes.
- It currently does not enforce redirects to avoid breaking existing flows; extend it to guard routes once Supabase auth pages are added.

### Migration Notes
- Database and auth operations should migrate from Prisma/NextAuth to Supabase clients.
- Replace Prisma queries in API handlers with Supabase methods (`select`, `insert`, `update`, `delete`).
- Implement Supabase sign up/sign in/sign out using `supabase.auth` and remove NextAuth once fully migrated.
 - A SQL schema is provided at `supabase/schema.sql`. Apply it in Supabase SQL Editor to create tables mirroring current Prisma models (users, clients, projects, invoices and enums).

Refer to Supabase docs for RLS policies and SSR patterns.

### Connectivity Check
- An API route `GET /api/supabase/health` verifies connection via `auth.admin.listUsers` using the service role key.
- If it returns `{ ok: true }`, your keys are correct and Supabase is reachable.

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `NEXTAUTH_URL`: Your deployed app URL (e.g., https://your-app.vercel.app)
   - `NEXTAUTH_SECRET`: A secure random string for JWT encryption
   - `DATABASE_URL`: `file:./prisma/dev.db` (SQLite database)
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### Database Setup

The application uses SQLite database which is automatically created during the build process. No external database setup required:

```bash
# Database is automatically migrated during build
npm run build
```

### Other Platforms

The application can be deployed to any platform that supports Node.js:

- **Netlify**: Use the Next.js build command
- **Railway**: Connect your GitHub repository
- **DigitalOcean App Platform**: Deploy from GitHub
- **AWS Amplify**: Connect your repository

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Database Commands

```bash
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes to database
npx prisma db pull     # Pull schema from database
npx prisma studio      # Open Prisma Studio
npx prisma migrate dev # Create and apply migration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

## Roadmap

- [ ] Time tracking functionality
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] Multi-currency support
- [ ] Invoice templates customization
- [ ] Client portal
- [ ] Mobile app
- [ ] Integration with payment gateways

---

**FreelancePro** - Streamline your freelance business management.

## Code Style & Conventions

- Components use PascalCase; variables and functions use camelCase.
- Keep functions focused and under ~50 lines where reasonable.
- Prefer descriptive names over abbreviations; avoid magic numbers/strings.
- Co-locate files by feature; separate UI from business logic.
- Use JSDoc for public functions and complex handlers.

## Structure Updates

- Added `src/config/constants.ts` for shared enums and defaults.
- Added `src/components/ui/index.ts` to enable clean UI imports.
- Added `src/utils/index.ts` to re-export common libs and helpers.
- Added `.editorconfig`, `.prettierrc.json`, and `.vscode/settings.json` for consistent formatting.
- No feature changes; all updates are structural and documentation-only.

## Editor & Formatting

- Prettier is the default formatter with format-on-save enabled.
- LF line endings, UTF-8 charset, 2-space indentation across the project.
- Prettier ignores build artifacts and generated files (`.next`, `node_modules`, `prisma/dev.db`).

## Architecture Overview

- Next.js App Router with server components for data fetching.
- NextAuth for authentication and session management.
- Prisma ORM with SQLite in development; PostgreSQL recommended for production.
- Shadcn/UI for accessible, composable UI primitives.
- Zod for validation; structured error handling in API routes.

## Quality Checklist

- All pages load without errors; UX remains unchanged.
- Imports resolve cleanly via barrel files; no duplication.
- Constants centralize repeated strings and default values.
- JSDoc and comments present where logic is non-trivial.
- Codebase is consistently formatted and easy to navigate.

# FREELANCE_PRO
## Supabase Postgres Setup

Use Supabase’s managed Postgres with Prisma so your app stays in sync.

1) Get your connection string
- Go to Supabase → Project Settings → Database → Connection string.
- Prefer the Direct connection for Prisma (db.YOUR_REF.supabase.co:5432).
- If you must use the Pooled connection (PgBouncer), add `pgbouncer=true` and `connection_limit=1`.

2) Set environment variables
- Create `.env.local` from `.env.example` and update:
  - `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres?schema=public&sslmode=require"`
  - `NEXTAUTH_SECRET` with a secure random string.

3) Switch Prisma to Postgres
- Ensure `prisma/schema.prisma` datasource is set to `provider = "postgresql"` and uses `env("DATABASE_URL")`.

4) Apply Prisma schema to Supabase
- If you have migrations in `prisma/migrations`, run:
  - `npx prisma migrate deploy`
- If this is a new DB or you used `db push` before:
  - `npx prisma db push` (non-destructive) then create future changes with migrations.

5) Generate Prisma client
- `npx prisma generate`

6) Verify locally
- Start the app: `npm run dev`
- Create a client/project and confirm data appears in Supabase.

Notes
- Supabase requires SSL; keep `sslmode=require` in `DATABASE_URL`.
- For PgBouncer pooled connections, use the pooled URL and include `pgbouncer=true&connection_limit=1`.
- If your DB already has tables, run `npx prisma db pull` to sync your Prisma schema to what exists.

### Minimal `.env.local`

For a clean environment file focused on Supabase, keep only:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres?schema=public&sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-random-string"
```

Optional OAuth providers (Google/GitHub, etc.) can be added later as needed, but are not required for basic credentials-based auth.
