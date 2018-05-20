'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.byId = byId;
exports.prepareDictionaries = prepareDictionaries;
exports.scaleFeatures = scaleFeatures;
exports.synthesizeFeatures = synthesizeFeatures;
exports.getCoefficients = getCoefficients;
exports.toFeaturizedMovies = toFeaturizedMovies;
exports.toFeaturizedRelease = toFeaturizedRelease;
exports.toFeaturizedAdult = toFeaturizedAdult;
exports.toFeaturizedHomepage = toFeaturizedHomepage;
exports.toFeaturizedLanguage = toFeaturizedLanguage;
exports.toFeaturizedFromDictionary = toFeaturizedFromDictionary;
exports.toFeaturizedNumber = toFeaturizedNumber;
exports.fromArrayToMap = fromArrayToMap;
exports.withTokenizedAndStemmed = withTokenizedAndStemmed;
exports.filterByThreshold = filterByThreshold;
exports.toDictionary = toDictionary;
exports.zip = zip;

var _natural = require('natural');

var _natural2 = _interopRequireDefault(_natural);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

_natural2.default.PorterStemmer.attach();

function prepareMovies(moviesMetaData, moviesKeywords) {
  console.log('Preparing Movies ... \n');

  // Pre-processing movies for unified data structure
  // E.g. get overview property into same shape as studio property
  console.log('(1) Zipping Movies');
  var MOVIES_IN_LIST = zip(moviesMetaData, moviesKeywords);

  MOVIES_IN_LIST = withTokenizedAndStemmed(MOVIES_IN_LIST, 'overview');
  MOVIES_IN_LIST = fromArrayToMap(MOVIES_IN_LIST, 'overview');

  // Keep a map of movies for later reference
  var MOVIES_BY_ID = MOVIES_IN_LIST.reduce(byId, {});

  console.log('(2) Creating Dictionaries');
  // Preparing dictionaries for feature extraction
  var DICTIONARIES = prepareDictionaries(MOVIES_IN_LIST);

  // Feature Extraction:
  // Map different types to numerical values (e.g. adult to 0 or 1)
  // Map dictionaries to partial feature vectors
  console.log('(3) Extracting Features');
  var X = MOVIES_IN_LIST.map(toFeaturizedMovies(DICTIONARIES));

  // Extract a couple of valuable coefficients
  // Can be used in a later stage (e.g. feature scaling)
  console.log('(4) Calculating Coefficients');

  var _getCoefficients = getCoefficients(X),
      means = _getCoefficients.means,
      ranges = _getCoefficients.ranges;

  console.log({ means: means, ranges: ranges });
  // Synthesize Features:
  // Missing features (such as budget, release, revenue)
  // can be synthesized with the mean of the features
  console.log('(5) Synthesizing Features');
  X = synthesizeFeatures(X, means, [0, 1, 2, 3, 4, 5, 6]);

  // Feature Scaling:
  // Normalize features based on mean and range vectors
  console.log('(6) Scaling Features \n');
  X = scaleFeatures(X, means, ranges);

  return {
    MOVIES_BY_ID: MOVIES_BY_ID,
    MOVIES_IN_LIST: MOVIES_IN_LIST,
    X: X
  };
}

function byId(moviesById, movie) {
  moviesById[movie.id] = movie;
  return moviesById;
}

function prepareDictionaries(movies) {
  var genresDictionary = toDictionary(movies, 'genres');
  var studioDictionary = toDictionary(movies, 'studio');
  var keywordsDictionary = toDictionary(movies, 'keywords');
  var overviewDictionary = toDictionary(movies, 'overview');

  // Customize the threshold to your own needs
  // Depending on threshold you get a different size of a feature vector for a movie
  // The following case attempts to keep feature vector small for computational efficiency
  genresDictionary = filterByThreshold(genresDictionary, 1);
  studioDictionary = filterByThreshold(studioDictionary, 75);
  keywordsDictionary = filterByThreshold(keywordsDictionary, 150);
  overviewDictionary = filterByThreshold(overviewDictionary, 750);

  return {
    genresDictionary: genresDictionary,
    studioDictionary: studioDictionary,
    keywordsDictionary: keywordsDictionary,
    overviewDictionary: overviewDictionary
  };
}

function scaleFeatures(X, means, ranges) {
  return X.map(function (row) {
    return row.map(function (feature, key) {
      return (feature - means[key]) / ranges[key];
    });
  });
};

function synthesizeFeatures(X, means, featureIndexes) {
  return X.map(function (row) {
    return row.map(function (feature, key) {
      if (featureIndexes.includes(key) && feature === 'undefined') {
        return means[key];
      } else {
        return feature;
      }
    });
  });
}

function getCoefficients(X) {
  var M = X.length;

  var initC = {
    sums: [],
    mins: [],
    maxs: []
  };

  var helperC = X.reduce(function (result, row) {
    if (row.includes('undefined')) {
      return result;
    }

    return {
      sums: row.map(function (feature, key) {
        if (result.sums[key]) {
          return result.sums[key] + feature;
        } else {
          return feature;
        }
      }),
      mins: row.map(function (feature, key) {
        if (result.mins[key] === 'undefined') {
          return result.mins[key];
        }

        if (result.mins[key] <= feature) {
          return result.mins[key];
        } else {
          return feature;
        }
      }),
      maxs: row.map(function (feature, key) {
        if (result.maxs[key] === 'undefined') {
          return result.maxs[key];
        }

        if (result.maxs[key] >= feature) {
          return result.maxs[key];
        } else {
          return feature;
        }
      })
    };
  }, initC);

  var means = helperC.sums.map(function (value) {
    return value / M;
  });
  var ranges = helperC.mins.map(function (value, key) {
    return helperC.maxs[key] - value;
  });

  return { ranges: ranges, means: means };
}

function toFeaturizedMovies(dictionaries) {
  return function toFeatureVector(movie) {
    var featureVector = [];

    featureVector.push(toFeaturizedNumber(movie, 'budget'));
    featureVector.push(toFeaturizedNumber(movie, 'popularity'));
    featureVector.push(toFeaturizedNumber(movie, 'revenue'));
    featureVector.push(toFeaturizedNumber(movie, 'runtime'));
    featureVector.push(toFeaturizedNumber(movie, 'voteAverage'));
    featureVector.push(toFeaturizedNumber(movie, 'voteCount'));
    featureVector.push(toFeaturizedRelease(movie));

    featureVector.push(toFeaturizedAdult(movie));
    featureVector.push(toFeaturizedHomepage(movie));
    featureVector.push(toFeaturizedLanguage(movie));

    featureVector.push.apply(featureVector, _toConsumableArray(toFeaturizedFromDictionary(movie, dictionaries.genresDictionary, 'genres')));
    featureVector.push.apply(featureVector, _toConsumableArray(toFeaturizedFromDictionary(movie, dictionaries.overviewDictionary, 'overview')));
    featureVector.push.apply(featureVector, _toConsumableArray(toFeaturizedFromDictionary(movie, dictionaries.studioDictionary, 'studio')));
    featureVector.push.apply(featureVector, _toConsumableArray(toFeaturizedFromDictionary(movie, dictionaries.keywordsDictionary, 'keywords')));

    return featureVector;
  };
}

function toFeaturizedRelease(movie) {
  return movie.release ? Number(movie.release.slice(0, 4)) : 'undefined';
}

function toFeaturizedAdult(movie) {
  return movie.adult === 'False' ? 0 : 1;
}

function toFeaturizedHomepage(movie) {
  return movie.homepage ? 0 : 1;
}

function toFeaturizedLanguage(movie) {
  return movie.language === 'en' ? 1 : 0;
}

function toFeaturizedFromDictionary(movie, dictionary, property) {
  // Fallback, because not all movies have associated keywords
  var propertyIds = (movie[property] || []).map(function (value) {
    return value.id;
  });
  var isIncluded = function isIncluded(value) {
    return propertyIds.includes(value.id) ? 1 : 0;
  };
  return dictionary.map(isIncluded);
}

function toFeaturizedNumber(movie, property) {
  var number = Number(movie[property]);

  // Fallback for NaN
  if (number > 0 || number === 0) {
    return number;
  } else {
    return 'undefined';
  }
}

// Refactored in favor of generic function

// function toFeaturizedGenres(movie, genresDictionary) {
//   const movieGenreIds = movie.genres.map(genre => genre.id);
//   const isGenre = (genre) => movieGenreIds.includes(genre.id) ? 1 : 0;
//   return genresDictionary.map(isGenre);
// }

// function getFeatureScalingCoefficients(movies, 'budget') {
//   const { range, mean } = movies.reduce((result, value, property) => {

//   }, {});

//   return { range, mean };
// }

// function toFeaturizedLanguageProperty(movie) {
//   return 0;
// }

function fromArrayToMap(array, property) {
  return array.map(function (value) {
    var transformed = value[property].map(function (value) {
      return {
        id: value,
        name: value
      };
    });

    return _extends({}, value, _defineProperty({}, property, transformed));
  });
}

function withTokenizedAndStemmed(array, property) {
  return array.map(function (value) {
    return _extends({}, value, _defineProperty({}, property, value[property].tokenizeAndStem()));
  });
}

function filterByThreshold(dictionary, threshold) {
  return Object.keys(dictionary).filter(function (key) {
    return dictionary[key].count > threshold;
  }).map(function (key) {
    return dictionary[key];
  });
}

function toDictionary(array, property) {
  var dictionary = {};

  array.forEach(function (value) {
    // Fallback for null value after refactoring
    (value[property] || []).forEach(function (innerValue) {
      if (!dictionary[innerValue.id]) {
        dictionary[innerValue.id] = _extends({}, innerValue, {
          count: 1
        });
      } else {
        dictionary[innerValue.id] = _extends({}, dictionary[innerValue.id], {
          count: dictionary[innerValue.id].count + 1
        });
      }
    });
  });

  return dictionary;
}

// Refactored in favor of toDictionary

// export function toGenresDictionary(movies) {
//   const genresDictionary = {};

//   movies.forEach((movie) => {
//     movie.genres.forEach((genre) => {
//       if (!genresDictionary[genre.id]) {
//         genresDictionary[genre.id] = {
//           name: genre.name,
//           count: 1,
//         };
//       } else {
//         genresDictionary[genre.id] = {
//           name: genre.name,
//           count: genresDictionary[genre.id].count + 1,
//         }
//       }
//     });
//   });

//   return genresDictionary;
// }

function zip(movies, keywords) {
  return Object.keys(movies).map(function (mId) {
    return _extends({}, movies[mId], keywords[mId]);
  });
}

exports.default = prepareMovies;
//# sourceMappingURL=movies.js.map