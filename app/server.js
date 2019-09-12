var express = require('express');
var DrewsReviewsArtifact = require("../build/contracts/DrewsReviews.json");
var Web3 = require('web3')

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var collections = require('./review');
mongoose.connect("mongodb://localhost:27017/drews_reviews");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'))

web3.eth.net.getId().then(function(networkId) {
    const deployedNetwork = DrewsReviewsArtifact.networks[networkId];
    instance = new web3.eth.Contract(
        DrewsReviewsArtifact.abi,
        deployedNetwork.address,
    );
    setupReviewEventListener(instance);
})

var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(3000, function() {
    console.log("Ebay on Ethereum server listening on port 3000");
});

app.get('/', function(req, res) {
    res.send("Hello, Dickhead!");
});

app.get('/reviews', function(req, res) {

 var query = {};
 if (req.query.blockchainId !== undefined) {
  query['blockchainId'] = {$eq: req.query.blockchainId};
 }

 collections.ReviewModel.find({}, null, {sort: {blockchainId: -1}}, function(err, items) {
    res.send(items);
  });
});

function setupReviewEventListener(i) {
    i.events.newReview({
        fromBlock: 0
    }, (error, event) => {
        console.log(event.returnValues);
        saveReview(event.returnValues);
    })
}

function saveReview(review) {
    collections.ReviewModel.findOne({
        'blockchainId': review._filmId
    }, function(err, dbProduct) {

        if (dbProduct != null) {
            return;
        }

        var p = new collections.ReviewModel({
            name: review._name,
            blockchainId: review._filmId,
            reviewText: review._review,
            score: review._score,
            posterSource: review._imageSource,
            userReviewCount: 0,
            deleted: 0
        });

        p.save(function(error) {
            if (error) {
                console.log(error);
            } else {
                collections.ReviewModel.countDocuments({}, function(err, count) {
                    console.log("count is " + count);
                });
            }
        });
    })
}