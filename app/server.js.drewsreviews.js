console.log("test");

var drewsreviews_artifacts = require('./build/contracts/DrewsReviews.json')
var contract = require('truffle-contract')
var Web3 = require('web3')
var provider = new Web3.providers.HttpProvider("http://localhost:8545");
var DrewsReviews = contract(drewsreviews_artifacts);
DrewsReviews.setProvider(provider);
var express = require('express');
var app = express();



app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var collections = require('./review');
mongoose.connect("mongodb://localhost:27017/drews_reviews");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.listen(3000, function() {
	console.log("STFU or i will kick you in the nuts");
});

app.get('/', function(req, res) {
	res.send("Hello, Dickhead!");
});

setupReviewEventListener();
setupUserReviewEventListener();
setupEditReviewEventListener();
setupDeleteUserReviewEventListener();

function  setupUserReviewEventListener() {
//console.log("starting User Review Event Listener");
  var userReviewEvent;
  DrewsReviews.deployed().then(function(i) {
    userReviewEvent = i.newUserReview({fromBlock: 0, toBlock: 'latest'})
    userReviewEvent.watch(function(err, result) {
      if (err) {
        console.log(err)
        return;
      }
      console.log(result.args);
      saveUserReview(result.args);
    });
  });
}

function saveUserReview(review) {

  console.log("saveUserReview is being called");

    collections.ReviewModel.update(
    	{ 'blockchainId': review._filmId.toNumber() }, 
    	{ $inc: { "userReviewCount": 1 } }, 
    	function(err, res) {
    		if (err) throw err;
    	});

    //Add actual userreview to thing
    collections.userReviewModel.findOne({ 'userReviewId': review._userReviewId.toNumber() }, function (err, dbProduct) {

    	if (dbProduct != null) {
    		//console.log("Already in the database");
    		return;
    	}

    	var p = new collections.userReviewModel({filmId: review._filmId, userReviewId: review._userReviewId, userName: review._userName, reviewText: review._review, score: review._score, deleted: 0
    	});

    	p.save(function(error) {
    		if (error) {
    			console.log(error);
    		} else {
    			collections.userReviewModel.count({}, function(err, count) {
    				if (err) throw err;
    				//console.log("User Review count is " + count);
    			});
    		}
    	});
    })
}

function  setupReviewEventListener() {
	console.log("starting Review Event Listener");
	var reviewEvent;
	DrewsReviews.deployed().then(function(i) {
		reviewEvent = i.newReview({fromBlock: 0, toBlock: 'latest'})
		reviewEvent.watch(function(err, result) {
			if (err) {
				console.log(err)
				return;
			}
			console.log(result.args);
			saveReview(result.args);
		});
	});
}

function saveReview(review) {

	console.log("Starting saveReview");
	//ProductModel is the scheme, as defined by product.js (which is required for this file, above) it searches the database for the id,it should return null
  collections.ReviewModel.findOne({ 'blockchainId': review._filmId.toNumber() }, function (err, dbProduct) {
  	//this is a strange way of doing if else, you just put a return in the if, then you don't need to bother with the else
    if (dbProduct != null) {
      return;
    }

    var p = new collections.ReviewModel({name: review._name, blockchainId: review._filmId,
      reviewText: review._review, score: review._score, posterSource: review._imageSource, userReviewCount: 0, deleted: 0
    });

    //p.save is the magic here,the poduct as defined above is added to mongodb
    p.save(function(error) {
      if (error) {
        console.log(error);
      } else {
      	//ProductModel.count gets the total number of products in the database
        collections.ReviewModel.count({}, function(err, count) {
         console.log("Main Review count is " + count);
       });
      }
    });
  })
}

function  setupEditReviewEventListener() {
  //console.log("starting Edit Review Event Listener");
  var reviewEvent;
  DrewsReviews.deployed().then(function(i) {
    reviewEvent = i.editedReview({fromBlock: 0, toBlock: 'latest'})
    reviewEvent.watch(function(err, result) {
      if (err) {
        console.log(err)
        return;
      }
      //console.log(result.args);
      editReview(result.args);
    });
  });
}

function editReview(review) {

  //console.log("Starting editReview");
  //ProductModel is the scheme, as defined by product.js (which is required for this file, above) it searches the database for the id,it should return null
  collections.ReviewModel.findOne({ 'blockchainId': review._filmId.toNumber() }, function (err, dbProduct) {
    //this is a strange way of doing if else, you just put a return in the if, then you don't need to bother with the else
    if (dbProduct == null) {
      return;
    }

      collections.ReviewModel.update(
      { 'blockchainId': review._filmId.toNumber() }, 
      { $set: { 
        'name':  review._name,
        'reviewText': review._review, 
        'score': review._score, 
        'posterSource': review._imageSource ,
        'deleted': review._deleted
        } 
      }, 
      function(err, res) {
        if (err) throw err;
      });

  })
}

function  setupDeleteUserReviewEventListener() {
  //console.log("starting Delete User Review Event Listener");
  var reviewEvent;
  DrewsReviews.deployed().then(function(i) {
    reviewEvent = i.editedUserReview({fromBlock: 0, toBlock: 'latest'})
    reviewEvent.watch(function(err, result) {
      if (err) {
        console.log(err)
        return;
      }
      //console.log("output:", result.args);
      deleteUserReview(result.args);
    });
  });
}

function deleteUserReview(review) {

    collections.ReviewModel.update(
      { 'blockchainId': review._filmId.toNumber() }, 
      { $inc: { "userReviewCount": -1 } }, 
      function(err, res) {
        if (err) throw err;
      });

  collections.userReviewModel.findOne({ 'userReviewId': review._userReviewId.toNumber() }, function (err, dbProduct) {
    //this is a strange way of doing if else, you just put a return in the if, then you don't need to bother with the else
    if (dbProduct == null) {
      return;
    }

    if (review._deleted == null) {
      return;
    }

      collections.userReviewModel.update(
      { 'userReviewId': review._userReviewId.toNumber() }, 
      { $set: { 
        'deleted': 1
        } 
      }, 
      function(err, res) {
        if (err) throw err;
      });

  })
}

//This is the bit that allows the front end to call the database. It is largely copy and pasted from zastrin. 
app.get('/reviews', function(req, res) {

 var query = {};
 if (req.query.blockchainId !== undefined) {
  query['blockchainId'] = {$eq: req.query.blockchainId};
 }

 collections.ReviewModel.find({}, null, {sort: {blockchainId: -1}}, function(err, items) {
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

