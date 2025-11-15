#!/bin/bash
# Script untuk menjalankan server Firemoo CDN di port 6000

PORT=5000

echo "🔥 Menjalankan Firemoo CDN Server..."
echo "📍 Port: $PORT"
echo ""

# Cek apakah Python tersedia
if command -v python3 &> /dev/null; then
    echo "✅ Menggunakan Python HTTP Server"
    python3 server.py
# Cek apakah Node.js tersedia
elif command -v node &> /dev/null; then
    echo "✅ Menggunakan Node.js serve"
    npx --yes serve -p $PORT
# Cek apakah PHP tersedia
elif command -v php &> /dev/null; then
    echo "✅ Menggunakan PHP Built-in Server"
    php -S localhost:$PORT
else
    echo "❌ Error: Python3, Node.js, atau PHP tidak ditemukan"
    echo "Silakan install salah satu dari:"
    echo "  - Python 3: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    echo "  - PHP: https://www.php.net/downloads"
    exit 1
fi

