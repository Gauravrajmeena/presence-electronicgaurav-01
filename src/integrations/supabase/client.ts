
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sihigimpoytimvbcxfez.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaGlnaW1wb3l0aW12YmN4ZmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NjcwOTYsImV4cCI6MjA1MTE0MzA5Nn0.pCANQCNQWImtTpDOdqitt4e_PgRDrFsDr_taa-izifE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
