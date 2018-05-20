import express from 'express';
import contentBasedController from '../controllers/contentBased.controller';

const router = express.Router();

router.route('/prediction')
    .post(contentBasedController.predictBasedOnContent);

export default router;