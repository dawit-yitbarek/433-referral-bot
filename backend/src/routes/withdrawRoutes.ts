import express from 'express';
import { getWithdrawHistory, sendWithdraw, getAdminWithdrawals, processWithdrawal } from '../controllers/withdrawController.js';

const router = express.Router();

router.get('/', getWithdrawHistory);
router.post('/', sendWithdraw);
router.get('/admin', getAdminWithdrawals);
router.post('/process', processWithdrawal);


export default router;