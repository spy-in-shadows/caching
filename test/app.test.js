const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.CACHE_TTL_MS = '1000';

const app = require('../server');
const cacheService = require('../services/cacheService');
const db = require('../database');

const dbPath = path.resolve(__dirname, '../db.json');
let initialDbBackup = '';
let serverInstance;
let baseUrl;

describe('Product Catalog API with Layered Caching & Invalidation', () => {
    before(async () => {
        initialDbBackup = await fs.readFile(dbPath, 'utf-8');

        await new Promise((resolve) => {
            serverInstance = app.listen(0, () => {
                const port = serverInstance.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        await fs.writeFile(dbPath, initialDbBackup, 'utf-8');
        if (serverInstance) {
            await new Promise((resolve) => serverInstance.close(resolve));
        }
    });

    beforeEach(async () => {
        await fs.writeFile(dbPath, initialDbBackup, 'utf-8');
        cacheService.invalidateAll();
    });

    test('1. First GET /products request results in cache MISS with X-Cache: MISS header', async () => {
        const response = await fetch(`${baseUrl}/products`);
        const data = await response.json();

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.headers.get('x-cache'), 'MISS');
        assert.ok(Array.isArray(data));
        assert.strictEqual(data.length, 4);
    });

    test('2. Second GET /products request results in cache HIT with X-Cache: HIT header', async () => {
        const res1 = await fetch(`${baseUrl}/products`);
        assert.strictEqual(res1.headers.get('x-cache'), 'MISS');

        const res2 = await fetch(`${baseUrl}/products`);
        const data2 = await res2.json();

        assert.strictEqual(res2.status, 200);
        assert.strictEqual(res2.headers.get('x-cache'), 'HIT');
        assert.strictEqual(data2.length, 4);
    });

    test('3. GET /products/:id follows cache MISS then HIT cycle', async () => {
        const res1 = await fetch(`${baseUrl}/products/1`);
        const data1 = await res1.json();
        assert.strictEqual(res1.status, 200);
        assert.strictEqual(res1.headers.get('x-cache'), 'MISS');
        assert.strictEqual(data1.name, 'Keyboard');

        const res2 = await fetch(`${baseUrl}/products/1`);
        const data2 = await res2.json();
        assert.strictEqual(res2.status, 200);
        assert.strictEqual(res2.headers.get('x-cache'), 'HIT');
        assert.strictEqual(data2.id, 1);
        assert.strictEqual(data2.name, 'Keyboard');
    });

    test('4. Cache entry expires after TTL (Time To Live) and refreshes with MISS', async () => {
        const res1 = await fetch(`${baseUrl}/products/2`);
        assert.strictEqual(res1.headers.get('x-cache'), 'MISS');

        const res2 = await fetch(`${baseUrl}/products/2`);
        assert.strictEqual(res2.headers.get('x-cache'), 'HIT');

        await new Promise((resolve) => setTimeout(resolve, 1100));

        const res3 = await fetch(`${baseUrl}/products/2`);
        assert.strictEqual(res3.status, 200);
        assert.strictEqual(res3.headers.get('x-cache'), 'MISS');

        const res4 = await fetch(`${baseUrl}/products/2`);
        assert.strictEqual(res4.headers.get('x-cache'), 'HIT');
    });

    test('5. POST /products creates item and invalidates cache', async () => {
        const get1 = await fetch(`${baseUrl}/products`);
        assert.strictEqual(get1.headers.get('x-cache'), 'MISS');

        const getCached = await fetch(`${baseUrl}/products`);
        assert.strictEqual(getCached.headers.get('x-cache'), 'HIT');

        const newProduct = { name: 'Headphones', price: 89.99 };
        const postRes = await fetch(`${baseUrl}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        assert.strictEqual(postRes.status, 201);
        const created = await postRes.json();
        assert.strictEqual(created.name, 'Headphones');
        assert.strictEqual(created.price, 89.99);

        const getAfter = await fetch(`${baseUrl}/products`);
        assert.strictEqual(getAfter.headers.get('x-cache'), 'MISS');
        const dataAfter = await getAfter.json();
        assert.strictEqual(dataAfter.length, 5);
        assert.ok(dataAfter.some((p) => p.name === 'Headphones'));
    });

    test('6. PUT /products/:id updates item and invalidates cache', async () => {
        const get1 = await fetch(`${baseUrl}/products/1`);
        assert.strictEqual(get1.headers.get('x-cache'), 'MISS');

        const getCached = await fetch(`${baseUrl}/products/1`);
        assert.strictEqual(getCached.headers.get('x-cache'), 'HIT');

        const updatedProduct = { name: 'Mechanical Keyboard RGB', price: 99.99 };
        const putRes = await fetch(`${baseUrl}/products/1`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });

        assert.strictEqual(putRes.status, 200);

        const getAfter = await fetch(`${baseUrl}/products/1`);
        assert.strictEqual(getAfter.headers.get('x-cache'), 'MISS');
        const dataAfter = await getAfter.json();
        assert.strictEqual(dataAfter.name, 'Mechanical Keyboard RGB');
        assert.strictEqual(dataAfter.price, 99.99);
    });

    test('7. PATCH /products/:id partially updates item and invalidates cache', async () => {
        await fetch(`${baseUrl}/products`);
        await fetch(`${baseUrl}/products/3`);

        const patchRes = await fetch(`${baseUrl}/products/3`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: 149.50 })
        });

        assert.strictEqual(patchRes.status, 200);

        const get3 = await fetch(`${baseUrl}/products/3`);
        assert.strictEqual(get3.headers.get('x-cache'), 'MISS');
        const data3 = await get3.json();
        assert.strictEqual(data3.name, 'Monitor');
        assert.strictEqual(data3.price, 149.50);

        const getAll = await fetch(`${baseUrl}/products`);
        assert.strictEqual(getAll.headers.get('x-cache'), 'MISS');
    });

    test('8. DELETE /products/:id deletes item and invalidates cache', async () => {
        await fetch(`${baseUrl}/products`);
        const itemRes = await fetch(`${baseUrl}/products/4`);
        assert.strictEqual(itemRes.status, 200);

        const deleteRes = await fetch(`${baseUrl}/products/4`, {
            method: 'DELETE'
        });
        assert.strictEqual(deleteRes.status, 200);

        const getDeleted = await fetch(`${baseUrl}/products/4`);
        assert.strictEqual(getDeleted.status, 404);

        const getAll = await fetch(`${baseUrl}/products`);
        assert.strictEqual(getAll.headers.get('x-cache'), 'MISS');
        const allData = await getAll.json();
        assert.strictEqual(allData.length, 3);
        assert.ok(!allData.some((p) => p.id === 4));
    });

    test('9. Layered structure: Database layer handles persistence accurately', async () => {
        const products = await db.getAllProducts();
        assert.ok(Array.isArray(products));
        const found = await db.getProductById(1);
        assert.strictEqual(found.id, 1);
    });
});
