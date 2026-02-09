#!/bin/bash

# ECTUS Mobile App - Firewall & Network Fix Script
echo "🔧 ECTUS Mobile App Network Fix"
echo "================================"

# Get current Node.js path
NODE_PATH=$(which node)
echo "📍 Current Node.js: $NODE_PATH"

# Check firewall status
FIREWALL_STATUS=$(sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate)
echo "🔥 Firewall Status: $FIREWALL_STATUS"

# Add Node.js to firewall if needed
echo "✅ Adding Node.js to firewall..."
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "$NODE_PATH" >/dev/null 2>&1
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock "$NODE_PATH" >/dev/null 2>&1

# Get current IP
CURRENT_IP=$(ifconfig en0 | grep "inet " | awk '{print $2}')
echo "🌐 Current IP: $CURRENT_IP"

# Test GraphQL endpoint
echo "🧪 Testing GraphQL endpoint..."
GRAPHQL_RESPONSE=$(curl -s -X POST "http://$CURRENT_IP:4000/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' \
  --max-time 5 \
  --connect-timeout 3)

if echo "$GRAPHQL_RESPONSE" | grep -q "__typename"; then
    echo "✅ GraphQL endpoint is working!"
    echo "Response: $GRAPHQL_RESPONSE"
else
    echo "❌ GraphQL endpoint failed!"
    echo "Response: $GRAPHQL_RESPONSE"
fi

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "http://$CURRENT_IP:4000/api/system/health" \
  --max-time 5 \
  --connect-timeout 3)

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ Health endpoint is working!"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "❌ Health endpoint failed!"
    echo "Response: $HEALTH_RESPONSE"
fi

echo ""
echo "🔧 If the endpoints are working but your mobile app still can't connect:"
echo "   1. Make sure your phone is on the same Wi-Fi network"
echo "   2. Try restarting the Expo app on your phone"
echo "   3. Clear the app cache/data if needed"
echo ""
echo "📱 Your mobile app should connect to: http://$CURRENT_IP:4000/graphql"