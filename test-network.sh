#!/bin/bash

echo "🔧 ECTUS Network Connectivity Test"
echo "=================================="

# Test if server is running
echo "📡 Testing server process..."
SERVER_PID=$(lsof -ti:4000)
if [ -n "$SERVER_PID" ]; then
    echo "✅ Server is running (PID: $SERVER_PID)"
else
    echo "❌ Server is not running on port 4000"
    exit 1
fi

# Get current IP
CURRENT_IP=$(ifconfig en0 | grep "inet " | awk '{print $2}')
echo "🌐 Current IP: $CURRENT_IP"

# Test local endpoints
echo ""
echo "🧪 Testing endpoints..."

# Test localhost
echo "Testing localhost:4000..."
if curl -s -m 3 "http://localhost:4000/api/system/health" > /dev/null; then
    echo "✅ localhost:4000 - WORKING"
else
    echo "❌ localhost:4000 - FAILED"
fi

# Test network IP
echo "Testing $CURRENT_IP:4000..."
if curl -s -m 3 "http://$CURRENT_IP:4000/api/system/health" > /dev/null; then
    echo "✅ $CURRENT_IP:4000 - WORKING"
else
    echo "❌ $CURRENT_IP:4000 - FAILED"
fi

# Test GraphQL endpoints
echo ""
echo "🔍 Testing GraphQL endpoints..."

# Test localhost GraphQL
echo "Testing localhost:4000/graphql..."
if curl -s -m 3 -X POST "http://localhost:4000/graphql" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' | grep -q "__typename"; then
    echo "✅ localhost:4000/graphql - WORKING"
else
    echo "❌ localhost:4000/graphql - FAILED"
fi

# Test network IP GraphQL
echo "Testing $CURRENT_IP:4000/graphql..."
if curl -s -m 3 -X POST "http://$CURRENT_IP:4000/graphql" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' | grep -q "__typename"; then
    echo "✅ $CURRENT_IP:4000/graphql - WORKING"
else
    echo "❌ $CURRENT_IP:4000/graphql - FAILED"
fi

# Check firewall status
echo ""
echo "🔥 Firewall status:"
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Test from different subnet (simulate mobile device)
echo ""
echo "🌍 Network interface information:"
echo "Available network interfaces:"
ifconfig | grep -E "inet.*broadcast" | awk '{print $2 " (interface: " $NF ")"}'

echo ""
echo "📱 For mobile device troubleshooting:"
echo "1. If using iOS Simulator: Use http://localhost:4000/graphql"
echo "2. If using physical device: Use http://$CURRENT_IP:4000/graphql"
echo "3. Ensure mobile device is on same Wi-Fi network"
echo "4. Try accessing http://$CURRENT_IP:4000 in mobile Safari"