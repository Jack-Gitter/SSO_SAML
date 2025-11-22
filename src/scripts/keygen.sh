#!/bin/bash

KEY=$(openssl genrsa 2048 2>/dev/null)
echo "$KEY"
echo "$KEY" | openssl req -new -key /dev/stdin -subj "/C=US/ST=CA/L=SF/O=Org/CN=localhost" 2>/dev/null | \
openssl x509 -req -days 365 -signkey <(echo "$KEY") 2>/dev/null
