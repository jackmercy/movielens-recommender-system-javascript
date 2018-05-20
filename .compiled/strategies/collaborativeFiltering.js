'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.predictWithCfUserBased = predictWithCfUserBased;
exports.predictWithCfItemBased = predictWithCfItemBased;
exports.getMatrices = getMatrices;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _common = require('./common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Read https://buildingrecommenders.wordpress.com/2015/11/18/overview-of-recommender-algorithms-part-2/
// Watch https://www.youtube.com/watch?v=h9gpufJFF-0
// Read https://datascience.stackexchange.com/questions/2598/item-based-and-user-based-recommendation-difference-in-mahout

function predictWithCfUserBased(ratingsGroupedByUser, ratingsGroupedByMovie, userId) {
  var _getMatrices = getMatrices(ratingsGroupedByUser, ratingsGroupedByMovie, userId),
      userItem = _getMatrices.userItem;

  var matrix = userItem.matrix,
      movieIds = userItem.movieIds,
      userIndex = userItem.userIndex;


  var matrixNormalized = meanNormalizeByRowVector(matrix);
  var userRatingsRowVector = matrixNormalized[userIndex];

  var cosineSimilarityRowVector = (0, _common.getCosineSimilarityRowVector)(matrixNormalized, userIndex);

  var predictedRatings = userRatingsRowVector.map(function (rating, movieIndex) {
    var movieId = movieIds[movieIndex];

    var movieRatingsRowVector = getMovieRatingsRowVector(matrixNormalized, movieIndex);

    var score = void 0;
    if (rating === 0) {
      score = getPredictedRating(movieRatingsRowVector, cosineSimilarityRowVector);
    } else {
      score = rating;
    }

    return { score: score, movieId: movieId };
  });

  return (0, _common.sortByScore)(predictedRatings);
}

function predictWithCfItemBased(ratingsGroupedByUser, ratingsGroupedByMovie, userId) {
  var _getMatrices2 = getMatrices(ratingsGroupedByUser, ratingsGroupedByMovie, userId),
      itemUser = _getMatrices2.itemUser;

  var matrix = itemUser.matrix,
      movieIds = itemUser.movieIds,
      userIndex = itemUser.userIndex;


  var matrixNormalized = meanNormalizeByRowVector(matrix);
  var userRatingsRowVector = getUserRatingsRowVector(matrixNormalized, userIndex);

  var predictedRatings = userRatingsRowVector.map(function (rating, movieIndex) {
    var movieId = movieIds[movieIndex];

    var cosineSimilarityRowVector = (0, _common.getCosineSimilarityRowVector)(matrixNormalized, movieIndex);

    var score = void 0;
    if (rating === 0) {
      score = getPredictedRating(userRatingsRowVector, cosineSimilarityRowVector);
    } else {
      score = rating;
    }

    return { score: score, movieId: movieId };
  });

  return (0, _common.sortByScore)(predictedRatings);
}

function getPredictedRating(ratingsRowVector, cosineSimilarityRowVector) {
  var N = 5;
  var neighborSelection = cosineSimilarityRowVector
  // keep track of rating and similarity
  .map(function (similarity, index) {
    return { similarity: similarity, rating: ratingsRowVector[index] };
  })
  // only neighbors with a rating
  .filter(function (value) {
    return value.rating !== 0;
  })
  // most similar neighbors on top
  .sort(function (a, b) {
    return b.similarity - a.similarity;
  })
  // N neighbors
  .slice(0, N);

  var numerator = neighborSelection.reduce(function (result, value) {
    return result + value.similarity * value.rating;
  }, 0);

  var denominator = neighborSelection.reduce(function (result, value) {
    return result + _mathjs2.default.pow(value.similarity, 2);
  }, 0);

  return numerator / _mathjs2.default.sqrt(denominator);
}

function getUserRatingsRowVector(itemBasedMatrix, userIndex) {
  return itemBasedMatrix.map(function (itemRatings) {
    return itemRatings[userIndex];
  });
}

function getMovieRatingsRowVector(userBasedMatrix, movieIndex) {
  return userBasedMatrix.map(function (userRatings) {
    return userRatings[movieIndex];
  });
}

function meanNormalizeByRowVector(matrix) {
  return matrix.map(function (rowVector) {
    return rowVector.map(function (cell) {
      return cell !== 0 ? cell - getMean(rowVector) : cell;
    });
  });
}

function getMean(rowVector) {
  var valuesWithoutZeroes = rowVector.filter(function (cell) {
    return cell !== 0;
  });
  return valuesWithoutZeroes.length ? _mathjs2.default.mean(valuesWithoutZeroes) : 0;
}

function getMatrices(ratingsGroupedByUser, ratingsGroupedByMovie, uId) {
  var itemUser = Object.keys(ratingsGroupedByMovie).reduce(function (result, movieId) {
    var rowVector = Object.keys(ratingsGroupedByUser).map(function (userId, userIndex) {

      if (userId == uId) {
        result.userIndex = userIndex;
      }

      return getConditionalRating(ratingsGroupedByMovie, movieId, userId);
    });

    result.matrix.push(rowVector);
    result.movieIds.push(movieId);

    return result;
  }, { matrix: [], movieIds: [], userIndex: null });

  var userItem = Object.keys(ratingsGroupedByUser).reduce(function (result, userId, userIndex) {
    var rowVector = Object.keys(ratingsGroupedByMovie).map(function (movieId) {
      return getConditionalRating(ratingsGroupedByUser, userId, movieId);
    });

    result.matrix.push(rowVector);

    if (userId == uId) {
      result.userIndex = userIndex;
    }

    return result;
  }, { matrix: [], movieIds: Object.keys(ratingsGroupedByMovie), userIndex: null });

  return { itemUser: itemUser, userItem: userItem };
}

function getConditionalRating(value, primaryKey, secondaryKey) {
  if (!value[primaryKey]) {
    return 0;
  }

  if (!value[primaryKey][secondaryKey]) {
    return 0;
  }

  return value[primaryKey][secondaryKey].rating;
}
//# sourceMappingURL=collaborativeFiltering.js.map