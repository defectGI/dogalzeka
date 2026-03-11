import { Router } from 'express';
import { sendMessage } from '../controllers/chatController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/message', optionalAuth, sendMessage);

export default router;
