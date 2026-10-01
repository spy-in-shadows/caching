const productService = require('../services/productService');

class ProductController {
    async getAllProducts(req, res) {
        try {
            const products = await productService.getAllProducts();
            return res.status(200).json(products);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getProductById(req, res) {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${req.params.id} not found` });
            }
            return res.status(200).json(product);
        } catch (error) {
            if (error.message.includes('Invalid product ID')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    async createProduct(req, res) {
        try {
            const newProduct = await productService.createProduct(req.body);
            return res.status(201).json(newProduct);
        } catch (error) {
            if (error.message.includes('required')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    async updateProduct(req, res) {
        try {
            const updated = await productService.updateProduct(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ error: `Product with ID ${req.params.id} not found` });
            }
            return res.status(200).json(updated);
        } catch (error) {
            if (error.message.includes('Invalid') || error.message.includes('required')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    async patchProduct(req, res) {
        try {
            const updated = await productService.patchProduct(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ error: `Product with ID ${req.params.id} not found` });
            }
            return res.status(200).json(updated);
        } catch (error) {
            if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('must be')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    async deleteProduct(req, res) {
        try {
            const deleted = await productService.deleteProduct(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: `Product with ID ${req.params.id} not found` });
            }
            return res.status(200).json({
                message: 'Product deleted successfully',
                product: deleted
            });
        } catch (error) {
            if (error.message.includes('Invalid product ID')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ProductController();
