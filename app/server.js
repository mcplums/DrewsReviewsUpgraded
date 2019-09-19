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

// web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/ws/v3/d460ac4e71f24d869c8b75119ebe4213'))

web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/d460ac4e71f24d869c8b75119ebe4213'))

// web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws'))


web3.eth.net.getId().then(function(networkId) {
    const deployedNetwork = DrewsReviewsArtifact.networks[networkId];
    instance = new web3.eth.Contract(
        DrewsReviewsArtifact.abi,
        deployedNetwork.address,
    );

 //IMPORTANT: WHEN YOU DELETE THE DB AND RE-RUN FROM BLOCKCHAIN, YOU NEED TO COMMENT OUT ALL BUT THE SETUP REVIEW FIRST, THEN JUST USER REVIEW, THEN THE OTHER TWO, COS OF THE INCREMENTING/DECREMENTING DOESNT WORK PROPERLY OTHERWISE SINCE IT DOESNT RUN THEM ONE AFTER THE OTHER
    setupReviewEventListener(instance);
    setupUserReviewEventListener(instance);
    setupEditReviewEventListener(instance);
    setupDeleteUserReviewEventListener(instance);
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


app.get('/', function(req, res) {
    res.send("Hello, Dickhead!");
});

app.get('/reviews', function(req, res) {
	console.log('Home page is being loaded');

    var query = {};
    if (req.query.blockchainId !== undefined) {
        query['blockchainId'] = {
            $eq: req.query.blockchainId
        };
    }

    collections.ReviewModel.find({}, null, {
        sort: {
            blockchainId: -1
        }
    }, function(err, items) {
        res.send(items);
    });
});

app.get('/singlereview', function(req, res) {

 var query = {};
 if (req.query.blockchainId !== undefined) {
  query['blockchainId'] = {$eq: req.query.blockchainId};
 }

  collections.ReviewModel.find(query, null, {sort: 'blockchainId'}, function(err, items) {
    /*console.log(items.length);*/
    res.send(items);
  });
});

app.get('/userreviews', function(req, res) {
	console.log('User reviews page is being loaded');

    var query = {};
    if (req.query.filmId !== undefined) {
        query['filmId'] = {
            $eq: req.query.filmId
        };
    }

    collections.userReviewModel.find(query, null, {
        sort: 'userReviewId'
    }, function(err, items) {
        /*console.log(items.length);*/
        res.send(items);
    });
});

app.get('/header', function(req, res) {
    collections.userReviewModel.count({}, function(err, count) {
        //console.log("count:", count);
        if (count > 0) {
            console.log('A page is being loaded');
            collections.userReviewModel.findOne({
                'userReviewId': count
            }, function(err, dbProduct) {
                //Below is the hack where I look into the other database for the film name and add it to reviewText variable and pass it to the front end. 

                //console.log("first answer:",dbProduct);
                collections.ReviewModel.findOne({
                    'blockchainId': dbProduct.filmId
                }, function(err, items) {
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
        // console.log(event.returnValues);
        saveReview(event.returnValues);
    })
}

function setupUserReviewEventListener(i) {
    i.events.newUserReview({
        fromBlock: 0
    }, (error, event) => {
        // console.log(event.returnValues);
        saveUserReview(event.returnValues);
    })
}

function setupEditReviewEventListener(i) {
    i.events.editedReview({
        fromBlock: 0
    }, (error, event) => {
        // console.log(event.returnValues);
        editReview(event.returnValues);
    })
}

function setupDeleteUserReviewEventListener(i) {
    i.events.editedUserReview({
        fromBlock: 0
    }, (error, event) => {
        // console.log(event.returnValues);
        deleteUserReview(event.returnValues);
    })
}



function saveReview(review) {
    collections.ReviewModel.findOne({
        'blockchainId': review._filmId
    }, function(err, dbProduct) {

        if (dbProduct != null) {
            // console.log("Review with ID " + review._filmId + " already in the database");
            return;
        }

        console.log("New review with id: " + review._filmId+' name: '+review._name+' reviewText: '+review._review+' score: '+review._score+' posterSource: '+review._imageSource)

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
                    // console.log("count is " + count);
                });
            }
        });
    })
}

function saveUserReview(review) {

    // console.log("saveUserReview is being called");

    //Add actual userreview to thing
    collections.userReviewModel.findOne({
        'userReviewId': review._userReviewId
    }, function(err, dbProduct) {

        if (dbProduct != null) {
            // console.log("User review with ID " + review._userReviewId + " already in the database");
            return;
        }


        console.log("New user review with id: " + review._userReviewId + ' filmId: ' + review._filmId + ' userReviewId: ' + review._userReviewId + ' userName: '+review._userName+' reviewText: '+ review._review+' score: ' + review._score); 


        collections.ReviewModel.update({
                'blockchainId': review._filmId
            }, {
                $inc: {
                    "userReviewCount": 1
                }
            },
            function(err, res) {
                // console.log("New user review with id: " + review._userReviewId);
                // console.log("INCREMENT RESULT: film id " + review._filmId);
                if (err) throw err;

            });

        var p = new collections.userReviewModel({
            filmId: review._filmId,
            userReviewId: review._userReviewId,
            userName: review._userName,
            reviewText: review._review,
            score: review._score,
            deleted: 0
        });

        p.save(function(error) {
            if (error) {
                console.log(error);
            } else {
                collections.userReviewModel.countDocuments({}, function(err, count) {
                    if (err) throw err;
                    // console.log("User Review count is " + count);
                });
            }
        });
    })
}

function editReview(review) {

    // console.log("Starting editReview");
    //ProductModel is the scheme, as defined by product.js (which is required for this file, above) it searches the database for the id,it should return null
    collections.ReviewModel.findOne({
        'blockchainId': review._filmId
    }, function(err, dbProduct) {
        //this is a strange way of doing if else, you just put a return in the if, then you don't need to bother with the else
        if (dbProduct == null) {
            return;
        }

        console.log("New(or old- no way to tell) edited review with id: " + review._filmId + ' name: ' + review._name+ ' reviewText: '+ review._review + ' score: '+ review._score + ' posterSource: '+ review._imageSource + ' deleted: ' + review._deleted);

        collections.ReviewModel.update({
                'blockchainId': review._filmId
            }, {
                $set: {
                    'name': review._name,
                    'reviewText': review._review,
                    'score': review._score,
                    'posterSource': review._imageSource,
                    'deleted': review._deleted
                }
            },
            function(err, res) {
                if (err) throw err;
            });

    })
}

function deleteUserReview(review) {

    // console.log("Starting deleteUserReview");
    // console.log("Deleted user review: " + review._userReviewId);
    id = parseInt(review._userReviewId, 10)
    collections.userReviewModel.findOne({
        'userReviewId': review._userReviewId
    }, function(err, dbProduct) {

        if (dbProduct == null) {
            // console.log("we arent finding this user review id to delete" + review._userReviewId)
            return;
        }

        if (review._deleted == null) {
            return;
        }

        // console.log("New user review to delete: " + review._userReviewId + " and current delete flag is " + dbProduct.deleted);

        if (dbProduct.deleted == 0) {
            collections.ReviewModel.update({
                    'blockchainId': review._filmId
                }, {
                    $inc: {
                        "userReviewCount": -1
                    }
                },
                function(err, res) {
                    console.log("New user review to delete with id: " + review._userReviewId);
                    console.log("DECREMENT RESULT: film id" + review._filmId);
                    if (err) throw err;

                });

            collections.userReviewModel.update({
                    'userReviewId': review._userReviewId
                }, {
                    $set: {
                        'deleted': 1
                    }
                },
                function(err, res) {
                    if (err) throw err;
                });
        }

    })
}