'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gradientDescent = gradientDescent;
exports.getPredictedRatings = getPredictedRatings;
exports.computeCost = computeCost;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _common = require('./common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LEARNING_RATE = 0.03;
var LEARNING_ITERATIONS = 750;

function predictWithLinearRegression(X, MOVIES_IN_LIST, ratings) {
  // Add intercept term
  var ones = Array(X.length).fill().map(function (v, i) {
    return [1];
  });
  X = _mathjs2.default.concat(ones, X);

  var init = {
    training: {
      X: [],
      y: []
    },
    // Not a real test set
    // Because of missing labels
    test: {
      X: [],
      references: []
    }
  };

  // Prepare training and test set

  var _MOVIES_IN_LIST$reduc = MOVIES_IN_LIST.reduce(function (result, movie, key) {
    var hasRatedMovie = !!ratings[movie.id];
    if (hasRatedMovie) {
      result.training.X.push(X[key]);
      result.training.y.push([ratings[movie.id].rating]);
    } else {
      result.test.X.push(X[key]);
      // Keep a reference to map the predictions later to movies
      result.test.references.push(movie.id);
    }

    return result;
  }, init),
      training = _MOVIES_IN_LIST$reduc.training,
      test = _MOVIES_IN_LIST$reduc.test;

  // Train theta paramaters


  var m = training.X[0].length;
  var theta = Array(m).fill().map(function (v, i) {
    return [0];
  });
  theta = gradientDescent(training.X, training.y, theta, LEARNING_RATE, LEARNING_ITERATIONS);

  // Predict all ratings
  var predictedRatings = getPredictedRatings(theta, test.X);

  // Enrich the vector to convey all information
  // Use references from before which we kept track of
  predictedRatings = predictedRatings.map(function (rating, key) {
    return {
      score: rating[0],
      movieId: test.references[key]
    };
  });

  return (0, _common.sortByScore)(predictedRatings);
}

function gradientDescent(X, y, theta, ALPHA, ITERATIONS) {
  var m = y.length;

  for (var i = 0; i < ITERATIONS; i++) {
    theta = _mathjs2.default.eval('theta - ALPHA / m * ((X * theta - y)\' * X)\'', {
      theta: theta,
      ALPHA: ALPHA,
      m: m,
      X: X,
      y: y
    });

    if (i % 50 === 0) {
      var cost = computeCost(X, y, theta);
      console.log('Cost after ' + i + ' of trained ' + ITERATIONS + ': ' + cost);
    }
  }
  console.log('\n');

  return theta;
}

function getPredictedRatings(theta, X) {
  return _mathjs2.default.eval('X * theta', {
    theta: theta,
    X: X
  });
}

function computeCost(X, y, theta) {
  var m = y.length;

  var predictions = _mathjs2.default.eval('X * theta', {
    X: X,
    theta: theta
  });

  var sqrErrors = _mathjs2.default.eval('(predictions - y).^2', {
    predictions: predictions,
    y: y
  });

  var J = _mathjs2.default.eval('1 / (2 * m) * sum(sqrErrors)', {
    m: m,
    sqrErrors: sqrErrors
  });

  return J;
}

exports.default = predictWithLinearRegression;
//# sourceMappingURL=linearRegression.js.map