# Open Source Monitoring Stack

## 🆓 Free & Open Source

This monitoring stack is **100% free** and runs locally:

- **Prometheus** - Metrics collection & storage
- **Grafana** - Beautiful dashboards & visualization
- **Loki** - Log aggregation & search

No API keys, no cloud accounts, no costs! 🎉

## Quick Start

```bash
# Start all services (including monitoring)
docker-compose up -d

# Start your API
npm run start:dev

# Access dashboards
open http://localhost:3001  # Grafana (admin/admin)
```

## 📊 Grafana Dashboard

### First-time Setup

1. **Login to Grafana**: http://localhost:3001
   - Username: `admin`
   - Password: `admin`
   - (Change password when prompted, or skip)

2. **Verify Data Sources**
   - Go to Configuration → Data Sources
   - You should see Prometheus and Loki already configured ✅

3. **Create Your First Dashboard**
   - Click `+` → Dashboard → Add new panel
   - Select Prometheus as data source
   - Choose metrics like:
     - `process_cpu_user_seconds_total`
     - `process_resident_memory_bytes`
     - `http_requests_total`

### Pre-built Dashboards

Import popular dashboards:

1. **Node.js Application Dashboard**
   - ID: `11159`
   - https://grafana.com/grafana/dashboards/11159

2. **PostgreSQL Dashboard**
   - ID: `9628`
   - https://grafana.com/grafana/dashboards/9628

3. **Redis Dashboard**
   - ID: `11835`
   - https://grafana.com/grafana/dashboards/11835

**How to import:**
- Grafana UI → Dashboards → Import
- Enter dashboard ID
- Select Prometheus as data source
- Click Import

## 📈 Prometheus Metrics

### Available Metrics

Your API exposes metrics at: http://localhost:3000/metrics

**Node.js Default Metrics:**
```
process_cpu_user_seconds_total
process_resident_memory_bytes
nodejs_heap_size_total_bytes
nodejs_heap_size_used_bytes
nodejs_eventloop_lag_seconds
```

**HTTP Metrics:**
```
http_request_duration_seconds
http_requests_total
```

### Query Examples (Prometheus UI)

Visit http://localhost:9090 and try:

```promql
# Request rate (per second)
rate(http_requests_total[1m])

# Memory usage (MB)
process_resident_memory_bytes / 1024 / 1024

# CPU usage (%)
rate(process_cpu_user_seconds_total[1m]) * 100

# Heap usage (%)
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100
```

## 🔍 Loki Logs

### View Logs in Grafana

1. Go to Grafana → Explore
2. Select **Loki** as data source
3. Query logs:
   ```
   {container="gallery-api"}
   ```

### Filter Examples

```
# Only errors
{container="gallery-api"} |= "ERROR"

# Specific image uploads
{container="gallery-api"} |= "Image" |= "uploaded"

# API requests
{container="gallery-api"} |= "/api/v1/images"
```

## 🎯 What to Monitor

### Key Metrics

1. **Request Rate**
   - Normal: 10-100 req/s
   - Alert if: sudden drops (service down) or spikes (DDoS)

2. **Response Time (p95)**
   - Normal: < 200ms
   - Alert if: > 1s

3. **Error Rate**
   - Normal: < 1%
   - Alert if: > 5%

4. **Queue Length**
   - Normal: < 50
   - Alert if: > 100 (workers overloaded)

5. **Memory Usage**
   - Normal: < 500MB
   - Alert if: > 1GB (memory leak?)

6. **CPU Usage**
   - Normal: < 50%
   - Alert if: > 80%

### Create Alerts in Grafana

1. Edit panel → Alert tab
2. Set condition (e.g., "Memory > 1GB for 5 minutes")
3. Add notification channel (email, Slack, etc.)
4. Save

## 🆚 Comparison

| Feature | Grafana + Prometheus | Datadog |
|---------|---------------------|---------|
| **Cost** | 100% Free | $15-31/host/month |
| **Setup** | Self-hosted | Cloud SaaS |
| **Metrics** | ✅ Yes | ✅ Yes |
| **Logs** | ✅ Yes (Loki) | ✅ Yes |
| **APM** | ⚠️ Basic | ✅ Advanced |
| **Retention** | Unlimited (local) | 15 days (free) |
| **Learning Curve** | Medium | Easy |
| **Best For** | Development, small teams | Enterprise |

## 🎨 Custom Dashboards

### Example: Image Upload Dashboard

Create panels for:
- Upload rate (images/minute)
- Average file size
- Queue length
- Processing time
- Success/failure rate
- Storage used

### Panel Queries

```promql
# Upload rate
rate(http_requests_total{method="POST", endpoint="/api/v1/images"}[5m])

# Average response time
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

## 🔧 Troubleshooting

### Grafana won't start
```bash
docker logs gallery-grafana
docker-compose restart grafana
```

### No metrics showing
```bash
# Check Prometheus targets
open http://localhost:9090/targets

# Verify API metrics endpoint
curl http://localhost:3000/metrics
```

### Prometheus can't scrape API
```bash
# Update prometheus.yml target
- targets: ['host.docker.internal:3000']  # For Mac/Windows
# OR
- targets: ['172.17.0.1:3000']  # For Linux
```

## 📚 Resources

- Prometheus Docs: https://prometheus.io/docs/
- Grafana Docs: https://grafana.com/docs/
- Loki Docs: https://grafana.com/docs/loki/
- Community Dashboards: https://grafana.com/grafana/dashboards/


