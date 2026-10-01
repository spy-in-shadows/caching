const express = require('express');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'Product Catalog API with Layered Caching & Invalidation',
        documentation: {
            endpoints: [
                { method: 'GET', path: '/products', description: 'Get all products (Cached, 1 min TTL)' },
                { method: 'GET', path: '/products/:id', description: 'Get product by ID (Cached, 1 min TTL)' },
                { method: 'POST', path: '/products', description: 'Create product (Invalidates cache on success)' },
                { method: 'PUT', path: '/products/:id', description: 'Update product (Invalidates cache on success)' },
                { method: 'PATCH', path: '/products/:id', description: 'Partial update product (Invalidates cache on success)' },
                { method: 'DELETE', path: '/products/:id', description: 'Delete product (Invalidates cache on success)' }
            ],
            headers: {
                'X-Cache': 'HIT or MISS on GET requests'
            },
            architecture: 'Route -> Middleware -> Controller -> Service -> Database'
        }
    });
});

app.use(routes);

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

let server = null;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

module.exports = app;
module.exports.server = server;