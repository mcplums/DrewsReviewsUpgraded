/*var express = require('express');
var app = express();

app.listen(3000, function() {
 console.log("Ebay on Ethereum server listening on port 3000");
});


app.get('/', function(req, res) {
 res.send("Hello, Ethereum!");
});
*/

var express = require('express');



var ecommerceStoreArtifact = require("../build/contracts/EcommerceStore.json");
var Web3 = require('web3')

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var ProductModel = require('./product');
mongoose.connect("mongodb://localhost:27017/ebay_dapp_upgrade");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'))

web3.eth.net.getId().then(function(networkId) {
 const deployedNetwork = ecommerceStoreArtifact.networks[networkId];
 instance = new web3.eth.Contract(
  ecommerceStoreArtifact.abi,
  deployedNetwork.address,
 );
 setupProductEventListner(instance);
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
 res.send("Hello, Ethereum!");
});

app.get('/products', function(req, res) {
 ProductModel.find({}, null, {sort: 'startTime'}, function(err, items) {
 	console.log(items.length);
 	res.send(items);
 });
});

function setupProductEventListner(i) {
 i.events.NewProduct({fromBlock: 0}, (error, event) => { 
  console.log(event.returnValues);
  saveProduct(event.returnValues);
 })
}

function saveProduct(product) {
 ProductModel.findOne({ 'blockchainId': product._productId }, function (err, dbProduct) {
 if (dbProduct != null) {
  return;
 }

 var p = new ProductModel({name: product._name, blockchainId: product._productId,
  category: product._category, ipfsImageHash: product._imageLink, ipfsDescHash: product._descLink,
  startTime: product._startTime, price: product._price, condition: product._productCondition
  });

 p.save(function(error) {
  if (error) {
  console.log(error);
  } else {
  ProductModel.countDocuments({}, function(err, count) {
   console.log("count is " + count);
  });
  }
 });
 })
}