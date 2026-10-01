const db = require('../database');

class ProductService {
    async getAllProducts() {
        return await db.getAllProducts();
    }

    async getProductById(id) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) {
            throw new Error('Invalid product ID');
        }
        return await db.getProductById(numericId);
    }

    async createProduct(productData) {
        if (!productData || typeof productData !== 'object') {
            throw new Error('Product payload is required');
        }

        const { name, price } = productData;
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Product name is required');
        }

        const numericPrice = Number(price);
        if (price === undefined || Number.isNaN(numericPrice) || numericPrice < 0) {
            throw new Error('Valid product price is required');
        }

        const newProduct = {
            name: name.trim(),
            price: numericPrice
        };

        return await db.createProduct(newProduct);
    }

    async updateProduct(id, productData) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) {
            throw new Error('Invalid product ID');
        }

        if (!productData || typeof productData !== 'object') {
            throw new Error('Product payload is required');
        }

        const { name, price } = productData;
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Product name is required');
        }

        const numericPrice = Number(price);
        if (price === undefined || Number.isNaN(numericPrice) || numericPrice < 0) {
            throw new Error('Valid product price is required');
        }

        const updatedData = {
            name: name.trim(),
            price: numericPrice
        };

        return await db.updateProduct(numericId, updatedData);
    }

    async patchProduct(id, partialData) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) {
            throw new Error('Invalid product ID');
        }

        if (!partialData || typeof partialData !== 'object' || Object.keys(partialData).length === 0) {
            throw new Error('At least one field to update is required');
        }

        const updates = {};
        if (partialData.name !== undefined) {
            if (typeof partialData.name !== 'string' || partialData.name.trim() === '') {
                throw new Error('Product name must be a non-empty string');
            }
            updates.name = partialData.name.trim();
        }

        if (partialData.price !== undefined) {
            const numericPrice = Number(partialData.price);
            if (Number.isNaN(numericPrice) || numericPrice < 0) {
                throw new Error('Product price must be a valid positive number');
            }
            updates.price = numericPrice;
        }

        return await db.patchProduct(numericId, updates);
    }

    async deleteProduct(id) {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) {
            throw new Error('Invalid product ID');
        }
        return await db.deleteProduct(numericId);
    }
}

module.exports = new ProductService();
