# Fixing CORS Issues for AI Discuss

When hosting AI Discuss on GitHub Pages, you'll encounter CORS (Cross-Origin Resource Sharing) issues when trying to connect to your local Ollama server. Here are the solutions:

## Solution 1: Configure Ollama Server for CORS (Recommended)

### Option A: Docker Container (For Docker Users)

If you're running Ollama in a Docker container, you need to set the environment variable when starting the container.

**Docker Run Command:**
```bash
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -e OLLAMA_ORIGINS="https://*.tremech.us,http://localhost:3000,http://127.0.0.1:3000" \
  -v ollama:/root/.ollama \
  ollama/ollama
```

**Docker Compose (docker-compose.yml):**
```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    container_name: ollama
    ports:
      - "11434:11434"    environment:
      - OLLAMA_ORIGINS=https://*.tremech.us,http://localhost:3000,http://127.0.0.1:3000
    volumes:
      - ollama:/root/.ollama
    restart: unless-stopped

volumes:
  ollama:
```

**Update Existing Container:**
If you already have a running container, you can stop it and restart with the new environment variable:
```bash
# Stop the existing container
docker stop ollama
docker rm ollama

# Start with CORS configuration
docker run -d \
  --name ollama \
  -p 11434:11434 \  -e OLLAMA_ORIGINS="https://*.tremech.us,http://localhost:3000,http://127.0.0.1:3000" \
  -v ollama:/root/.ollama \
  ollama/ollama
```

**Note:** The wildcard `*.tremech.us` allows all subdomains of tremech.us (like ai_discuss.tremech.us, api.tremech.us, etc.)

### Option B: Set Environment Variable (Non-Docker)
Set the `OLLAMA_ORIGINS` environment variable to allow your domain:

**Windows (Command Prompt):**
```cmd
set OLLAMA_ORIGINS=https://ai_discuss.tremech.us,http://localhost:3000
ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="https://ai_discuss.tremech.us,http://localhost:3000"
ollama serve
```

**Linux/Mac:**
```bash
export OLLAMA_ORIGINS="https://ai_discuss.tremech.us,http://localhost:3000"
ollama serve
```

### Option C: Create a systemd service (Linux) or Windows service

**Linux - Create systemd service:**
```bash
sudo nano /etc/systemd/system/ollama.service
```

Add:
```ini
[Unit]
Description=Ollama Server
After=network.target

[Service]
Type=simple
User=your-username
Environment=OLLAMA_ORIGINS=https://ai_discuss.tremech.us,http://localhost:3000
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
```

## Solution 2: Use HTTPS for Ollama (Advanced)

If you want to serve Ollama over HTTPS, you'll need to set up a reverse proxy with SSL certificates.

### Using nginx as reverse proxy:

1. Install nginx and certbot
2. Configure nginx:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:11434;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
          # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://ai_discuss.tremech.us' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

## Solution 3: Add a Proxy Server (Alternative)

Create a simple proxy server that adds CORS headers:

### Node.js Proxy Server:

Create `proxy-server.js`:
```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for your domain
app.use(cors({
    origin: ['https://ai_discuss.tremech.us', 'http://localhost:3000'],
    credentials: true
}));

// Proxy to Ollama
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:11434',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api'
    }
}));

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
```

Then update your app to use `http://localhost:3001` instead of `http://localhost:11434`.

## Network Configuration for Local Servers

If your Ollama server is running on a different machine in your local network, you'll need to:

### 1. Find Your Server's Local IP Address

**Linux/Mac (on the server):**
```bash
ip addr show | grep inet
# or
hostname -I
```

**Windows (on the server):**
```cmd
ipconfig | findstr IPv4
```

### 2. Update Your Docker Configuration

Use your server's local IP address instead of localhost:

```bash
docker run -d \
  --name ollama \
  -p 0.0.0.0:11434:11434 \
  -e OLLAMA_ORIGINS="https://*.tremech.us,http://localhost:3000,http://127.0.0.1:3000,http://YOUR_SERVER_IP:3000" \
  -v ollama:/root/.ollama \
  ollama/ollama
```

**Replace `YOUR_SERVER_IP` with your actual server IP (e.g., 192.168.1.100)**

### 3. Update AI Discuss Configuration

In the AI Discuss app, set the Ollama Server URL to:
```
http://YOUR_SERVER_IP:11434
```

### 4. Firewall Considerations

Make sure port 11434 is open on your server:

**Linux (ufw):**
```bash
sudo ufw allow 11434
```

**Linux (iptables):**
```bash
sudo iptables -A INPUT -p tcp --dport 11434 -j ACCEPT
```

**Windows:**
- Open Windows Defender Firewall
- Create new inbound rule for port 11434

### 5. Router Configuration (If Accessing from Outside Network)

If you want to access from outside your home network:
1. Set up port forwarding on your router (port 11434)
2. Use your public IP address or dynamic DNS
3. Consider security implications of exposing the service

## Updating the Application

After setting up CORS on the Ollama server, you may want to update the default server URL in your application to include HTTPS options or your custom domain.

The current default is `http://localhost:11434`, but you might want to add a dropdown or better default for production use.
