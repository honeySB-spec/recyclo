import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpgsrbewwntkdfxswgif.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZ3NyYmV3d250a2RmeHN3Z2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MTY1NDUsImV4cCI6MjEwODM5MjU0NX0.w5VoyePhHiY-qs4sDQ0kq_4pGCwcXb2clGYmKe4KTss';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
