# Policy Management Fix

## Problem
The policy management system in the Admin UI was not working - changes to policies were not being saved to the database.

## Root Cause
The issue was caused by missing Row Level Security (RLS) policies for the `connection_policies` table. The table had RLS enabled but only had a SELECT policy, which meant:

1. Users could read policies ✅
2. Users could NOT update policies ❌ (missing UPDATE policy)
3. Users could NOT insert new policies ❌ (missing INSERT policy)
4. Users could NOT delete policies ❌ (missing DELETE policy)

Additionally, the RLS policies required users to have the `admin` role, but there was no mechanism to promote users to admin role.

## Solution

### 1. Added Missing RLS Policies
Created migration `20250103000001_add_connection_policies_update_policy.sql`:
- Added UPDATE policy for admin users
- Added INSERT policy for admin users  
- Added DELETE policy for admin users

### 2. Added Admin User Management
Created migration `20250103000002_add_admin_user_setup.sql`:
- Added `promote_to_admin()` function to promote users to admin role
- Added `is_admin()` function to check admin status
- Added `get_current_user_role()` function to get user role
- Added policies to allow users to view their own role

### 3. Enhanced Admin UI
Updated `AdminView.jsx`:
- Added role and admin status checking
- Added debug information showing current user role
- Added better error messages when admin privileges are missing
- Added instructions for promoting users to admin

### 4. Created Admin Setup Script
Created `setup-admin.js`:
- Interactive script to promote users to admin role
- Uses Supabase service role key to bypass RLS
- Provides clear instructions and error handling

## How to Use

### For New Users
1. Sign up and log in to the app
2. Run the admin setup script:
   ```bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   node setup-admin.js
   ```
3. Enter your email address when prompted
4. Log out and log back in
5. Access the Admin Dashboard - you should now be able to edit policies

### For Existing Users
If you already have a user account:
1. Run the admin setup script as above, or
2. Manually update your role in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

## Verification
After the fix, you should see:
1. **Debug Info** in the Admin Dashboard showing your role and admin status
2. **Success messages** when saving policies
3. **No more "Admin privileges required" errors**

## Files Changed
- `supabase/migrations/20250103000001_add_connection_policies_update_policy.sql` (new)
- `supabase/migrations/20250103000002_add_admin_user_setup.sql` (new)
- `src/components/AdminView.jsx` (updated)
- `setup-admin.js` (new)
- `README.md` (updated with admin setup instructions)
- `POLICY_FIX.md` (this file)

## Testing
To test the fix:
1. Set up an admin user using the setup script
2. Go to Admin Dashboard → Policies tab
3. Try changing connection duration or allowed apps
4. Verify you see "Policy auto-saved to Supabase!" success message
5. Check the database to confirm changes were saved 