import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getConversations,
  getConversationById,
  archiveConversation,
  deleteConversation,
  sendMessage,
  getSuggestedReply,
  approveReply,
} from '../controllers/conversation.controller';

const router = Router();

router.use(authenticate);

router.get('/', getConversations);
router.get('/:id', getConversationById);
router.patch('/:id/archive', archiveConversation);
router.delete('/:id', deleteConversation);
router.post('/send', sendMessage);
router.get('/:id/reply', getSuggestedReply);
router.post('/:id/approve', approveReply);

export default router;
