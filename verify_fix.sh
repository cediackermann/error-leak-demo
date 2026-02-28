#!/bin/bash

echo "Starting secure server..."
bun index_fixed.ts &
SERVER_PID=$!
sleep 2

echo -e "\n1. Attempting SQL injection (ORDER BY):"
# Full URL as one string. Even with a malicious payload, the server handles it safely.
curl -s "http://localhost:3000/users/search?username=admin'%20ORDER%20BY%2010%20--" | json_pp

echo -e "\n2. Attempting SQL injection (UNION SELECT):"
curl -s "http://localhost:3000/users/search?username=admin'%20UNION%20SELECT%201,2,3,4,5%20--" | json_pp

echo -e "\n3. Attempting command injection (Stacked queries):"
# Explaining why "admin'; DROP TABLE users" doesn't work in parameterized queries.
curl -s "http://localhost:3000/users/search?username=admin';%20DROP%20TABLE%20users%20--" | json_pp

echo -e "\nStopping server..."
kill $SERVER_PID
