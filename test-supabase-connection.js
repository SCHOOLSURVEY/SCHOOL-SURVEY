// Test Supabase connection and authentication
// Run this in the browser console to debug the connection

console.log("=== Supabase Connection Test ===");

// Check if supabase is available
if (typeof window !== 'undefined' && window.supabase) {
  console.log("Supabase client found:", window.supabase);
} else {
  console.log("Supabase client not found on window");
}

// Check current user
async function testSupabaseConnection() {
  try {
    // Import supabase (assuming it's available)
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = "https://kpuauqntarndcyeqzmxi.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdWF1cW50YXJuZGN5ZXF6bXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTAwMzMsImV4cCI6MjA2Mzc4NjAzM30.t9HtaJAFz0NaMxVDurhpEweNO-gy85KG0R4zSkFVoBU";
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Supabase URL:", supabaseUrl);
    console.log("Supabase Key (first 20 chars):", supabaseKey.substring(0, 20) + "...");
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("Current user:", user);
    console.log("User error:", userError);
    
    // Check storage buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    console.log("Storage buckets:", buckets);
    console.log("Bucket error:", bucketError);
    
    // Test a simple upload (without actually uploading)
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    console.log("Test file created:", testFile);
    
    // Check if we can access the submissions bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('submissions')
      .list('', { limit: 1 });
    console.log("Submissions bucket access:", files);
    console.log("Files error:", filesError);
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Run the test
testSupabaseConnection();
