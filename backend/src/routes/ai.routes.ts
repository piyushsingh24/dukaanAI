import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  parseMessageController,
  detectIntentController,
  extractEntitiesController,
  getSummary,
  getSuggestions,
  validateController,
} from '../controllers/ai.controller';

const router = Router();

router.use(authenticate);

router.post('/parse', parseMessageController);
router.post('/intent', detectIntentController);
router.post('/entities', extractEntitiesController);
router.post('/validate', validateController);
router.get('/summary', getSummary);
router.get('/suggestions', getSuggestions);

export default router;
