export const supabase = { auth: { signInWithPassword: async () => ({ data: null, error: null }) } };
export const createClient = () => supabase;
