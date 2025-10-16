import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Client components don't take cookies configuration; env NEXT_PUBLIC_SUPABASE_* are used.
export const supabaseBrowser = () => createClientComponentClient();
