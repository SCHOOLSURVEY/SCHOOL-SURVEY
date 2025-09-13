# MongoDB Migration Guide

## 🚀 Complete Migration from Supabase to MongoDB

This guide covers the complete migration of SchoolSurvey from Supabase to MongoDB.

## ✅ What's Been Completed

### 1. **MongoDB Setup**
- ✅ MongoDB connection configuration (`lib/mongodb.ts`)
- ✅ Complete schema definitions (`lib/schemas.ts`)
- ✅ Database service layer (`lib/database.ts`)
- ✅ MongoDB authentication (`lib/auth-mongodb.ts`)
- ✅ Migration script (`scripts/migrate-to-mongodb.js`)
- ✅ Test script (`scripts/test-mongodb.js`)

### 2. **Database Structure**
- ✅ 15 collections created with proper relationships
- ✅ Multi-tenant support with school_id references
- ✅ Indexes for performance optimization
- ✅ Sample data seeded

### 3. **Authentication System**
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ User creation and verification
- ✅ Updated auth-actions.ts

### 4. **API Routes**
- ✅ MongoDB-based API routes
- ✅ Survey management endpoints
- ✅ User management endpoints

## 🔄 Migration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Setup | ✅ Complete | All collections and schemas ready |
| Authentication | ✅ Complete | JWT-based auth implemented |
| Student Dashboard | 🔄 In Progress | MongoDB version created |
| Teacher Dashboard | ⏳ Pending | Needs MongoDB conversion |
| Admin Dashboard | ⏳ Pending | Needs MongoDB conversion |
| API Routes | 🔄 Partial | Basic routes implemented |
| Components | ⏳ Pending | Most components still use Supabase |

## 🛠️ Next Steps

### Immediate Actions Required:

1. **Create .env.local file** with MongoDB configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/schoolsurvey
   JWT_SECRET=your-super-secret-jwt-key
   ```

2. **Test the setup**:
   ```bash
   npm run test:mongodb
   ```

3. **Replace remaining Supabase calls** in components:
   - Teacher dashboard
   - Admin dashboard
   - Survey components
   - Analytics components

### Component Migration Priority:

1. **High Priority**:
   - `app/teacher/page.tsx`
   - `app/admin/page.tsx`
   - `components/teacher/quick-survey-creator.tsx`
   - `components/admin/enhanced-survey-creator.tsx`

2. **Medium Priority**:
   - `components/analytics/advanced-analytics.tsx`
   - `components/student/enhanced-survey-form.tsx`
   - `components/parent/parent-dashboard.tsx`

3. **Low Priority**:
   - Notification components
   - Messaging system
   - File upload components

## 📊 Database Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `schools` | School information | name, slug, settings |
| `users` | User accounts | email, role, school_id |
| `subjects` | Academic subjects | name, school_id |
| `courses` | Course offerings | name, teacher_id, subject_id |
| `course_enrollments` | Student enrollments | course_id, student_id |
| `assignments` | Academic assignments | title, course_id, due_date |
| `submissions` | Student submissions | assignment_id, student_id |
| `grades` | Assignment grades | assignment_id, student_id, points_earned |
| `surveys` | Feedback surveys | title, course_id, status |
| `survey_questions` | Survey questions | survey_id, question_text, type |
| `survey_responses` | Student responses | survey_id, student_id, response_value |
| `notifications` | User notifications | user_id, title, message |
| `attendance` | Attendance records | course_id, student_id, date |
| `scheduled_meetings` | Meeting scheduling | teacher_id, student_id, date |
| `feedback_messages` | Feedback messages | teacher_id, student_id, message |

## 🔧 Available Scripts

```bash
# Run migration
npm run migrate:setup

# Test MongoDB connection
npm run test:mongodb

# Start development server
npm run dev
```

## 🚨 Important Notes

1. **Data Migration**: The current migration only creates the structure and sample data. You'll need to export data from Supabase and import it to MongoDB if you have existing data.

2. **Authentication**: The new system uses JWT tokens instead of Supabase sessions. Update your frontend to handle JWT tokens.

3. **Real-time Features**: Supabase real-time subscriptions need to be replaced with WebSocket connections or Server-Sent Events.

4. **File Storage**: If you're using Supabase Storage, you'll need to implement file storage with MongoDB GridFS or a cloud storage service.

## 🎯 Testing Checklist

- [ ] MongoDB connection works
- [ ] Authentication system works
- [ ] Student dashboard loads data
- [ ] Teacher dashboard loads data
- [ ] Admin dashboard loads data
- [ ] Survey creation works
- [ ] Survey responses are saved
- [ ] User management works
- [ ] Analytics data loads

## 📞 Support

If you encounter any issues during migration:

1. Check MongoDB is running: `mongod --version`
2. Verify connection string in `.env.local`
3. Run test script: `npm run test:mongodb`
4. Check console for error messages
5. Verify all dependencies are installed: `npm install`

## 🎉 Success!

Once migration is complete, you'll have:
- ✅ Full MongoDB integration
- ✅ JWT-based authentication
- ✅ Multi-tenant architecture
- ✅ Scalable database structure
- ✅ No dependency on Supabase

