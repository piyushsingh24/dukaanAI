import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { register, login, logout, refreshToken, getProfile } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh', authenticate, refreshToken);
router.get('/profile', authenticate, getProfile);

export default router;
