import { sliceAndDice }  from '../index';
import predictWithContentBased from '../strategies/contentBased';
/**
 * POST: [/prediction]
 * JSON req: {
 *      "title": "Batman"
 * }
 */
function predictBasedOnContent(req, res) {
    const _title = req.body.title;
    const contentBasedRecommendation = predictWithContentBased(matrix, movies_in_list, _title);
    
    const result = sliceAndDice(contentBasedRecommendation, movies_by_id, 10, true);

    const msg = {
        prediction: result
    }
    res.json(msg);
}

export default {
    predictBasedOnContent
}

