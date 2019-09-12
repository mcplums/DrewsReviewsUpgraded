var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

var Schema = mongoose.Schema;

var ReviewSchema = new Schema({
 blockchainId: Number,
 name: String,
 reviewText: String,
 score: Number,
 posterSource: String, 
 userReviewCount: Number,
 deleted: Number,
});

var userReviewSchema = new Schema({
 filmId: Number,
 userReviewId: Number,
 userName: String,
 reviewText: String,
 score: Number,
 deleted: Number,
});

var ReviewModel = mongoose.model('ReviewModel', ReviewSchema);
var userReviewModel = mongoose.model('userReviewModel', userReviewSchema);

module.exports = 
{
 ReviewModel: ReviewModel,
 userReviewModel: userReviewModel
};
