#!/bin/bash

echo "Starting Secure (Fail-Closed) Demo server..."
bun index_fail_open_fixed.ts &
SERVER_PID=$!
sleep 2

echo -e "
1. Normal Alice (ID=1) - Expected result: 403 Forbidden"
curl -s -i "http://localhost:3001/admin/dashboard?id=1" | grep -E "HTTP/|error"

echo -e "
2. Admin Bob (ID=2) - Expected result: 200 OK"
curl -s -i "http://localhost:3001/admin/dashboard?id=2" | grep -E "HTTP/|message"

echo -e "
3. EXPLOIT Attempt: Triggering an error with SQL injection:"
# With parameterized queries, this will either just return no rows (403) or
# handle internal errors securely (500). Either way, access is NOT granted.
curl -s -i "http://localhost:3001/admin/dashboard?id=1%20OR%20(SELECT%201%20FROM%20non_existent_table)" | grep -E "HTTP/|error|message"

echo -e "
Stopping server..."
kill $SERVER_PID
