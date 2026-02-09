#!/bin/bash

echo "Installing Laravel Echo and Pusher.js dependencies..."
npm install --save laravel-echo pusher-js

echo "Dependencies installed successfully!"
echo ""
echo "Note: You'll also need to install Laravel Reverb on the backend:"
echo "  composer require laravel/reverb"
echo ""
echo "Then run:"
echo "  php artisan install:broadcasting"
