const fs = require('node:fs/promises');
const path = require('node:path');

const dbFilePath = path.resolve(__dirname, '../db.json');

const DB_DELAY_MS = process.env.DB_DELAY_MS !== undefined ? parseInt(process.env.DB_DELAY_MS, 10) : 0;

const delay = (ms) => {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
};

async function readData() {
    if (DB_DELAY_MS > 0) {
        await delay(DB_DELAY_MS);
    }
    try {
        const raw = await fs.readFile(dbFilePath, 'utf-8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeData([]);
            return [];
        }
        throw error;
    }
}

async function writeData(data) {
    if (DB_DELAY_MS > 0) {
        await delay(DB_DELAY_MS);
    }
    await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function getAllProducts() {
    return await readData();
}

async function getProductById(id) {
    const products = await readData();
    return products.find((p) => p.id === id) || null;
}

async function createProduct(productData) {
    const products = await readData();
    const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    const newProduct = { id: nextId, ...productData };
    products.push(newProduct);
    await writeData(products);
    return newProduct;
}

async function updateProduct(id, productData) {
    const products = await readData();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
        return null;
    }
    const updated = { id, ...productData };
    products[index] = updated;
    await writeData(products);
    return updated;
}

async function patchProduct(id, partialData) {
    const products = await readData();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
        return null;
    }
    const existing = products[index];
    const updated = { ...existing, ...partialData, id };
    products[index] = updated;
    await writeData(products);
    return updated;
}

async function deleteProduct(id) {
    const products = await readData();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
        return null;
    }
    const [deleted] = products.splice(index, 1);
    await writeData(products);
    return deleted;
}

module.exports = {
    readData,
    writeData,
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    patchProduct,
    deleteProduct,
    dbFilePath
};
