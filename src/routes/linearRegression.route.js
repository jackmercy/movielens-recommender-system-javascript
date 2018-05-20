import express from 'express';
import linearController from '../controllers/linearRegression.controller';

const router = express.Router();

router.route('/prediction')
    .post(linearController.predictBasedOnUser);

export default router;