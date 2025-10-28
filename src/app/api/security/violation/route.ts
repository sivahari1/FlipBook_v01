import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      documentId, 
      userEmail, 
      violation,
      type,
      details,
      severity,
      timestamp,
      userAgent,
      url,
      sessionId,
      detectionMethod,
      confidence
    } = body

    // Support both old and new violation formats
    const violationData = violation || {
      type,
      details,
      severity,
      timestamp,
      userAgent,
      url,
      detectionMethod,
      confidence
    }

    // Enhanced logging for security violations
    const logData = {
      documentId,
      userEmail,
      sessionId,
      ip: request.ip || 'unknown',
      violation: violationData
    }

    console.warn('🚨 Security Violation Detected:', logData)

    // Special handling for developer tools violations
    if (violationData.type === 'devtools_opened') {
      console.error('🛠️ CRITICAL: Developer Tools Detected', {
        method: violationData.detectionMethod || 'unknown',
        confidence: violationData.confidence ? `${Math.round(violationData.confidence * 100)}%` : 'unknown',
        url: violationData.url,
        timestamp: violationData.timestamp,
        userAgent: violationData.userAgent?.substring(0, 100) + '...',
        documentId,
        userEmail
      })

      // In a production environment for dev tools violations, you might:
      // 1. Immediately revoke the user's document access session
      // 2. Send real-time alerts to document owners
      // 3. Temporarily block the user's IP for repeated violations
      // 4. Require additional authentication to continue
      // 5. Log to security monitoring systems (SIEM)
      // 6. Generate incident reports for compliance
    }

    // Handle other critical violations
    if (violationData.severity === 'critical') {
      console.error('🚨 CRITICAL Security Violation:', {
        type: violationData.type,
        details: violationData.details,
        documentId,
        userEmail,
        timestamp: violationData.timestamp
      })
    }

    // In a production environment, you would:
    // 1. Store this in a security log database with full details
    // 2. Send alerts for high-severity violations via email/Slack/SMS
    // 3. Implement rate limiting or blocking for repeated violations
    // 4. Generate security reports and dashboards
    // 5. Integrate with SIEM systems
    // 6. Track violation patterns and trends
    // 7. Implement automated response actions

    return NextResponse.json({
      success: true,
      message: 'Security violation logged successfully',
      violationId: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: violationData.severity,
      actionTaken: violationData.severity === 'critical' ? 'immediate_alert' : 'logged'
    })

  } catch (error) {
    console.error('Failed to log security violation:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to log security violation'
    }, { status: 500 })
  }
}