import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://znmkxvsbpqbnhkkbrrav.supabase.co'
const supabaseKey = 'sb_publishable_UrXT3qOtlgQnVYzBMHplaw_ak3BZegb'

export const supabase = createClient(supabaseUrl, supabaseKey)