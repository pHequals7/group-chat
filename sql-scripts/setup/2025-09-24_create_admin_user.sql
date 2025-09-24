-- Create admin user in auth.users table
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    encrypted_password,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'admin@email.com',
    NOW(),
    NOW(),
    NOW(),
    crypt('admin123', gen_salt('bf')),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
);

-- Update existing messages to belong to the admin user
UPDATE public.messages
SET user_id = (
    SELECT id FROM auth.users WHERE email = 'admin@email.com'
);