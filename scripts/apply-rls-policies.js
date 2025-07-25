#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Service Role Key:', serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🚀 Applying RLS policies for image deletion fix...');

const policies = [
  // DELETE policy for code_images
  {
    name: 'Users can delete images for their own codes',
    table: 'code_images',
    sql: `
      CREATE POLICY "Users can delete images for their own codes" ON code_images
        FOR DELETE USING (
          auth.uid() IN (
            SELECT user_id FROM sref_codes WHERE id = code_id
          )
        );
    `,
  },
  // UPDATE policy for code_images
  {
    name: 'Users can update images for their own codes',
    table: 'code_images',
    sql: `
      CREATE POLICY "Users can update images for their own codes" ON code_images
        FOR UPDATE USING (
          auth.uid() IN (
            SELECT user_id FROM sref_codes WHERE id = code_id
          )
        );
    `,
  },
  // DELETE policy for code_tags
  {
    name: 'Users can delete tags for their own codes',
    table: 'code_tags',
    sql: `
      CREATE POLICY "Users can delete tags for their own codes" ON code_tags
        FOR DELETE USING (
          auth.uid() IN (
            SELECT user_id FROM sref_codes WHERE id = code_id
          )
        );
    `,
  },
  // UPDATE policy for code_tags
  {
    name: 'Users can update tags for their own codes',
    table: 'code_tags',
    sql: `
      CREATE POLICY "Users can update tags for their own codes" ON code_tags
        FOR UPDATE USING (
          auth.uid() IN (
            SELECT user_id FROM sref_codes WHERE id = code_id
          )
        );
    `,
  },
];

async function applyPolicies() {
  console.log(`📋 Applying ${policies.length} RLS policies...`);

  for (const policy of policies) {
    try {
      console.log(`   Applying: ${policy.name}`);

      // Use direct SQL execution instead of rpc
      const { data, error } = await supabase.from('_supabase_admin').select('*').limit(0); // We don't care about data, just testing connection

      // If that doesn't work, try raw query approach
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          statement: policy.sql.trim(),
        }),
      });

      if (response.ok) {
        console.log(`   ✅ Successfully applied: ${policy.name}`);
      } else {
        const errorText = await response.text();
        if (errorText.includes('already exists')) {
          console.log(`   ⚠️  Policy already exists: ${policy.name}`);
        } else {
          console.error(`   ❌ Failed to apply policy: ${policy.name}`);
          console.error(`   Error: ${errorText}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Exception applying policy: ${policy.name}`);
      console.error(`   Error: ${err.message}`);
    }
  }
}

async function verifyPolicies() {
  console.log('\n🔍 Verifying applied policies...');

  try {
    const { data, error } = await supabase.rpc('exec', {
      statement: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd
        FROM pg_policies 
        WHERE tablename IN ('code_images', 'code_tags') 
        AND policyname LIKE '%delete%' OR policyname LIKE '%update%'
        ORDER BY tablename, policyname;
      `,
    });

    if (error) {
      console.error('❌ Error verifying policies:', error.message);
    } else {
      console.log('✅ Policies verification complete');
      console.log('Applied policies:', data?.length || 0);
    }
  } catch (err) {
    console.error('❌ Exception verifying policies:', err.message);
  }
}

async function main() {
  try {
    await applyPolicies();
    await verifyPolicies();
    console.log('\n🎉 RLS policy application complete!');
    console.log('👉 Next: Test image deletion to see if delete operations work now');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();
