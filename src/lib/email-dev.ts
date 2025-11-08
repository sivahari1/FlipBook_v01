// Development email utility
// In production, replace this with a real email service like Resend, SendGrid, etc.

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  // For development, we'll just log the email content
  console.log('='.repeat(60))
  console.log('📧 PASSWORD RESET EMAIL (Development Mode)')
  console.log('='.repeat(60))
  console.log(`To: ${email}`)
  console.log(`Subject: Reset your FlipBook DRM password`)
  console.log('')
  console.log('Email Content:')
  console.log('─'.repeat(40))
  console.log(`Hi there,`)
  console.log('')
  console.log(`You requested to reset your password for FlipBook DRM.`)
  console.log('')
  console.log(`Click the link below to reset your password:`)
  console.log(`${resetUrl}`)
  console.log('')
  console.log(`This link will expire in 1 hour.`)
  console.log('')
  console.log(`If you didn't request this, please ignore this email.`)
  console.log('')
  console.log(`Best regards,`)
  console.log(`FlipBook DRM Team`)
  console.log('─'.repeat(40))
  console.log('='.repeat(60))
  
  // In production, you would send the actual email here:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     from: 'noreply@flipbook-drm.com',
  //     to: email,
  //     subject: 'Reset your FlipBook DRM password',
  //     html: `
  //       <h2>Reset your password</h2>
  //       <p>You requested to reset your password for FlipBook DRM.</p>
  //       <p><a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
  //       <p>This link will expire in 1 hour.</p>
  //       <p>If you didn't request this, please ignore this email.</p>
  //     `
  //   })
  // })
  
  return { success: true }
}