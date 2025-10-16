import { cookies } from 'next/headers';
import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabaseRoute = () => createRouteHandlerClient({ cookies });
export const supabaseServerComponent = () => createServerComponentClient({ cookies });

