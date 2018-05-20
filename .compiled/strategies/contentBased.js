'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _common = require('./common');

function predictWithContentBased(X, MOVIES_IN_LIST, title) {
  var _getMovieIndexByTitle = (0, _common.getMovieIndexByTitle)(MOVIES_IN_LIST, title),
      index = _getMovieIndexByTitle.index;

  // Compute similarities based on input movie


  var cosineSimilarityRowVector = (0, _common.getCosineSimilarityRowVector)(X, index);

  // Enrich the vector to convey all information
  // Use references from before which we kept track of
  var contentBasedRecommendation = cosineSimilarityRowVector.map(function (value, key) {
    return {
      score: value,
      movieId: MOVIES_IN_LIST[key].id
    };
  });

  return (0, _common.sortByScore)(contentBasedRecommendation);
}

exports.default = predictWithContentBased;
//# sourceMappingURL=contentBased.js.map