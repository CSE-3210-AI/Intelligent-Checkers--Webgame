from supabase import Client, create_client

from config.env import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    error = []
    if not SUPABASE_URL:
        error.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY:
        error.append("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY")
    missing = " and ".join(error)
    msg = f"Missing {missing} in .env. Service role key is required for user management (signup/admin operations)."
    print(msg, flush=True)
    raise RuntimeError(msg)

# Service-role client — has admin privileges (create/delete users, bypass RLS).
# Never expose this key to the browser.
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
