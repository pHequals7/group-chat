require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function runMigration() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('🔗 Connecting to Supabase...');

        // Read the SQL migration file
        const sql = fs.readFileSync('../add_metadata_column.sql', 'utf8');
        console.log('📖 SQL Migration:');
        console.log(sql);

        // Execute the migration
        console.log('⚡ Executing migration...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: sql });

        if (error) {
            console.error('❌ Migration failed:', error);

            // Try alternative approach using individual statements
            console.log('🔄 Trying alternative approach...');

            // Add metadata column
            const { error: alterError } = await supabase
                .from('messages')
                .select('*')
                .limit(1);

            if (alterError) {
                console.error('❌ Cannot access messages table:', alterError);
                return;
            }

            console.log('✅ Messages table is accessible. You need to add the metadata column manually:');
            console.log('Go to Supabase Dashboard → Table Editor → messages → Add Column');
            console.log('Column name: metadata');
            console.log('Type: jsonb');
            console.log('Default value: {}');

        } else {
            console.log('✅ Migration completed successfully!', data);
        }

    } catch (error) {
        console.error('💥 Error:', error.message);
        console.log('\n📋 Manual steps:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Run this SQL:');
        console.log('ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\';');
    }
}

runMigration();