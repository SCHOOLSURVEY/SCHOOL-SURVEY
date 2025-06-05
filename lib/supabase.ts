import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kpuauqntarndcyeqzmxi.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdWF1cW50YXJuZGN5ZXF6bXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTAwMzMsImV4cCI6MjA2Mzc4NjAzM30.t9HtaJAFz0NaMxVDurhpEweNO-gy85KG0R4zSkFVoBU"

export const supabase = supabaseCreateClient(supabaseUrl, supabaseKey)

export function createClient() {
  return supabaseCreateClient(supabaseUrl, supabaseKey)
}
