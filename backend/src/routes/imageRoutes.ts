import express from 'express';
import { provideImage } from '../controllers/imageController.js';

const router = express.Router();

router.get('/user', provideImage);

export default router;