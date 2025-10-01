// Datadog APM Tracing - Must be imported FIRST
import tracer from 'dd-trace';

if (
  process.env.NODE_ENV === 'production' ||
  process.env.DD_TRACE_ENABLED === 'true'
) {
  tracer.init({
    service: 'gallery-api',
    env: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    logInjection: true,
    runtimeMetrics: true,
    profiling: true,
    appsec: true,
  });

  console.log('✅ Datadog APM initialized');
}

export default tracer;
