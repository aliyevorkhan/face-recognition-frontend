#!/bin/bash

npm install --legacy-peer-deps
npm run build
PORT=5175 npm run start