var express = require('express');
var DrewsReviewsArtifact = require("../build/contracts/DrewsReviews.json");
var Web3 = require('web3')

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var collections = require('./review');
mongoose.connect("mongodb://localhost:27017/drews_reviews");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'))

// web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/d460ac4e71f24d869c8b75119ebe4213'))

// web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/v3/7bbfee0b81e8407b93e548b33cfc665e'))

web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws'))


web3.eth.net.getId().then(function(networkId) {
    const deployedNetwork = DrewsReviewsArtifact.networks[networkId];
    instance = new web3.eth.Contract(
        DrewsReviewsArtifact.abi,
        deployedNetwork.address,
    );
    setupReviewEventListener(instance);
    setupUserReviewEventListener(instance);
})

const https = require("https"),
  fs = require("fs"),
  helmet = require("helmet");

const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/drewsreviews.co.uk/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/drewsreviews.co.uk/fullchain.pem")
};


var app = express();

app.use(helmet());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

https.createServer(options, app).listen(3000, function() {
    console.log("Ebay on Ethereum server listening on port 3000");
});

// https.createServer(options, app).listen(3000);

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

app.get('/userreviews', function(req, res) {

 var query = {};
 if (req.query.filmId !== undefined) {
  query['filmId'] = {$eq: req.query.filmId};
 }

  collections.userReviewModel.find(query, null, {sort: 'userReviewId'}, function(err, items) {
    /*console.log(items.length);*/
    res.send(items);
  });
});

app.get('/header', function(req, res) {
	collections.userReviewModel.count( {} , function(err, count) {		
    //console.log("count:", count);
    if (count > 0 ) {
    		 console.log('A page is being loaded');
      collections.userReviewModel.findOne({ 'userReviewId': count }, function (err, dbProduct) {
        //Below is the hack where I look into the other database for the film name and add it to reviewText variable and pass it to the front end. 

        //console.log("first answer:",dbProduct);
       collections.ReviewModel.findOne({ 'blockchainId': dbProduct.filmId}, function(err, items) {
        //console.log("second answer:",items);
        dbProduct.reviewText = items.name;

        res.send(dbProduct);

      });

     });
    }
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

function setupUserReviewEventListener(i) {
    i.events.newUserReview({
        fromBlock: 0
    }, (error, event) => {
        console.log(event.returnValues);
        saveUserReview(event.returnValues);
    })
}


function saveReview(review) {
    collections.ReviewModel.findOne({
        'blockchainId': review._filmId
    }, function(err, dbProduct) {

        if (dbProduct != null) {
        	console.log("Review with ID " + review._filmId + "Already in the database");
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

function saveUserReview(review) {

  console.log("saveUserReview is being called");

    collections.ReviewModel.update(
    	{ 'blockchainId': review._filmId }, 
    	{ $inc: { "userReviewCount": 1 } }, 
    	function(err, res) {
    		if (err) throw err;
    	});

    //Add actual userreview to thing
    collections.userReviewModel.findOne({ 'userReviewId': review._userReviewId }, function (err, dbProduct) {

    	if (dbProduct != null) {
    		console.log("User review with ID " + review._userReviewId + "Already in the database");
    		return;
    	}

    	var p = new collections.userReviewModel({filmId: review._filmId, userReviewId: review._userReviewId, userName: review._userName, reviewText: review._review, score: review._score, deleted: 0
    	});

    	p.save(function(error) {
    		if (error) {
    			console.log(error);
    		} else {
    			collections.userReviewModel.countDocuments({}, function(err, count) {
    				if (err) throw err;
    				console.log("User Review count is " + count);
    			});
    		}
    	});
    })
}
