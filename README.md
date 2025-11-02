# HIVE - Volunteer Management Platform

A comprehensive volunteer management platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Organization Management**: Create and manage organizations
- **Event Management**: Create, manage, and track volunteer events
- **Volunteer Hours Tracking**: Track and manage volunteer hours
- **Real-time Notifications**: Stay updated with announcements and notifications
- **Responsive Design**: Beautiful UI that works on all devices
- **Role-based Access**: Different permissions for admins, volunteers, and users

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **UI Components**: Radix UI, Lucide React
- **State Management**: React Context API

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: User profiles and authentication
- **Organizations**: Volunteer organizations
- **Events**: Volunteer events and activities
- **Volunteer Hours**: Time tracking and verification
- **Notifications**: User notifications and announcements
- **Member Management**: Organization membership and roles

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Run the provided SQL schema in your Supabase SQL editor to create all necessary tables, relationships, and constraints.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── dashboard/         # User dashboards
│   ├── organizations/     # Organization management
│   └── ...
├── components/            # Reusable UI components
│   ├── common/           # Common components
│   ├── layout/           # Layout components
│   └── organizations/     # Organization-specific components
├── contexts/              # React contexts
│   ├── AuthContext.tsx   # Authentication context
│   └── OrganizationContext.tsx
├── lib/                   # Utility functions and configurations
│   ├── supabase.ts       # Supabase client
│   ├── types.ts          # TypeScript types
│   ├── services.ts       # Database service functions
│   └── utils.ts          # Utility functions
└── ...
```

## Key Features Implemented

### Authentication
- Secure user registration and login
- Role-based access control (admin, volunteer, user)
- Protected routes and components
- User profile management

### Organization Management
- Create and manage organizations
- Join/leave organizations
- Member role management
- Organization settings and configuration

### Event Management
- Create and manage volunteer events
- Event registration and check-in
- Event categories and filtering
- Event capacity and waitlist management

### Volunteer Hours Tracking
- Track volunteer hours per event
- Hours verification and approval
- Volunteer session management
- Hours reporting and analytics

### Notifications System
- User notifications
- Organization announcements
- Email and in-app notifications
- Notification preferences

## Database Services

The application includes comprehensive service functions for:

- **Organization Service**: CRUD operations for organizations
- **Event Service**: Event management and attendee tracking
- **User Service**: User profile management
- **Volunteer Hours Service**: Hours tracking and management
- **Notification Service**: Notification management
- **Announcement Service**: Organization announcements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
