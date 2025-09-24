# Admin User Setup Instructions

Since we don't have the service role key, we'll create the admin user through the normal signup process:

## Option 1: Create through Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `rrdlkjmysynyepfxxhrg`
3. Go to Authentication → Users
4. Click "Add user"
5. Fill in:
   - Email: `admin@email.com`
   - Password: `admin123`
   - Check "Auto confirm user"
6. Click "Create user"
7. Copy the User ID that appears

## Option 2: Create through our app signup

1. Start the development servers:
   ```bash
   npm run dev
   ```
2. Go to http://localhost:5173
3. Click "Sign up"
4. Enter:
   - Email: `admin@email.com`
   - Password: `admin123`
5. Complete the signup process

## After Creating the Admin User

Once you have created the admin user and obtained their UUID, run this SQL in the Supabase SQL Editor to update existing messages:

```sql
-- Replace 'YOUR_ADMIN_USER_UUID_HERE' with the actual UUID from step 7 above
UPDATE messages
SET user_id = 'YOUR_ADMIN_USER_UUID_HERE'
WHERE user_id IS NULL;

UPDATE conversations
SET created_by = 'YOUR_ADMIN_USER_UUID_HERE'
WHERE created_by IS NULL;

-- Make user_id required now that we have data
ALTER TABLE messages
ALTER COLUMN user_id SET NOT NULL;
```

## Test the Authentication

1. Login with admin@email.com / admin123
2. You should see all your existing conversations and messages
3. Try creating a new conversation
4. Test the logout functionality