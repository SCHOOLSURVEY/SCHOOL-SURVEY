const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolsurvey'

// Sample data to seed the database
const sampleData = {
  schools: [
    {
      name: "Tech Academy",
      slug: "tech-academy",
      abbreviation: "TA",
      description: "A modern technology-focused school",
      address: "123 Tech Street, Innovation City",
      phone: "+1-555-0123",
      email: "info@techacademy.edu",
      website: "https://techacademy.edu",
      is_active: true
    },
    {
      name: "Riverside High School",
      slug: "riverside-high",
      abbreviation: "RHS",
      description: "Traditional high school with comprehensive programs",
      address: "456 Riverside Drive, River City",
      phone: "+1-555-0456",
      email: "info@riversidehigh.edu",
      website: "https://riversidehigh.edu",
      is_active: true
    }
  ],
  subjects: [
    { name: "Mathematics", description: "Core mathematics curriculum" },
    { name: "Science", description: "General science studies" },
    { name: "English", description: "Language arts and literature" },
    { name: "History", description: "Social studies and history" },
    { name: "Computer Science", description: "Programming and technology" }
  ],
  users: [
    {
      unique_id: "ADMIN001",
      email: "admin@techacademy.edu",
      full_name: "School Administrator",
      role: "admin",
      admin_code: "ADMIN123",
      is_active: true
    },
    {
      unique_id: "TCH001",
      email: "teacher@techacademy.edu",
      full_name: "John Smith",
      role: "teacher",
      teacher_code: "TCH123",
      is_active: true
    },
    {
      unique_id: "STU001",
      email: "student@techacademy.edu",
      full_name: "Alice Johnson",
      role: "student",
      class_number: "10A",
      is_active: true
    }
  ]
}

async function migrateToMongoDB() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db('schoolsurvey')
    
    // Create collections
    const collections = [
      'schools', 'users', 'subjects', 'courses', 'course_enrollments',
      'assignments', 'submissions', 'grades', 'surveys', 'survey_questions',
      'survey_responses', 'notifications', 'attendance', 'scheduled_meetings',
      'feedback_messages'
    ]
    
    for (const collectionName of collections) {
      await db.createCollection(collectionName)
      console.log(`Created collection: ${collectionName}`)
    }
    
    // Insert sample data
    if (sampleData.schools) {
      await db.collection('schools').insertMany(sampleData.schools)
      console.log('Inserted sample schools')
    }
    
    // Get school IDs for user creation
    const schools = await db.collection('schools').find({}).toArray()
    const techAcademy = schools.find(s => s.slug === 'tech-academy')
    
    if (techAcademy && sampleData.subjects) {
      const subjectsWithSchoolId = sampleData.subjects.map(subject => ({
        ...subject,
        school_id: techAcademy._id.toString(),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }))
      
      await db.collection('subjects').insertMany(subjectsWithSchoolId)
      console.log('Inserted sample subjects')
    }
    
    if (techAcademy && sampleData.users) {
      const usersWithSchoolId = sampleData.users.map(user => ({
        ...user,
        school_id: techAcademy._id.toString(),
        created_at: new Date(),
        updated_at: new Date()
      }))
      
      await db.collection('users').insertMany(usersWithSchoolId)
      console.log('Inserted sample users')
    }
    
    // Create indexes for better performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('users').createIndex({ school_id: 1 })
    await db.collection('users').createIndex({ role: 1 })
    
    await db.collection('schools').createIndex({ slug: 1 }, { unique: true })
    
    await db.collection('courses').createIndex({ school_id: 1 })
    await db.collection('courses').createIndex({ teacher_id: 1 })
    
    await db.collection('surveys').createIndex({ school_id: 1 })
    await db.collection('surveys').createIndex({ course_id: 1 })
    await db.collection('surveys').createIndex({ status: 1 })
    
    await db.collection('survey_responses').createIndex({ survey_id: 1, student_id: 1 })
    await db.collection('survey_responses').createIndex({ school_id: 1 })
    
    console.log('Created database indexes')
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await client.close()
  }
}

// Run migration
migrateToMongoDB()

