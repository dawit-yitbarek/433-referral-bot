import express from 'express';
import { getWithdrawHistory, sendWithdraw } from '../controllers/withdrawController.js';

const router = express.Router();

router.get('/', getWithdrawHistory);
router.post('/', sendWithdraw);

export default router;