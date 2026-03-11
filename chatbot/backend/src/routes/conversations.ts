import { Router } from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  deleteConversation,
} from '../controllers/conversationsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id/messages', getMessages);
router.delete('/:id', deleteConversation);

export default router;
