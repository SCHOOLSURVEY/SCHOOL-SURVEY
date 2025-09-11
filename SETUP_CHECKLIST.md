# 🚀 Teacher Codes System Setup Checklist

## ✅ Step 1: Update Environment Variables

1. **Get your new Supabase credentials:**
   - Go to your new Supabase project dashboard
   - Navigate to Settings → API
   - Copy the Project URL and Anon Key

2. **Update `.env.local` file:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key_here
   ```

## ✅ Step 2: Run Database Migration

1. **Go to your new Supabase project**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content of `teacher-codes-migration.sql`**
4. **Click "Run" to execute the migration**

## ✅ Step 3: Test the System

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test admin functionality:**
   - Go to `http://localhost:3000/admin`
   - Click on "Teacher Codes" tab
   - Try creating a teacher code

3. **Test teacher registration:**
   - Go to `http://localhost:3000/auth/teacher-register`
   - Use a created teacher code to register

## ✅ Step 4: Verify Integration

1. **Check if components load without errors**
2. **Test teacher code creation**
3. **Test teacher registration flow**
4. **Verify database functions work**

## 🧪 Quick Test Commands

### Test Database Connection:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM teacher_codes LIMIT 1;
SELECT * FROM schools LIMIT 1;
```

### Test Code Generation:
```sql
-- Run in Supabase SQL Editor
SELECT generate_secure_teacher_code('DEF', 'Test Teacher');
```

### Test Component Loading:
- Visit `/admin` and check for "Teacher Codes" tab
- Visit `/auth/teacher-register` and verify page loads

## 🎯 Expected Results

### Admin Dashboard:
- ✅ "Teacher Codes" tab appears
- ✅ Can create new teacher codes
- ✅ Can view existing codes
- ✅ Can copy codes to clipboard

### Teacher Registration:
- ✅ Page loads without errors
- ✅ Can enter teacher code
- ✅ Code validation works
- ✅ Registration flow completes

### Database:
- ✅ `teacher_codes` table exists
- ✅ `schools` table has `abbreviation` column
- ✅ All functions work correctly
- ✅ RLS policies are active

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid teacher code" error:**
   - Check if code exists in database
   - Verify code is active and not expired
   - Ensure code hasn't been used already

2. **"School not found" error:**
   - Make sure school has abbreviation set
   - Check school_id is correct

3. **Database connection issues:**
   - Verify new Supabase credentials
   - Check if migration was run successfully

4. **Component not loading:**
   - Check browser console for errors
   - Verify all imports are correct
   - Check if development server is running

### Debug Steps:

1. **Check database tables:**
   ```sql
   SELECT * FROM teacher_codes;
   SELECT * FROM schools;
   ```

2. **Test functions:**
   ```sql
   SELECT generate_secure_teacher_code('DEF', 'Test Teacher');
   ```

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'teacher_codes';
   ```

## 🎉 Success Criteria

- ✅ Development server starts without errors
- ✅ Admin dashboard shows "Teacher Codes" tab
- ✅ Teacher registration page loads
- ✅ Can create teacher codes
- ✅ Can register teachers with codes
- ✅ Database functions work correctly
- ✅ No console errors in browser

## 📞 Next Steps After Setup

1. **Create your first school** (if not already done)
2. **Create teacher codes** for your teachers
3. **Test the complete registration flow**
4. **Train your admins** on the new system
5. **Share teacher codes** with your teachers

Your teacher code system is now ready to use! 🚀
