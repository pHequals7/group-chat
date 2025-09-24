const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Use service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createAdminUser() {
  try {
    console.log('Creating admin user with service role key...')

    // First check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingAdmin = existingUsers.users.find(user => user.email === 'admin@email.com')

    if (existingAdmin) {
      console.log('Admin user already exists, updating password...')
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
        {
          password: 'admin123'
        }
      )

      if (error) {
        console.error('Error updating admin password:', error)
      } else {
        console.log('Admin password updated successfully')

        // Update messages to belong to this user
        const { error: updateError } = await supabase
          .from('messages')
          .update({ user_id: existingAdmin.id })
          .is('user_id', null)

        if (updateError) {
          console.error('Error updating messages:', updateError)
        } else {
          console.log('Messages updated to belong to admin user')
        }
      }
    } else {
      console.log('Creating new admin user...')
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'admin@email.com',
        password: 'admin123',
        email_confirm: true
      })

      if (error) {
        console.error('Error creating admin user:', error)
      } else {
        console.log('Admin user created successfully:', data.user.id)

        // Update messages to belong to this user
        const { error: updateError } = await supabase
          .from('messages')
          .update({ user_id: data.user.id })
          .is('user_id', null)

        if (updateError) {
          console.error('Error updating messages:', updateError)
        } else {
          console.log('Messages updated to belong to admin user')
        }
      }
    }

    console.log('Admin user setup completed!')
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createAdminUser()