#!/usr/bin/env node

/**
 * Setup Admin User Script
 * 
 * This script helps you promote a user to admin role in your Supabase database.
 * Run this script after you've created a user account in your app.
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.log('Please set the following environment variables:')
  console.log('- SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  console.log('\nYou can find these in your Supabase project dashboard under Settings > API')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promoteToAdmin(email) {
  try {
    console.log(`\n🔄 Promoting user ${email} to admin role...`)
    
    // First, check if the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single()
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.error(`❌ User with email ${email} not found in the users table`)
        console.log('Make sure the user has signed up and logged in at least once')
        return false
      }
      throw userError
    }
    
    console.log(`✅ Found user: ${user.email} (current role: ${user.role})`)
    
    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin')
      return true
    }
    
    // Update the user's role to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
    
    if (updateError) {
      throw updateError
    }
    
    console.log('✅ Successfully promoted user to admin role!')
    console.log('\n🎉 You can now use the Admin Dashboard to manage policies')
    return true
    
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Supabase Admin User Setup')
  console.log('============================\n')
  
  console.log('This script will promote a user to admin role so they can manage policies.')
  console.log('Make sure the user has already signed up and logged in at least once.\n')
  
  rl.question('Enter the email address of the user to promote to admin: ', async (email) => {
    if (!email || !email.includes('@')) {
      console.error('❌ Please enter a valid email address')
      rl.close()
      return
    }
    
    const success = await promoteToAdmin(email.trim())
    
    if (success) {
      console.log('\n📝 Next steps:')
      console.log('1. Log in to your app with the admin user')
      console.log('2. Go to the Admin Dashboard')
      console.log('3. You should now be able to edit policies')
    }
    
    rl.close()
  })
}

main().catch(console.error) 