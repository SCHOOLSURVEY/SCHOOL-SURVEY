const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolsurvey'

async function testMongoDB() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB successfully')
    
    const db = client.db('schoolsurvey')
    
    // Test collections
    const collections = await db.listCollections().toArray()
    console.log('✅ Collections found:', collections.map(c => c.name))
    
    // Test data
    const schools = await db.collection('schools').find({}).toArray()
    console.log('✅ Schools:', schools.length)
    
    const users = await db.collection('users').find({}).toArray()
    console.log('✅ Users:', users.length)
    
    const subjects = await db.collection('subjects').find({}).toArray()
    console.log('✅ Subjects:', subjects.length)
    
    // Test relationships
    const courses = await db.collection('courses').find({}).toArray()
    console.log('✅ Courses:', courses.length)
    
    const surveys = await db.collection('surveys').find({}).toArray()
    console.log('✅ Surveys:', surveys.length)
    
    console.log('\n🎉 MongoDB setup is working correctly!')
    console.log('You can now start using MongoDB in your application.')
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error)
  } finally {
    await client.close()
  }
}

testMongoDB()

