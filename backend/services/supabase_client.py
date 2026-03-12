from supabase import Client, create_client

from config.env import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.")

# Service-role client — has admin privileges (create/delete users, bypass RLS).
# Never expose this key to the browser.
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
