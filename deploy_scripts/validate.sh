#!/usr/bin/env bash
sleep 10
sudo yum install -y nc
nc -zv 127.0.0.1 5000