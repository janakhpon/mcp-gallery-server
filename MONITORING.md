# Monitoring Setup

## Datadog Integration

### Quick Start

1. **Get Datadog API Key**
   - Sign up at https://www.datadoghq.com
   - Navigate to Organization Settings → API Keys
   - Copy your API key

2. **Configure Environment**
   ```bash
   # Add to .env
   DD_API_KEY=your_actual_api_key_here
   DD_TRACE_ENABLED=true
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   npm run start:dev
   ```

### What Gets Monitored

#### APM (Application Performance Monitoring)
- ✅ HTTP requests (latency, errors, throughput)
- ✅ Database queries (Prisma)
- ✅ Redis operations
- ✅ S3 uploads
- ✅ Bull queue jobs
- ✅ Custom traces

#### Logs
- ✅ Application logs (Pino structured JSON)
- ✅ Container logs
- ✅ Database logs
- ✅ Redis logs

#### Metrics
- ✅ CPU usage
- ✅ Memory usage
- ✅ Request rate
- ✅ Error rate
- ✅ Queue length
- ✅ Cache hit rate

#### Infrastructure
- ✅ Docker containers
- ✅ Host metrics
- ✅ Network traffic

### Dashboards

Access Datadog UI to see:

1. **APM Dashboard**: http://app.datadoghq.com/apm/traces
   - Request traces
   - Service map
   - Performance metrics

2. **Logs**: http://app.datadoghq.com/logs
   - Real-time log streaming
   - Log patterns
   - Error tracking

3. **Infrastructure**: http://app.datadoghq.com/infrastructure
   - Container health
   - Resource usage
   - Service dependencies

### Custom Metrics

```typescript
import tracer from './tracing';

// Custom span
const span = tracer.scope().active();
span?.setTag('custom.tag', 'value');

// Custom metric
tracer.dogstatsd.increment('images.uploaded', 1, ['env:production']);
tracer.dogstatsd.gauge('queue.length', queueLength);
tracer.dogstatsd.histogram('image.processing.time', duration);
```

### Alerts

Set up alerts in Datadog for:

```
Error Rate > 5% for 5 minutes
  → Notify #alerts channel

Response Time p95 > 2s for 10 minutes
  → Notify on-call engineer

Queue Length > 1000 for 15 minutes
  → Scale workers

Database Connection Pool > 80% for 5 minutes
  → Scale database
```

### Production Configuration

```env
# Production .env
NODE_ENV=production
DD_API_KEY=your_production_api_key
DD_TRACE_ENABLED=true
DD_AGENT_HOST=datadog-agent.prod.internal
DD_TAGS=env:production,service:gallery-api,version:1.0.0
```

### Disable in Development (Optional)

```env
# Development .env
DD_TRACE_ENABLED=false
```

The app will skip Datadog initialization and save API calls.

### Troubleshooting

**Problem**: Traces not showing up
```bash
# Check agent is running
docker ps | grep datadog

# Check agent logs
docker logs gallery-datadog

# Verify API key
echo $DD_API_KEY
```

**Problem**: High overhead
```bash
# Reduce sampling rate
DD_TRACE_SAMPLE_RATE=0.1  # Sample 10% of requests
```

**Problem**: Container metrics missing
```bash
# Ensure Docker socket is mounted
docker-compose down
docker-compose up -d
```

### Cost Optimization

| Tier | Traces/month | Cost | Use Case |
|------|-------------|------|----------|
| **Free** | 150K | $0 | Development/Testing |
| **Pro** | Unlimited | $31/host/mo | Small Production |
| **Enterprise** | Unlimited | Custom | Large Scale |

**Tips to reduce costs:**
- Use sampling in production (`DD_TRACE_SAMPLE_RATE=0.1`)
- Filter noisy endpoints
- Archive old logs to S3
- Use retention policies (7 days for dev, 30 for prod)


