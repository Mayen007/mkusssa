const express = require('express');
const {
  createGalleryItemHandler,
  deleteGalleryItemHandler,
  getAllGalleryItems,
  getPublishedGallery,
  updateGalleryItemHandler,
} = require('../controllers/gallery.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getPublishedGallery);
router.get('/all', authenticateToken, authorizeRoles('admin', 'editor'), getAllGalleryItems);
router.post('/', authenticateToken, authorizeRoles('admin', 'editor'), createGalleryItemHandler);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'editor'), updateGalleryItemHandler);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteGalleryItemHandler);

module.exports = router;