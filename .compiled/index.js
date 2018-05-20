'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); // https://www.kaggle.com/rounakbanik/the-movies-dataset/data
// Exercise: Content-based - Include credits data with crew and cast too
// Exercise: Content-based - Make features weighted based on popularity or actors
// Exercise: Collaborative Filtering - Model-based CF with SVD

exports.addUserRating = addUserRating;
exports.sliceAndDice = sliceAndDice;
exports.softEval = softEval;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fastCsv = require('fast-csv');

var _fastCsv2 = _interopRequireDefault(_fastCsv);

var _ratings = require('./preparation/ratings');

var _ratings2 = _interopRequireDefault(_ratings);

var _movies = require('./preparation/movies');

var _movies2 = _interopRequireDefault(_movies);

var _linearRegression = require('./strategies/linearRegression');

var _linearRegression2 = _interopRequireDefault(_linearRegression);

var _contentBased = require('./strategies/contentBased');

var _contentBased2 = _interopRequireDefault(_contentBased);

var _collaborativeFiltering = require('./strategies/collaborativeFiltering');

var _common = require('./strategies/common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var MOVIES_META_DATA = {};
var MOVIES_KEYWORDS = {};
var RATINGS = [];

var ME_USER_ID = 0;

var moviesMetaDataPromise = new Promise(function (resolve) {
  return _fs2.default.createReadStream('./data/movies_metadata.csv').pipe((0, _fastCsv2.default)({ headers: true })).on('data', fromMetaDataFile).on('end', function () {
    return resolve(MOVIES_META_DATA);
  });
});

var moviesKeywordsPromise = new Promise(function (resolve) {
  return _fs2.default.createReadStream('./data/keywords.csv').pipe((0, _fastCsv2.default)({ headers: true })).on('data', fromKeywordsFile).on('end', function () {
    return resolve(MOVIES_KEYWORDS);
  });
});

var ratingsPromise = new Promise(function (resolve) {
  return _fs2.default.createReadStream('./data/ratings_small.csv').pipe((0, _fastCsv2.default)({ headers: true })).on('data', fromRatingsFile).on('end', function () {
    return resolve(RATINGS);
  });
});

function fromMetaDataFile(row) {
  MOVIES_META_DATA[row.id] = {
    id: row.id,
    adult: row.adult,
    budget: row.budget,
    genres: softEval(row.genres, []),
    homepage: row.homepage,
    language: row.original_language,
    title: row.original_title,
    overview: row.overview,
    popularity: row.popularity,
    studio: softEval(row.production_companies, []),
    release: row.release_date,
    revenue: row.revenue,
    runtime: row.runtime,
    voteAverage: row.vote_average,
    voteCount: row.vote_count
  };
}

function fromKeywordsFile(row) {
  MOVIES_KEYWORDS[row.id] = {
    keywords: softEval(row.keywords, [])
  };
}

function fromRatingsFile(row) {
  RATINGS.push(row);
}

console.log('Unloading data from files ... \n');

Promise.all([moviesMetaDataPromise, moviesKeywordsPromise, ratingsPromise]).then(init);

function init(_ref) {
  var _ref2 = _slicedToArray(_ref, 3),
      moviesMetaData = _ref2[0],
      moviesKeywords = _ref2[1],
      ratings = _ref2[2];

  /* ------------ */
  //  Preparation //
  /* -------------*/

  var _prepareMovies = (0, _movies2.default)(moviesMetaData, moviesKeywords),
      MOVIES_BY_ID = _prepareMovies.MOVIES_BY_ID,
      MOVIES_IN_LIST = _prepareMovies.MOVIES_IN_LIST,
      X = _prepareMovies.X;

  var ME_USER_RATINGS = [addUserRating(ME_USER_ID, 'Doctor Strange', '5.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Thor', '4.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Back to the Future Part II', '3.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Jurassic Park', '4.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Reservoir Dogs', '1.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Men in Black II', '3.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Captain America: The First Avenger', '5.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Sissi', '1.0', MOVIES_IN_LIST), addUserRating(ME_USER_ID, 'Titanic', '1.0', MOVIES_IN_LIST)];

  var _prepareRatings = (0, _ratings2.default)([].concat(ME_USER_RATINGS, _toConsumableArray(ratings))),
      ratingsGroupedByUser = _prepareRatings.ratingsGroupedByUser,
      ratingsGroupedByMovie = _prepareRatings.ratingsGroupedByMovie;

  /* ----------------------------- */
  //  Linear Regression Prediction //
  //        Gradient Descent       //
  /* ----------------------------- */

  console.log('\n');
  console.log('(A) Linear Regression Prediction ... \n');

  console.log('(1) Training \n');
  var meUserRatings = ratingsGroupedByUser[ME_USER_ID];
  var linearRegressionBasedRecommendation = (0, _linearRegression2.default)(X, MOVIES_IN_LIST, meUserRatings);

  console.log('(2) Prediction \n');
  console.log(sliceAndDice(linearRegressionBasedRecommendation, MOVIES_BY_ID, 10, true));

  /* ------------------------- */
  //  Content-Based Prediction //
  //  Cosine Similarity Matrix //
  /* ------------------------- */

  console.log('\n');
  console.log('(B) Content-Based Prediction ... \n');

  console.log('(1) Computing Cosine Similarity \n');
  var title = 'Batman Begins';
  var contentBasedRecommendation = (0, _contentBased2.default)(X, MOVIES_IN_LIST, title);

  console.log('(2) Prediction based on "' + title + '" \n');
  console.log(sliceAndDice(contentBasedRecommendation, MOVIES_BY_ID, 10, true));

  /* ----------------------------------- */
  //  Collaborative-Filtering Prediction //
  //             User-Based              //
  /* ----------------------------------- */

  console.log('\n');
  console.log('(C) Collaborative-Filtering (User-Based) Prediction ... \n');

  console.log('(1) Computing User-Based Cosine Similarity \n');

  var cfUserBasedRecommendation = (0, _collaborativeFiltering.predictWithCfUserBased)(ratingsGroupedByUser, ratingsGroupedByMovie, ME_USER_ID);

  console.log('(2) Prediction \n');
  console.log(sliceAndDice(cfUserBasedRecommendation, MOVIES_BY_ID, 10, true));

  /* ----------------------------------- */
  //  Collaborative-Filtering Prediction //
  //             Item-Based              //
  /* ----------------------------------- */

  console.log('\n');
  console.log('(C) Collaborative-Filtering (Item-Based) Prediction ... \n');

  console.log('(1) Computing Item-Based Cosine Similarity \n');

  var cfItemBasedRecommendation = (0, _collaborativeFiltering.predictWithCfItemBased)(ratingsGroupedByUser, ratingsGroupedByMovie, ME_USER_ID);

  console.log('(2) Prediction \n');
  console.log(sliceAndDice(cfItemBasedRecommendation, MOVIES_BY_ID, 10, true));

  console.log('\n');
  console.log('End ...');
}

// Utility

function addUserRating(userId, searchTitle, rating, MOVIES_IN_LIST) {
  var _getMovieIndexByTitle = (0, _common.getMovieIndexByTitle)(MOVIES_IN_LIST, searchTitle),
      id = _getMovieIndexByTitle.id,
      title = _getMovieIndexByTitle.title;

  return {
    userId: userId,
    rating: rating,
    movieId: id,
    title: title
  };
}

function sliceAndDice(recommendations, MOVIES_BY_ID, count, onlyTitle) {
  recommendations = recommendations.filter(function (recommendation) {
    return MOVIES_BY_ID[recommendation.movieId];
  });

  recommendations = onlyTitle ? recommendations.map(function (mr) {
    return { title: MOVIES_BY_ID[mr.movieId].title, score: mr.score };
  }) : recommendations.map(function (mr) {
    return { movie: MOVIES_BY_ID[mr.movieId], score: mr.score };
  });

  return recommendations.slice(0, count);
}

function softEval(string, escape) {
  if (!string) {
    return escape;
  }

  try {
    return eval(string);
  } catch (e) {
    return escape;
  }
}
//# sourceMappingURL=index.js.map