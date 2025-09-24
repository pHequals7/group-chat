require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMetadata() {
    console.log('🔍 Testing metadata column...');

    try {
        // Try to query recent messages with metadata column
        const { data, error } = await supabase
            .from('messages')
            .select('id, content, metadata, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('❌ Error querying metadata column:', error);
            if (error.message.includes('column "metadata" does not exist')) {
                console.log('🚫 Metadata column was NOT created successfully');
            }
        } else {
            console.log('✅ Metadata column exists! Recent messages:');
            data.forEach(msg => {
                console.log(`  - Message: ${msg.content.substring(0, 40)}...`);
                console.log(`    Metadata: ${JSON.stringify(msg.metadata)}`);
                console.log(`    Created: ${msg.created_at}`);
                console.log('');
            });
        }
    } catch (e) {
        console.error('💥 Exception:', e.message);
    }
}

testMetadata();