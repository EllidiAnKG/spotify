import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ndcvronhgjgzgxelnlaa.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kY3Zyb25oZ2pnemd4ZWxubGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MDUxMTEsImV4cCI6MjA0NjQ4MTExMX0.QQXyrGEi3sDX__agZL1b_WozVxl92prYLx-45XYNfMI"

export const supabase = createClient(supabaseUrl, supabaseAnonKey);