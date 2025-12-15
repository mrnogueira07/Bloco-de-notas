import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pejzfxuzzbjiqitqshyw.supabase.co';
const supabaseKey = 'sb_publishable_St96xpPejVLCVKUwd0xriQ_Cn7-ahCB';

export const supabase = createClient(supabaseUrl, supabaseKey);