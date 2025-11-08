import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log('🔧 Running Prisma migrations...')
    
    // Run prisma db push to sync the schema with the database
    const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate')
    
    console.log('✅ Migration output:', stdout)
    if (stderr) {
      console.warn('⚠️ Migration warnings:', stderr)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database migrations completed successfully',
      output: stdout
    })
    
  } catch (error: any) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to run migrations',
      details: error.message,
      stderr: error.stderr
    }, { status: 500 })
  }
}
