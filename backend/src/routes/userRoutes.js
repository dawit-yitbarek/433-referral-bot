import express from 'express';
import { getUserDashboard } from '../controllers/userController.js';

const router = express.Router();

router.post('/sync', getUserDashboard);

export default router;