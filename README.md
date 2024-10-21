# Remix Auth Starter with Prisma and Resend

This is a starter template for building a Remix React application with authentication, database integration using Prisma, and email functionality via Resend. It provides a solid foundation for developing modern web applications with robust authentication and database capabilities.

## Features

- Remix
- Authentication using Remix Auth (with email, Google and GitHub providers)
- Database ORM with Prisma
- Email sending capabilities with Resend
- TypeScript support
- Currently unstyled but supports Tailwind CSS for styling

## Prerequisites

- Node.js 16.8 or later
- npm or yarn
- A database (PostgreSQL recommended, but Prisma supports others)
- Resend API key for email functionality
- Google Client ID and Secret for Google OAuth
- GitHub Client ID and Secret for GitHub OAuth
- A NextAuth secret (you can generate one using the command below)
- A database URL (you can use the free tier of services like Supabase or Railway)

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/jonsrose/remix-auth-prisma-resend-starter.git
   cd remix-auth-prisma-resend-starter
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

3. Set up your environment variables:

  Create a new `.env` file and add the following:
   ```
   BASE_URL=<your-base-url>
   DATABASE_URL=<your-database-url>
   SESSION_SECRET=<your-session-secret>
   RESEND_API_KEY=<your-resend-api-key>
   EMAIL_FROM=<your-email-from>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   GITHUB_CLIENT_ID=<your-github-client-id>
   GITHUB_CLIENT_SECRET=<your-github-client-secret>

   ```
  To generate a secure value for SESSION_SECRET, you can use this command:
   ```
   openssl rand -base64 32
   ```

4. Set up your database and run migrations:
   ```
   npx prisma migrate dev
   ```

5. Generate the Prisma client:
   ```
   npx prisma generate
   ```

6. Run the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

7. Open [http://localhost:5173](http://localhost:5173) in your browser to see the result.

## Project Structure

- `/app`: Contains the Remix app pages and components
- `/prisma`: Prisma schema and migrations

## Authentication

This project uses Remix Auth for authentication with Google, GitHub, and Email providers.
## Database

Prisma is used as the ORM. The database schema is defined in `/prisma/schema.prisma`. Run `npx prisma studio` to open the Prisma Studio and manage your data.

## Email Functionality

Resend is integrated for sending emails. Configure your Resend API key in the `.env` file and use the provided utility functions to send emails from your application. Note: For email verification to work with external email addresses, you may need to set up a custom domain with Resend.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
