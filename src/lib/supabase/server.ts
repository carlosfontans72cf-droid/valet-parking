import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hzexxoazyhhvljqiummn.supabase.co";
const supabaseAnonKey = "sb_publishable_ALyCDA4qM4T68YiecEQErQ_WoYNUfen";

export function createServerSupabase() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
