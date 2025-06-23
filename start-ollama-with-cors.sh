#!/bin/bash

echo "Starting Ollama server with CORS enabled for AI Discuss..."
echo ""
echo "This will allow AI Discuss hosted at https://aidiscuss.tremech.us to connect to your local Ollama server."
echo ""

# Set the OLLAMA_ORIGINS environment variable to allow the hosted site and all tremech.us subdomains
export OLLAMA_ORIGINS="https://*.tremech.us,http://localhost:3000,http://127.0.0.1:3000"

echo "CORS origins set to: $OLLAMA_ORIGINS"
echo ""
echo "Starting Ollama server..."
echo "Press Ctrl+C to stop the server when done."
echo ""

ollama serve
