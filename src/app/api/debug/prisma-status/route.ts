import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: [] as any[]
  }

  try {
    // Check 1: DATABASE_URL exists
    diagnostics.checks.push({
      name: 'DATABASE_URL Environment Variable',
      status: process.env.DATABASE_URL ? 'PASS' : 'FAIL',
      value: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
      message: process.env.DATABASE_URL 
        ? 'DATABASE_URL is configured' 
        : 'DATABASE_URL is missing - add it in Vercel environment variables'
    })

    // Check 2: Try to import Prisma Client
    try {
      const { PrismaClient } = await import('@prisma/client')
      diagnostics.checks.push({
        name: 'Prisma Client Import',
        status: 'PASS',
        message: 'Prisma Client can be imported successfully'
      })

      // Check 3: Try to instantiate Prisma Client
      try {
        const prisma = new PrismaClient()
        diagnostics.checks.push({
          name: 'Prisma Client Instantiation',
          status: 'PASS',
          message: 'Prisma Client instantiated successfully'
        })

        // Check 4: Try to connect
        try {
          await prisma.$connect()
          diagnostics.checks.push({
            name: 'Database Connection',
            status: 'PASS',
            message: 'Successfully connected to database'
          })

          // Check 5: Try to query
          try {
            const userCount = await prisma.user.count()
            diagnostics.checks.push({
              name: 'Database Query',
              status: 'PASS',
              message: `Successfully queried database - ${userCount} users found`
            })
          } catch (queryError: any) {
            diagnostics.checks.push({
              name: 'Database Query',
              status: 'FAIL',
              message: queryError.message,
              code: queryError.code,
              hint: queryError.code === 'P2021' 
                ? 'Tables do not exist - run migrations' 
                : 'Query failed'
            })
          }

          await prisma.$disconnect()
        } catch (connectError: any) {
          diagnostics.checks.push({
            name: 'Database Connection',
            status: 'FAIL',
            message: connectError.message,
            code: connectError.code,
            hint: 'Cannot connect to database - check DATABASE_URL'
          })
        }
      } catch (instantiateError: any) {
        diagnostics.checks.push({
          name: 'Prisma Client Instantiation',
          status: 'FAIL',
          message: instantiateError.message,
          hint: 'Prisma Client cannot be instantiated - check schema'
        })
      }
    } catch (importError: any) {
      diagnostics.checks.push({
        name: 'Prisma Client Import',
        status: 'FAIL',
        message: importError.message,
        hint: 'Prisma Client not generated - run: prisma generate'
      })
    }

    // Check 6: Prisma schema file location
    try {
      const fs = await import('fs')
      const path = await import('path')
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
      const schemaExists = fs.existsSync(schemaPath)
      
      diagnostics.checks.push({
        name: 'Prisma Schema File',
        status: schemaExists ? 'PASS' : 'FAIL',
        path: schemaPath,
        message: schemaExists 
          ? 'Schema file found' 
          : 'Schema file not found at expected location'
      })
    } catch (fsError: any) {
      diagnostics.checks.push({
        name: 'Prisma Schema File',
        status: 'UNKNOWN',
        message: 'Could not check file system'
      })
    }

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      diagnostics
    }, { status: 500 })
  }
}
