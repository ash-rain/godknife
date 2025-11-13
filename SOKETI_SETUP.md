# Soketi Setup Guide

This project uses [Soketi](https://docs.soketi.app/) as a self-hosted alternative to Pusher for real-time WebSocket communication.

## What is Soketi?

Soketi is an open-source, fast, and resilient WebSocket server built with Node.js. It's fully compatible with the Pusher Protocol v7, meaning you can use the existing Pusher client libraries without any modifications.

## Benefits over Pusher

- ✅ **Self-hosted**: No external dependencies or monthly fees
- ✅ **100% Pusher compatible**: Drop-in replacement
- ✅ **Open source**: Full control over your real-time infrastructure
- ✅ **Fast**: Built on µWebSockets for maximum performance
- ✅ **Docker-ready**: Easy deployment with Docker Compose

## Configuration

### 1. Docker Setup

Soketi is already configured in `docker-compose.yml`:

```yaml
soketi:
  image: quay.io/soketi/soketi:latest-16-alpine
  ports:
    - "6001:6001"  # WebSocket connections
    - "9601:9601"  # Metrics endpoint
  environment:
    SOKETI_DEFAULT_APP_ID: "godknife-app"
    SOKETI_DEFAULT_APP_KEY: "godknife-key"
    SOKETI_DEFAULT_APP_SECRET: "godknife-secret"
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Server-side configuration
PUSHER_APP_ID="godknife-app"
PUSHER_KEY="godknife-key"
PUSHER_SECRET="godknife-secret"
PUSHER_HOST="localhost"
PUSHER_PORT="6001"
PUSHER_USE_TLS="false"

# Client-side configuration
NEXT_PUBLIC_PUSHER_KEY="godknife-key"
NEXT_PUBLIC_PUSHER_HOST="localhost"
NEXT_PUBLIC_PUSHER_PORT="6001"
NEXT_PUBLIC_PUSHER_USE_TLS="false"
```

### 3. Production Configuration

For production deployment:

1. **Change credentials**: Update `PUSHER_KEY` and `PUSHER_SECRET` to secure random values
2. **Enable TLS**: Set `PUSHER_USE_TLS="true"` and configure SSL certificates
3. **Use domain**: Set `PUSHER_HOST` to your domain (e.g., `ws.yourdomain.com`)
4. **Configure firewall**: Ensure port 6001 is accessible

Example production config:

```bash
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-secure-random-key"
PUSHER_SECRET="your-secure-random-secret"
PUSHER_HOST="ws.yourdomain.com"
PUSHER_PORT="443"
PUSHER_USE_TLS="true"

NEXT_PUBLIC_PUSHER_KEY="your-secure-random-key"
NEXT_PUBLIC_PUSHER_HOST="ws.yourdomain.com"
NEXT_PUBLIC_PUSHER_PORT="443"
NEXT_PUBLIC_PUSHER_USE_TLS="true"
```

## Starting Soketi

### Using Docker Compose (Recommended)

```bash
# Start all services including Soketi
docker-compose up -d

# View Soketi logs
docker-compose logs -f soketi

# Stop all services
docker-compose down
```

### Standalone (without Docker)

```bash
# Install Soketi globally
npm install -g @soketi/soketi

# Run with environment variables
soketi start \
  --port=6001 \
  --metrics.enabled=true \
  --metrics.port=9601 \
  --default.app_id=godknife-app \
  --default.key=godknife-key \
  --default.secret=godknife-secret
```

## Testing the Connection

### 1. Check if Soketi is running

```bash
curl http://localhost:6001
```

You should see a message like: "OK"

### 2. Check metrics endpoint

```bash
curl http://localhost:9601/metrics
```

### 3. Test with your application

The real-time chat feature in your application uses Soketi automatically. To test:

1. Start the application: `npm run dev`
2. Open two browser windows
3. Start a conversation
4. Send messages - they should appear in real-time

## Troubleshooting

### Connection issues

- Ensure Soketi container is running: `docker ps | grep soketi`
- Check Soketi logs: `docker-compose logs soketi`
- Verify environment variables are set correctly
- Make sure port 6001 is not blocked by firewall

### Client can't connect

- Check `NEXT_PUBLIC_PUSHER_HOST` matches where Soketi is accessible
- For local development, use `localhost`
- For production, use your actual domain
- Ensure the port is correct (6001 by default)

### Messages not appearing in real-time

- Check browser console for WebSocket errors
- Verify both server and client are using the same key
- Check Soketi logs for connection attempts

## Advanced Configuration

### Multi-tenancy

Soketi supports multiple apps. Edit `docker-compose.yml`:

```yaml
environment:
  SOKETI_APPS: |
    [
      {
        "id": "godknife-app",
        "key": "godknife-key",
        "secret": "godknife-secret",
        "maxConnections": 1000,
        "enableClientMessages": true
      }
    ]
```

### Redis adapter (for horizontal scaling)

To scale Soketi across multiple instances:

```yaml
environment:
  SOKETI_ADAPTER_DRIVER: "redis"
  SOKETI_QUEUE_DRIVER: "redis"
  SOKETI_CACHE_DRIVER: "redis"
  SOKETI_DB_REDIS_HOST: "redis"
  SOKETI_DB_REDIS_PORT: "6379"
```

### SSL/TLS

For production with SSL:

```yaml
environment:
  SOKETI_SSL_CERT: "/certs/cert.pem"
  SOKETI_SSL_KEY: "/certs/key.pem"
volumes:
  - ./certs:/certs:ro
```

## Resources

- [Soketi Documentation](https://docs.soketi.app/)
- [Soketi GitHub](https://github.com/soketi/soketi)
- [Pusher Protocol Documentation](https://pusher.com/docs/channels/library_auth_reference/pusher-websockets-protocol/)

## Migration from Pusher

If you were previously using Pusher:

1. No code changes needed - Soketi is fully compatible
2. Update environment variables to point to Soketi
3. Remove Pusher credentials from Pusher dashboard (optional)
4. Enjoy free, self-hosted real-time messaging! 🎉
