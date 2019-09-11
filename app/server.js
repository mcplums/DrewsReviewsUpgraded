var express = require('express');
var ecommerceStoreArtifact = require("../build/contracts/EcommerceStore.json");
var Web3 = require('web3')
// In Web3 1.x, only websocketprovider allows for listening to events and not httpprovider
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

app.listen(3000, function() {
 console.log("Ebay on Ethereum server listening on port 3000");
});

app.get('/', function(req, res) {
 res.send("Hello, Ethereum!");
});

function setupProductEventListner(i) {
 i.events.NewProduct({fromBlock: 0}, (error, event) => { 
  console.log(event.returnValues);
 })
}