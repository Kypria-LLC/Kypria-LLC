# 🏛️ Wealth Conduit

**Sacred Revenue Integration Pipeline**

Orchestrates sponsor flows from PayPal, GitHub Sponsors, and Patreon into verified treasury records with automated crest assignment and Discord notifications.

---

## Architecture Overview

```
Webhook Events → Verification → Tier Assignment → Crest Application → Notification
      ↓              ↓               ↓                  ↓                 ↓
  Event Bus    Signature Check   Amount Mapping    GitHub API Update   Discord Post
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- GitHub Personal Access Token (with repo write access)
- Discord Webhook URL
- PayPal IPN configuration
- GitHub Sponsors webhook secret

### Installation

```bash
# Clone repository
git clone https://github.com/Kypria-LLC/wealth-conduit.git
cd wealth-conduit

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your secrets

# Build
npm run build

# Run tests
npm test

# Start development server
npm run dev

# Deploy to production
npm run deploy
```

---

## Configuration

### Environment Variables

```env
# PayPal Configuration
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_RECEIVER_EMAIL=your@paypal.email
PAYPAL_ENV=production  # or 'sandbox'

# GitHub Configuration
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_ORG=Kypria-LLC
CREST_VAULT_REPO=crest-vault

# Discord Configuration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Patreon Configuration (optional)
PATREON_ACCESS_TOKEN=your_patreon_token
PATREON_WEBHOOK_SECRET=your_webhook_secret

# Event Bus (optional - defaults to in-memory)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### Tier Mapping

Edit `config/tier-mapping.json` to customize sponsorship tiers:

```json
{
  "paypal": {
    "tiers": [
      {
        "name": "Bronze Patron",
        "threshold": 5,
        "color": "#CD7F32",
        "badgeUrl": "https://..."
      }
    ]
  }
}
```

---

## API Reference

### Process Webhook Event

```typescript
POST /webhook/paypal
POST /webhook/github
POST /webhook/patreon

// Example: PayPal IPN
curl -X POST http://localhost:3000/webhook/paypal \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "payment_status=Completed&payer_email=sponsor@example.com&mc_gross=50"
```

### Health Check

```typescript
GET /health

Response: {
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400
}
```

---

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Send Test Event
```bash
./scripts/test-event.sh paypal 50 sponsor@example.com
```

---

## Monitoring

### Logs
```bash
# Production logs
journalctl -u wealth-conduit -f

# Development logs
npm run dev  # Auto-logs to console
```

### Metrics
- Event processing time
- Verification success rate
- Crest assignment success rate
- Discord notification delivery rate

---

## Deployment

### Systemd Service

```ini
# /etc/systemd/system/wealth-conduit.service
[Unit]
Description=Wealth Conduit - Sacred Revenue Pipeline
After=network.target

[Service]
Type=simple
User=kypria
WorkingDirectory=/opt/kypria/wealth-conduit
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Deploy Script
```bash
./scripts/deploy.sh
```

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check firewall rules
2. Verify webhook URL is publicly accessible
3. Confirm webhook secret matches configuration

### Verification Failures
1. Check PayPal receiver email matches `.env`
2. Verify GitHub webhook secret is correct
3. Review audit logs for signature mismatches

### Crest Assignment Failures
1. Verify GitHub token has repo write permissions
2. Check `crest-vault` repository exists and is accessible
3. Review tier mapping configuration

---

## Security

- All webhooks require signature verification
- Secrets stored in environment variables only
- Audit logging for all transactions
- Rate limiting enabled (100 req/min per IP)
- No sensitive data in logs

---

## License

MIT License - Kypria LLC

---

## Support

- GitHub Issues: [https://github.com/Kypria-LLC/wealth-conduit/issues](https://github.com/Kypria-LLC/wealth-conduit/issues)
- Discord Community: [Invite Link]
- Email: support@kypria.com

---

**The Treasury Awaits Your Command** 👑