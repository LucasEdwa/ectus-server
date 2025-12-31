✅ COMPLETED - Created universal network configuration and fixed Apollo authentication issues

Network issue resolved:
- Added token management with expiration handling
- Implemented better error handling in Apollo client
- Added authentication error detection and token cleanup
- Improved shift stop functionality with proper error messages

For production deployment, create .env file with:
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
GRAPHQL_ENDPOINT=http://${NETWORK_IP}:4000/graphql


!! Fix date format on database so i dont need to translate every time when i manage shifts or anything relativo to date in 
"break_start": "1767135555000" make real time emission from db.