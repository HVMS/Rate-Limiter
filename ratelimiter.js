class RateLimiter {
    constructor(windowSizeInSeconds, maxRequests) {
        this.windowSizeInMillis = windowSizeInSeconds * 1000;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    cleanUp() {
        const now = Date.now();
        this.requests.forEach((timestamps, ip) => {
            const filtered = timestamps.filter(t => now - t < this.windowSizeInMillis);
            if (filtered.length === 0) {
                this.requests.delete(ip);
            } else {
                this.requests.set(ip, filtered);
            }
        });
    }

    async limit(req, res) {
        // Assuming your framework provides req.ip
        const ip = req.ip;
        const now = Date.now();

        // Cleanup is done before each request to keep the map size in check
        this.cleanUp(); 

        let timestamps = this.requests.get(ip);
        if (!timestamps) {
            timestamps = [];
            this.requests.set(ip, timestamps);
        }

        if (timestamps.length >= this.maxRequests) {
            const timeToReset = Math.ceil((timestamps[0] + this.windowSizeInMillis - now) / 1000);
            res.setHeader('Retry-After', timeToReset);
            res.writeHead(429, { 'Content-Type': 'text/plain' }); // Set status code
            return res.end('Too Many Requests - try again later');
        }

        timestamps.push(now);
        return true; // Allow the request
    }
}

module.exports = RateLimiter;
