# SchoolSurvey

A comprehensive, modern school survey and feedback system built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality
- **User Management**: Admin, Teacher, Student, and Parent roles
- **Course Management**: Create and manage courses with teacher assignments
- **Student Enrollment**: Enroll students in courses
- **Assignment System**: Create, submit, and grade assignments
- **Survey System**: Create and manage student feedback surveys
- **Grade Management**: Track and manage student grades
- **Notification System**: Real-time notifications for users
- **Analytics Dashboard**: Comprehensive reporting and insights

### User Roles & Capabilities

#### 👑 Administrators
- Manage all users and system settings
- Create and manage subjects and courses
- Monitor system-wide analytics
- Manage admin access codes
- Oversee student enrollments

#### 👨‍🏫 Teachers
- Create and manage assignments
- Grade student submissions
- Create feedback surveys
- View class performance analytics
- Manage course content

#### 👨‍🎓 Students
- View and submit assignments
- Participate in surveys
- Track grades and progress
- Access course materials
- Receive notifications

#### 👨‍👩‍👧‍👦 Parents
- Monitor child's academic progress
- View grades and assignments
- Track attendance
- Receive important notifications

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Hooks
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd school-survey
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL commands to create all tables

### 5. Configure Storage (Optional)

For file uploads to work:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `submissions`
3. Set the bucket to public or configure RLS policies

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup

The system requires the following database tables:

- `users` - User accounts and profiles
- `subjects` - Academic subjects
- `courses` - Course offerings
- `course_enrollments` - Student course registrations
- `assignments` - Academic assignments
- `submissions` - Student assignment submissions
- `grades` - Assignment grades
- `surveys` - Feedback surveys
- `survey_questions` - Survey questions
- `survey_responses` - Student survey responses
- `notifications` - User notifications
- `attendance` - Student attendance records

All tables are created automatically when you run the `database-schema.sql` file.

## 🔐 Authentication Setup

The system uses Supabase Auth with the following configuration:

1. **Email Authentication**: Users can sign up with email
2. **Admin Codes**: Administrators use special codes to access admin features
3. **Role-Based Access**: Different features based on user role
4. **Session Management**: Automatic session handling

### Creating Your First Admin

1. Start the application
2. Go to `/admin` route
3. Use the developer setup to create your first admin account
4. The system will generate a unique admin code
5. Use this code to log in as an administrator

## 📁 Project Structure

```
school-survey/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard routes
│   ├── teacher/           # Teacher dashboard routes
│   ├── student/           # Student dashboard routes
│   ├── parent/            # Parent dashboard routes
│   └── auth/              # Authentication routes
├── components/             # React components
│   ├── admin/             # Admin-specific components
│   ├── teacher/           # Teacher-specific components
│   ├── student/           # Student-specific components
│   ├── parent/            # Parent-specific components
│   ├── ui/                # Reusable UI components
│   └── shared/            # Shared components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## 🎨 Customization

### Styling
- The system uses Tailwind CSS for styling
- Customize colors and themes in `tailwind.config.ts`
- Component styles can be modified in individual component files

### Components
- All components are built with Radix UI primitives
- Easily customizable and accessible
- Follow modern React patterns

### Database
- Modify `database-schema.sql` for schema changes
- Update types in `lib/types.ts` to match schema changes
- Adjust RLS policies for security requirements

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control**: Feature access based on user role
- **Input Validation**: Form validation with Zod
- **SQL Injection Protection**: Parameterized queries with Supabase
- **Session Management**: Secure session handling

## 📊 Analytics & Reporting

The system includes comprehensive analytics:

- **Student Performance**: Grade tracking and analysis
- **Course Analytics**: Enrollment and completion rates
- **Survey Insights**: Student feedback analysis
- **Attendance Tracking**: Student attendance patterns
- **Custom Reports**: Generate reports based on various criteria

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The system can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted servers

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your Supabase credentials
   - Check if all tables are created
   - Ensure RLS policies are configured

2. **Authentication Issues**
   - Check Supabase Auth settings
   - Verify email templates are configured
   - Check browser console for errors

3. **File Upload Issues**
   - Ensure storage bucket is created
   - Check storage policies
   - Verify file size limits

4. **Build Errors**
   - Clear `.next` folder
   - Reinstall dependencies
   - Check Node.js version compatibility

### Getting Help

1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Check the application logs
4. Verify all environment variables are set

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the troubleshooting section

---

**Happy Surveying! 📊**




