#!/bin/bash
cd /home/ec2-user/node
sudo npm install
sudo pm2 stop all || true
sudo pm2 delete all || true
sudo pm2 start server.js --name my-app
sudo pm2 save
sudo pm2 startup
exit 0