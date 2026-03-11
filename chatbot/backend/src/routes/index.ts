import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import chatRoutes from './chat';
import conversationsRoutes from './conversations';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/conversations', conversationsRoutes);

export default router;
