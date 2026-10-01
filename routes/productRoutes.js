const express = require('express');
const router = express.Router();
const { productController } = require('../controllers');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware');

router.get('/', cacheMiddleware, (req, res) => productController.getAllProducts(req, res));
router.get('/:id', cacheMiddleware, (req, res) => productController.getProductById(req, res));

router.post('/', invalidateCacheMiddleware, (req, res) => productController.createProduct(req, res));
router.put('/:id', invalidateCacheMiddleware, (req, res) => productController.updateProduct(req, res));
router.patch('/:id', invalidateCacheMiddleware, (req, res) => productController.patchProduct(req, res));
router.delete('/:id', invalidateCacheMiddleware, (req, res) => productController.deleteProduct(req, res));

module.exports = router;
