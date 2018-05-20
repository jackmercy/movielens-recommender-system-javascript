'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRatingCountsByUser = getRatingCountsByUser;
exports.getRatingCountsByMovie = getRatingCountsByMovie;
exports.getRatingsGroupedByMovie = getRatingsGroupedByMovie;
exports.getRatingsGroupedByUser = getRatingsGroupedByUser;
function prepareRatings(ratings) {
  console.log('Preparing Ratings ... \n');

  var ratingCountsByMovie = getRatingCountsByMovie(ratings);
  var ratingCountsByUser = getRatingCountsByUser(ratings);

  var POPULARITY_TRESHOLD = {
    movieRatings: 50, // be careful not to exclude the movies of your focused user
    userRatings: 5 // be careful not to exclude your focused user
  };

  console.log('(1) Group ratings by user');
  var ratingsGroupedByUser = getRatingsGroupedByUser(ratings, ratingCountsByMovie, ratingCountsByUser, POPULARITY_TRESHOLD);

  console.log('(2) Group ratings by movie \n');
  var ratingsGroupedByMovie = getRatingsGroupedByMovie(ratings, ratingCountsByMovie, ratingCountsByUser, POPULARITY_TRESHOLD);

  return { ratingsGroupedByUser: ratingsGroupedByUser, ratingsGroupedByMovie: ratingsGroupedByMovie };
}

function getRatingCountsByUser(ratings) {
  return ratings.reduce(function (result, value) {
    var userId = value.userId,
        rating = value.rating;


    if (!result[userId]) {
      result[userId] = 0;
    }

    result[userId]++;

    return result;
  }, {});
}

function getRatingCountsByMovie(ratings) {
  return ratings.reduce(function (result, value) {
    var movieId = value.movieId,
        rating = value.rating;


    if (!result[movieId]) {
      result[movieId] = 0;
    }

    result[movieId]++;

    return result;
  }, {});
}

function getRatingsGroupedByMovie(ratings, ratingCountsByMovie, ratingCountsByUser, popularityThreshold) {
  var movieRatings = popularityThreshold.movieRatings,
      userRatings = popularityThreshold.userRatings;


  return ratings.reduce(function (result, value) {
    var userId = value.userId,
        movieId = value.movieId,
        rating = value.rating,
        timestamp = value.timestamp;


    if (ratingCountsByMovie[movieId] < movieRatings || ratingCountsByUser[userId] < userRatings) {
      return result;
    }

    if (!result[movieId]) {
      result[movieId] = {};
    }

    result[movieId][userId] = { rating: Number(rating), timestamp: timestamp };

    return result;
  }, {});
}

function getRatingsGroupedByUser(ratings, ratingCounts, popularity) {
  return ratings.reduce(function (result, value) {
    var userId = value.userId,
        movieId = value.movieId,
        rating = value.rating;


    if (ratingCounts[movieId] < popularity) {
      return result;
    }

    if (!result[userId]) {
      result[userId] = {};
    }

    result[userId][movieId] = { rating: Number(rating) };

    return result;
  }, {});
}

exports.default = prepareRatings;
//# sourceMappingURL=ratings.js.map