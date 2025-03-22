const promClient = require('prom-client');
const responseTime = require('response-time');

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'cyprus_classified_' });

// Кастомные метрики
const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const activeUsers = new promClient.Gauge({
    name: 'active_users_total',
    help: 'Total number of active users'
});

const listingsTotal = new promClient.Gauge({
    name: 'listings_total',
    help: 'Total number of listings',
    labelNames: ['status']
});

module.exports = {
    metrics: promClient,
    httpRequestDurationMicroseconds,
    activeUsers,
    listingsTotal,
    metricsMiddleware: responseTime((req, res, time) => {
        if (req?.route?.path) {
            httpRequestDurationMicroseconds
                .labels(req.method, req.route.path, res.statusCode)
                .observe(time / 1000);
        }
    })
};