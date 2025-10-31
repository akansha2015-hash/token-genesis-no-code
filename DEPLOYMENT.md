# AETS Platform - Deployment Guide

## Environment Configuration

### Sandbox Environment
**Purpose**: Testing and development with fake data

1. Create a separate Supabase project for sandbox
2. Set environment variable: `ENVIRONMENT=sandbox`
3. Use test merchants and fake PANs only
4. Disable real payment processing
5. Enable verbose logging

**Sandbox Configuration:**
```bash
ENVIRONMENT=sandbox
SUPABASE_URL=<sandbox-project-url>
SUPABASE_ANON_KEY=<sandbox-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<sandbox-service-role-key>
```

### Production Environment
**Purpose**: Live operations with real data

1. Use main Supabase project
2. Set environment variable: `ENVIRONMENT=production`
3. Enable all security features
4. Configure rate limiting
5. Set up monitoring and alerting

**Production Configuration:**
```bash
ENVIRONMENT=production
SUPABASE_URL=<production-project-url>
SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
SLACK_WEBHOOK_URL=<your-slack-webhook>
```

## Deployment with Lovable

### Quick Deployment
1. Click the **Publish** button in Lovable (top-right on desktop, bottom-right on mobile in Preview mode)
2. Your app is instantly deployed with a lovable.app subdomain
3. Changes are automatically deployed on each publish

### Custom Domain Setup
1. Navigate to Project > Settings > Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Requires paid Lovable plan

## CI/CD with GitHub Integration

### Setup GitHub Integration
1. In Lovable editor, click GitHub → Connect to GitHub
2. Authorize Lovable GitHub App
3. Click "Create Repository" to sync your code

### Automated Deployment
- **From Lovable**: Changes automatically push to GitHub
- **From GitHub**: Push changes to trigger Lovable sync
- **Branch Strategy**: Main branch = production, create feature branches for development

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Lovable
        run: |
          # Lovable auto-deploys on push to main
          echo "Deployment triggered via GitHub push"
      
      - name: Run health check
        run: |
          curl https://your-project.lovable.app/functions/v1/health-check
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Health Monitoring Setup

### Built-in Health Check
The platform includes automatic health monitoring at:
- **Endpoint**: `/functions/v1/health-check`
- **Frequency**: Check every 30 seconds
- **Monitors**: Database, Edge Functions, API latency

### External Monitoring Integration
Recommended services:
- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring with SMS alerts
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure and application monitoring

**Setup Example (UptimeRobot):**
1. Create account at uptimerobot.com
2. Add new monitor
3. Set URL: `https://your-project.lovable.app/functions/v1/health-check`
4. Monitor type: HTTP(s)
5. Check interval: 5 minutes
6. Alert contacts: Email, SMS, Slack

## Alerting Configuration

### Slack Alerts
1. Create Slack webhook:
   - Go to api.slack.com/apps
   - Create new app → Incoming Webhooks
   - Add webhook to workspace
   - Copy webhook URL

2. Add to Lovable secrets:
   - Secret name: `SLACK_WEBHOOK_URL`
   - Secret value: Your webhook URL

3. Alerts will be sent for:
   - System health degradation
   - Failed compliance checks
   - High-risk transactions (score ≥ 80)
   - Critical security events

### Email Alerts
Configure through your monitoring service or use:
- Supabase Auth emails for user notifications
- SendGrid/Mailgun for operational alerts
- AWS SES for high-volume emails

## Scheduled Tasks

### Monthly Compliance Checks
Run compliance audits using Supabase cron jobs:

```sql
SELECT cron.schedule(
  'monthly-compliance-check',
  '0 0 1 * *',  -- First day of each month at midnight
  $$
  SELECT net.http_post(
    url := 'https://xcqeubgmmbqjzgzhwghm.supabase.co/functions/v1/compliance-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

### Weekly Integration Tests
Schedule automated testing:

```sql
SELECT cron.schedule(
  'weekly-integration-tests',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  $$
  SELECT net.http_post(
    url := 'https://xcqeubgmmbqjzgzhwghm.supabase.co/functions/v1/health-check',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

### Daily Health Checks
Monitor system health continuously:

```sql
SELECT cron.schedule(
  'daily-health-check',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://xcqeubgmmbqjzgzhwghm.supabase.co/functions/v1/health-check',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

## Performance Optimization

### Edge Function Optimization
- Keep functions under 1MB
- Use streaming for large responses
- Implement proper caching
- Optimize database queries

### Database Performance
- Create indexes on frequently queried columns
- Use database functions for complex operations
- Enable RLS efficiently
- Regular VACUUM operations

### CDN Configuration
- Static assets served via Lovable CDN
- Enable gzip compression
- Cache static resources
- Optimize images before upload

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] API keys rotated regularly (monthly)
- [ ] Encryption keys rotated (30 days)
- [ ] JWT verification enabled on sensitive functions
- [ ] Rate limiting configured
- [ ] CORS headers properly configured
- [ ] Secrets stored in Supabase (not code)
- [ ] Compliance checks scheduled
- [ ] Alert system configured
- [ ] Access logs monitored

## Rollback Procedure

### Quick Rollback via Lovable
1. Click project name → History
2. Find last working version
3. Click "Restore" button
4. Confirm restoration

### GitHub Rollback
```bash
git revert <commit-hash>
git push origin main
```

## Support & Resources

- **Lovable Docs**: https://docs.lovable.dev
- **Supabase Docs**: https://supabase.com/docs
- **Status Page**: Create at statuspage.io
- **Support**: support@lovable.dev

## Monitoring Dashboard Access

Access the monitoring dashboard at:
- **URL**: `/monitoring`
- **Features**:
  - Real-time health status
  - Compliance check history
  - System metrics
  - Manual compliance triggers

## Next Steps

1. Deploy to production using Publish button
2. Set up custom domain (optional)
3. Configure GitHub integration
4. Add Slack webhook for alerts
5. Schedule compliance checks via SQL
6. Set up external monitoring service
7. Test rollback procedure
8. Document incident response plan
