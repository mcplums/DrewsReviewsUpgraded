import Web3 from "web3";
import "./app.css";
import DrewsReviewsArtifact from "../../build/contracts/DrewsReviews.json";

const App = {
 web3: null,
 account: null,
 instance: null,

 start: async function() {
  const { web3 } = this;

  try {
   // get contract instance
   const networkId = await web3.eth.net.getId();
   const deployedNetwork = DrewsReviewsArtifact.networks[networkId];
   this.instance = new web3.eth.Contract(
    DrewsReviewsArtifact.abi,
    deployedNetwork.address,
   );

   // get accounts
   const accounts = await web3.eth.getAccounts();
   this.account = accounts[0];

   this.renderHome();

   $("#add-review").submit(function(event) {
  const req = $("#add-review").serialize();
  let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
  let decodedParams = {}
  Object.keys(params).forEach(function(v) {
   decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
  });
  console.log(decodedParams);
  App.addReview(decodedParams);
  event.preventDefault();
 });

  } catch (error) {
   console.error("Could not connect to contract or chain.");
  }
 },

 addReview: async function(review) {
  var ts = Math.round((new Date()).getTime() / 1000);
  console.log("gets this far")
  const { addReview } = this.instance.methods;
  console.log("stfu")
  
  addReview(review["film-name"], review["review-text"], ts, review["film-score"], review["poster-source"]).send({from: this.account, gas: 4700000});
  console.log("stfu2")
 },

 saveProduct: async function(product) {
  const { addProductToStore } = this.instance.methods;
  
  addProductToStore(product["product-name"], product["product-category"], "imageLink",
      "descLink", Date.parse(product["product-start-time"]) / 1000,
     this.web3.utils.toWei(product["product-price"], 'ether'), product["product-condition"]).send({from: this.account, gas: 4700000});
 },

// legacy
 renderHome: async function() {
  const { reviewIndex } = this.instance.methods;
  var count = await reviewIndex().call();
  for(var i=1; i<= count; i++) {
   this.renderReviews(i);
  }
 },

// new
 //  renderStore: async function() {
 // var renderProduct = this.renderProduct;
 // $.ajax({
 //  url: "http://localhost:3000/products",
 //  type: 'get',
 //  contentType: 'application/json; charset=utf-8',
 //  data: {}
 // }).done(function(data) {
 //  console.log(data);
 //  while(data.length > 0) {
 //   let chunks = data.splice(0, 4);
 //   chunks.forEach(function(value) {
 //    renderProduct(value);
 //   });
 //  }
 // });
 // },

// legacy
 renderReviews: async function(index) {
  const { getReview } = this.instance.methods;
  var q = await getReview(index).call()
  console.log(q)
let node = $("<div id='review'>");
node.append("<div id='poster'><img style='width:150px' src=posters/" + q[4] + "></div>");
node.append("<div id='rightside'><span id='title'>" + q[0] + "<img src='images/" + q[3] + ".png'/></span><span id='reviewtext'>" + q[1] + "</span></div>");
$("#reviews").append(node);
 },

 //new
 //  renderProduct: async function(product) {
 //  console.log(product);
 //  let node = $("<div/>");
 //  node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
 //  node.append("<img src='stfu' />");
 //  node.append("<div class='title'>" + product.name + "");
 //  node.append("<div> Price: " + displayPrice(product.price.toString()) + "");
 //  node.append("<a href='product.html?id=" + product.blockchainId + "'>Details");
 //   $("#product-list").append(node);
 // },

};

// function displayPrice(amt) {
//  return "Ξ" + App.web3.utils.fromWei(amt, 'ether');
// }

window.App = App;

window.addEventListener("load", function() {
 if (window.ethereum) {
  // use MetaMask's provider
  App.web3 = new Web3(window.ethereum);
  window.ethereum.enable(); // get permission to access accounts
 } else {
  console.warn(
   "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",
  );
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  App.web3 = new Web3(
   new Web3.providers.HttpProvider("http://127.0.0.1:9545"),
  );
 }

 App.start();
});
