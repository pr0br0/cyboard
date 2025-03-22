// middleware/healthCheck.js
const os = require('os');
const mongoose = require('mongoose');

const healthCheck = async (req, res) => {
    try {
        const healthcheck = {
            uptime: process.uptime(),
            timestamp: Date.now(),
            status: 'OK',
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                usagePercentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0].model,
                speed: os.cpus()[0].speed
            },
            database: {
                status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
                host: mongoose.connection.host,
                name: mongoose.connection.name
            }
        };

        res.json(healthcheck);
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            message: error.message
        });
    }
};

module.exports = healthCheck;
