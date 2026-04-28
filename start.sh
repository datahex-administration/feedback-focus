#!/bin/sh
set -e

# Force Express API to use port 3001 (Cloud Run sets PORT=8080 for nginx)
cd /app/server
PORT=3001 node index.js &

# Give it a moment, then start nginx
sleep 1
exec nginx -g "daemon off;"
