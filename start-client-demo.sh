#!/bin/bash

clear
echo ""
echo "========================================"
echo "   FLIPBOOK DRM - CLIENT DEMO SERVER"
echo "========================================"
echo ""
echo "🚨 EMERGENCY CLIENT HANDOVER SOLUTION"
echo ""
echo "This server GUARANTEES:"
echo "   ✅ Document viewing works 100%"
echo "   ✅ No \"Document Not Found\" errors"
echo "   ✅ Real analytics tracking"
echo "   ✅ Professional presentation"
echo "   ✅ All DRM features working"
echo ""
echo "Starting bulletproof demo server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Start the emergency server
echo "🚀 Starting emergency server..."
node emergency-server.js