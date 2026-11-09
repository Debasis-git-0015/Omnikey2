import express from 'express';
import { 
  getVaultItems, 
  createVaultItem, 
  updateVaultItem, 
  deleteVaultItem,
  purgeVaultItems
} from '../controllers/vaultController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all vault routes
router.use(protect);

router.route('/')
  .get(getVaultItems)
  .post(createVaultItem);

// Register /purge route before /:id parameter to avoid mismatch conflicts
router.delete('/purge', purgeVaultItems);

router.route('/:id')
  .put(updateVaultItem)
  .delete(deleteVaultItem);

export default router;
