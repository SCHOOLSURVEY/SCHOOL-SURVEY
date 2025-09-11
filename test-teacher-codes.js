// Test script for Teacher Codes System
// Run this in your browser console or as a Node.js script

const SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_NEW_SUPABASE_ANON_KEY_HERE';

// Test 1: Check if teacher_codes table exists
async function testTeacherCodesTable() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/teacher_codes?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Teacher codes table exists and is accessible');
      return true;
    } else {
      console.log('❌ Teacher codes table not accessible:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing teacher codes table:', error);
    return false;
  }
}

// Test 2: Check if schools table has abbreviation column
async function testSchoolsAbbreviation() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=id,name,abbreviation&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Schools table has abbreviation column');
      return true;
    } else {
      console.log('❌ Schools table missing abbreviation column:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing schools table:', error);
    return false;
  }
}

// Test 3: Test teacher code generation function
async function testTeacherCodeGeneration() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/generate_secure_teacher_code`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_school_abbreviation: 'DEF',
        p_teacher_name: 'Test Teacher'
      })
    });
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ Teacher code generation function works:', data);
      return true;
    } else {
      console.log('❌ Teacher code generation function failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing teacher code generation:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Testing Teacher Codes System Integration...\n');
  
  const test1 = await testTeacherCodesTable();
  const test2 = await testSchoolsAbbreviation();
  const test3 = await testTeacherCodeGeneration();
  
  console.log('\n📊 Test Results:');
  console.log(`Teacher Codes Table: ${test1 ? '✅' : '❌'}`);
  console.log(`Schools Abbreviation: ${test2 ? '✅' : '❌'}`);
  console.log(`Code Generation: ${test3 ? '✅' : '❌'}`);
  
  if (test1 && test2 && test3) {
    console.log('\n🎉 All tests passed! Teacher codes system is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your database migration.');
  }
}

// Instructions
console.log(`
🔧 Teacher Codes System Test Script

Before running tests:
1. Update SUPABASE_URL and SUPABASE_ANON_KEY with your new project credentials
2. Make sure you've run the teacher-codes-migration.sql script
3. Run: runAllTests()

Expected results:
- Teacher codes table should exist and be accessible
- Schools table should have abbreviation column
- Teacher code generation function should work
`);

// Uncomment the line below to run tests automatically
// runAllTests();
