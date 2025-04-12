#!/bin/bash
cd /home/ec2-user/node
npm install
pm2 stop all || true
pm2 delete all || true
pm2 start server.js --name my-app
pm2 save
pm2 startup
exit 0