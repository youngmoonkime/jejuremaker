
import { createClient } from '@supabase/supabase-js';
import { config } from '../services/config';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

async function checkProjects() {
    // Assuming the user ID from the logs: 301508ba-e928-484f-8617-17f7c96c5d1f
    const userId = '301508ba-e928-484f-8617-17f7c96c5d1f';

    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    console.log(`Found ${data.length} projects.`);
    data.forEach((p, i) => {
        console.log(`[${i}] ID: ${p.id}, Title: ${p.title}`);
        console.log(`    Image URL: ${p.image_url}`);
        console.log(`    Metadata Keys: ${Object.keys(p.metadata || {}).join(', ')}`);
        console.log('---');
    });
}

checkProjects();
