import express from 'express';
import { checkAdmin, getAdmins, addAdmin, deleteAdmin, getAllWithdrawals } from '../controllers/adminController.js';

const router = express.Router();

router.get('/check-admin', checkAdmin);
router.get('/', getAdmins);
router.get('/withdrawals', getAllWithdrawals);
router.post('/add', addAdmin);
router.delete('/delete', deleteAdmin);

export default router;