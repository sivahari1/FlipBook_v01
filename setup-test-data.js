const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data...')
    
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const user = await prisma.user.upsert({
      where: { email: 'sivaramj83@gmail.com' },
      update: {},
      create: {
        email: 'sivaramj83@gmail.com',
        passwordHash: hashedPassword,
        role: 'CREATOR',
        emailVerified: true
      }
    })
    
    console.log('✅ User created:', user.email)
    
    // Create test document
    const document = await prisma.document.upsert({
      where: { id: 'simple-1761410017220-pkyf04639' },
      update: {},
      create: {
        id: 'simple-1761410017220-pkyf04639',
        ownerId: user.id,
        title: 'Test Document',
        description: 'A test document for viewing',
        pageCount: 5,
        storageKey: 'simple-1761410017220-pkyf04639.pdf',
        drmOptions: JSON.stringify({
          watermark: true,
          preventCopy: true,
          preventPrint: true
        })
      }
    })
    
    console.log('✅ Document created:', document.title)
    
    console.log('🎉 Test data setup complete!')
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupTestData()