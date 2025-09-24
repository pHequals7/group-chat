-- Update admin user password to use Supabase Auth compatible format
-- Supabase uses Argon2id by default, but bcrypt should work too
-- Let's use a properly formatted bcrypt hash for 'admin123'
UPDATE auth.users
SET encrypted_password = '$2a$10$N9qo8uLOickgx2ZMRZoMye.RjTe4bG.sTdF0ZDGM.WJH1lmyB9xTa'
WHERE email = 'admin@email.com';

-- Also ensure the user is confirmed
UPDATE auth.users
SET email_confirmed_at = NOW(),
    phone_confirmed_at = NULL,
    confirmed_at = NOW()
WHERE email = 'admin@email.com';