import { sliceAndDice }  from '../index';
import predictWithLinearRegression from '../strategies/linearRegression';
/**
 * POST: [/prediction]
 * JSON req: {
 *      "userId": 12
 * }
 */
function predictBasedOnUser(req, res) {
    const userId = Number(req.body.userId);
    const moviesUserRating = _ratingsGroupedByUser[userId];
    const linearRegressionBasedRecommendation = predictWithLinearRegression(matrix, movies_in_list, moviesUserRating);
    
    const result = sliceAndDice(linearRegressionBasedRecommendation, movies_by_id, 10, true);

    const msg = {
        prediction: result
    }
    res.json(msg);
}

export default {
    predictBasedOnUser
}

