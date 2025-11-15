import express from 'express';
import {
    checkAdmin,
    getAdmins,
    addAdmin,
    deleteAdmin,
    getAllWithdrawals,
    getUsers,
    getAllReferrals,
    searchUser,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/check-admin', checkAdmin);
router.get('/', getAdmins);
router.get('/withdrawals', getAllWithdrawals);
router.get('/users', getUsers);
router.get('/referrals', getAllReferrals);
router.get('/users/search', searchUser);
router.post('/add', addAdmin);
router.delete('/delete', deleteAdmin);

export default router;