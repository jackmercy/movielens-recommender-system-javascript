'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sortByScore = sortByScore;
exports.getCosineSimilarityRowVector = getCosineSimilarityRowVector;
exports.getMovieIndexByTitle = getMovieIndexByTitle;

var _computeCosineSimilarity = require('compute-cosine-similarity');

var _computeCosineSimilarity2 = _interopRequireDefault(_computeCosineSimilarity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sortByScore(recommendation) {
  return recommendation.sort(function (a, b) {
    return b.score - a.score;
  });
}

// X x 1 row vector based on similarities of movies
// 1 equals similar, -1 equals not similar, 0 equals orthogonal
// Whole matrix is too computational expensive for 45.000 movies
// https://en.wikipedia.org/wiki/Cosine_similarity
function getCosineSimilarityRowVector(matrix, index) {
  return matrix.map(function (rowRelative, i) {
    return (0, _computeCosineSimilarity2.default)(matrix[index], matrix[i]);
  });
}

function getMovieIndexByTitle(MOVIES_IN_LIST, query) {
  var index = MOVIES_IN_LIST.map(function (movie) {
    return movie.title;
  }).indexOf(query);

  if (!index) {
    throw new Error('Movie not found');
  }

  var _MOVIES_IN_LIST$index = MOVIES_IN_LIST[index],
      title = _MOVIES_IN_LIST$index.title,
      id = _MOVIES_IN_LIST$index.id;

  return { index: index, title: title, id: id };
}
//# sourceMappingURL=common.js.map