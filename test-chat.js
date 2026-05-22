const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, store_id, customer_id,
      stores ( store_name, logo_url ),
      messages ( message, created_at, is_read, sender_id )
    `)
    .limit(1);
    
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
