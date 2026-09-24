import express from 'express';
import {
    checkAdmin,
    getUsers,
    getAllReferrals,
    searchUser
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/check-admin', checkAdmin);
router.get('/users', getUsers);
router.get('/referrals', getAllReferrals);
router.get('/users/search', searchUser);

export default router;