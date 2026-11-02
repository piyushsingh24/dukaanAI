import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getMerchant, updateMerchant, uploadLogo, updateSettings, getAutoReply, updateAutoReply } from '../controllers/merchant.controller';

const router = Router();

router.use(authenticate);

router.get('/', getMerchant);
router.put('/', updateMerchant);
router.post('/logo', uploadLogo);
router.patch('/settings', updateSettings);
router.get('/auto-reply', getAutoReply);
router.put('/auto-reply', updateAutoReply);

export default router;
