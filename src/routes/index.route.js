import express from 'express';
import linearRegressionRoutes from './linearRegression.route';
import contentBasedRoutes from './contentBased.route';

const router = express.Router(); // eslint-disable-line new-cap

/* Base route: [/api] */

/** GET [/health-check]
*  - Check service health */
router.get('/health-check', (req, res) =>
  res.send('Hello hooman!')
);

router.get('/get-ratings-grouped-by-user/:id', (req, res) => {
    let userId = req.params.id;
    let listRatings = _ratingsGroupedByUser[userId];
    let userListRatings = Object.keys(listRatings);
    const msg = {
        movieId: userListRatings
    };
    res.json(msg);
});

router.use('/linear-regression', linearRegressionRoutes);
router.use('/content-based', contentBasedRoutes);
// router.use('/content-based');
/* 
router.use('/user', userRoutes);
router.use('/candidate', candidateRoutes);
router.use('/contract', contractRoutes); */

export default router;