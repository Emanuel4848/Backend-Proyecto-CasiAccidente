import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl) {
  throw new Error("CRÍTICO: La variable SUPABASE_URL no está configurada en Railway.");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);