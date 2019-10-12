import Web3 from "web3";
import "./app.css";
import DrewsReviewsArtifact from "../../build/contracts/DrewsReviews.json";


var reader;
var mongoReviewsUrl;
var mongoUserReviewsUrl;
var mongoHeaderUrl;
var mongoSingleReviewrUrl;
var ignoreMongo = 0;
var dev = 0;

if (dev == 1) {
    mongoReviewsUrl = "http://localhost:3000/reviews";
    mongoUserReviewsUrl = "http://localhost:3000/userreviews";
    mongoHeaderUrl = "http://localhost:3000/header";
    mongoSingleReviewrUrl = "http://localhost:3000/singlereview";
} else {
    mongoReviewsUrl = "https://www.drewsreviews.co.uk:3000/reviews";
    mongoUserReviewsUrl = "https://www.drewsreviews.co.uk:3000/userreviews";
    mongoHeaderUrl = "https://www.drewsreviews.co.uk:3000/header";
    mongoSingleReviewrUrl = "https://www.drewsreviews.co.uk:3000/singlereview";

}


const App = {
    web3: null,
    account: null,
    instance: null,

    start: async function() {
        const {
            web3
        } = this;

        try {
            // get contract instance

            try {
                const networkId = await web3.eth.net.getId();
                const deployedNetwork = DrewsReviewsArtifact.networks[networkId];
                this.instance = new web3.eth.Contract(
                    DrewsReviewsArtifact.abi,
                    deployedNetwork.address,
                );

                // get accounts
                const accounts = await web3.eth.getAccounts();
                this.account = accounts[0];
                } catch (error) {
                    console.error("Could not connect to contract or chain1.");
                }

            this.renderHeader();

            if ($("#user-reviews").length > 0) {
                //product page always has an id, this is how it gets access to it
                let filmId = new URLSearchParams(window.location.search).get('id');
                console.log("STFU");
                this.renderSingleReview(filmId)
                this.renderUserReviews(filmId)
            } else {
                this.renderHome();
            }

            $("#add-review").submit(function(event) {
                const req = $("#add-review").serialize();
                let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                let decodedParams = {}
                Object.keys(params).forEach(function(v) {
                    decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
                });
                console.log(decodedParams);
                App.addReview(decodedParams);
                event.preventDefault();
            });

            $("#edit-review").submit(function(event) {
                const req = $("#edit-review").serialize();
                let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                let decodedParams = {}
                Object.keys(params).forEach(function(v) {
                    decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
                });
                console.log(decodedParams);
                App.editReview(decodedParams);
                event.preventDefault();
            });

            $("#delete-user-review").submit(function(event) {
                const req = $("#delete-user-review").serialize();
                let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                let decodedParams = {}
                Object.keys(params).forEach(function(v) {
                    decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
                });
                console.log(decodedParams);
                App.deleteUserReview(decodedParams);
                event.preventDefault();
            });

            $("#add-user-review").submit(function(event) {
                //Below gets the info that is submitted by the form, into the variable req
                const req = $("#add-user-review").serialize();
                //below cleans it up, i dont understand the details but it gets it into a readable state
                let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                let decodedParams = {}
                Object.keys(params).forEach(function(v) {
                    decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
                });
                console.log(decodedParams);
                App.addUserReview(decodedParams);
                event.preventDefault();
            });

        } catch (error) {
            console.error("Could not connect to contract or chain2.");
        }
    },

    addReview: async function(review) {
        var ts = Math.round((new Date()).getTime() / 1000);
        const {
            addReview
        } = this.instance.methods;

        addReview(review["film-name"], review["review-text"], ts, review["film-score"], review["poster-source"]).send({
            from: this.account,
            gas: 500000
        });
    },

    editReview: async function(review) {
        var ts = Math.round((new Date()).getTime() / 1000);
        const {
            editReview
        } = this.instance.methods;

        editReview(review["id"], review["film-name"], review["review-text"], ts, review["film-score"], review["poster-source"], review["deleted"]).send({
            from: this.account,
            gas: 500000
        });
    },

    deleteUserReview: async function(review) {
        var ts = Math.round((new Date()).getTime() / 1000);
        const {
            deleteUserReview
        } = this.instance.methods;

        deleteUserReview(review["id"]).send({
            from: this.account,
            gas: 90000
        });
    },

    addUserReview: async function(review) {

        try {
            var length = review["review-text"].length + review["user-name"].length;
            console.log("length is " + length)
            alert("Clicking OK should launch metamask. Refresh the page after your transaction is confirmed to see your review");

            var ts = Math.round((new Date()).getTime() / 1000);
            let filmId = new URLSearchParams(window.location.search).get('id');
            const {
                addUserReview
            } = this.instance.methods;

            if (length < 50) {
                addUserReview(filmId, review["user-name"], review["review-text"], review["film-score"]).send({
                    from: this.account,
                    gas: 150000
                });
            } else if (length < 250) {
                addUserReview(filmId, review["user-name"], review["review-text"], review["film-score"]).send({
                    from: this.account,
                    gas: 300000
                });
            } else {
                addUserReview(filmId, review["user-name"], review["review-text"], review["film-score"]).send({
                    from: this.account,
                    gas: 500000
                });
            }
        } catch (error) {
            console.error(error);
        }
    },

    renderHeader: async function() {
        $.ajax({
            url: mongoHeaderUrl,
            type: 'get',
            contentType: "application/json; charset=utf-8",
            data: {}
        }).done(function(data, peen) {
            // console.log(data.userName);
            let node = $("<span id='stfu'>");
            node.append(data.userName + " reviewing <a href='userreviews.html?id=" + data.filmId + "'>" + data.reviewText + "</a>");
            $("#recent-user-review").append(node);
        });
    },


    // legacy
    // renderHome: async function() {
    //  const { reviewIndex } = this.instance.methods;
    //  var count = await reviewIndex().call();
    //  for(var i=1; i<= count; i++) {
    //   this.renderReview(i);
    //  }
    // },

    // new
    renderHome: async function() {
        var renderReview = this.renderReview;
        $.ajax({
            url: mongoReviewsUrl,
            type: 'get',
            contentType: 'application/json; charset=utf-8',
            data: {}
        }).done(function(data) {
            console.log(data);
            while (data.length > 0) {
                let chunks = data.splice(0, 4);
                chunks.forEach(function(value) {
                    renderReview(value);
                });
            }
        });
    },

    renderSingleReview: async function(id) {
        console.log(id);
        $.ajax({
            url: mongoSingleReviewrUrl,
            type: 'get',
            contentType: "application/json; charset=utf-8",
            data: {
                blockchainId: id
            }
        }).done(function(data) {
            console.log(data);
            while (data.length > 0) {
                let chunks = data.splice(0, 4);
                chunks.forEach(function(review) {
                    let node = $("<div id='review'>");
                    node.append("<div id='poster'><img style='width:150px' src=posters/" + review.posterSource + "></div>");
                    node.append("<div id='rightside'><span id='title'>" + review.name + "<img src='images/" + review.score + ".png'/></span><span id='reviewtext'>" + review.reviewText + "</span></div>");
                    $("#reviews").append(node);
                });
            }
        });
    },


    // legacy
    //  renderReview: async function(index) {
    //   const { getReview } = this.instance.methods;
    //   var q = await getReview(index).call()
    //   console.log(q)
    // let node = $("<div id='review'>");
    // node.append("<div id='poster'><img style='width:150px' src=posters/" + q[4] + "></div>");
    // node.append("<div id='rightside'><span id='title'>" + q[0] + "<img src='images/" + q[3] + ".png'/></span><span id='reviewtext'>" + q[1] + "</span></div>");
    // $("#reviews").append(node);
    //  },

    //new
    renderReview: async function(review) {
        console.log(review);
        if (review.deleted == 0) {
            if (review.userReviewCount > 1) {
                let node = $("<div id='review'>");
                node.append("<div id='poster'><a href='userreviews.html?id=" + review.blockchainId + "''><img style='width:150px' src='posters/" + review.posterSource + "'></a></div>");
                node.append("<div id='rightside'><span id='title'>" + review.name + "<img src='images/" + review.score + ".png'/><span id='user-review-link'><sup><a href='userreviews.html?id=" + review.blockchainId + "'' style='color:#3E4655'>View " + review.userReviewCount + " User Reviews</a></sup></span></span><span id='reviewtext'>" + review.reviewText + "</span></div>");
                $("#reviews").append(node);
            } else if (review.userReviewCount == 1) {
                let node = $("<div id='review'>");
                node.append("<div id='poster'><a href='userreviews.html?id=" + review.blockchainId + "''><img style='width:150px' src='posters/" + review.posterSource + "'></a></div>");
                node.append("<div id='rightside'><span id='title'>" + review.name + "<img src='images/" + review.score + ".png'/><span id='user-review-link'><sup><a href='userreviews.html?id=" + review.blockchainId + "'' style='color:#3E4655'>View 1 User Review</a></sup></span></span><span id='reviewtext'>" + review.reviewText + "</span></div>");
                $("#reviews").append(node);
            } else {
                let node = $("<div id='review'>");
                node.append("<div id='poster'><a href='userreviews.html?id=" + review.blockchainId + "''><img id='posterimage' style='width:150px' src='posters/" + review.posterSource + "'></a></div>");
                node.append("<div id='rightside'><span id='title'>" + review.name + "<img src='images/" + review.score + ".png'/><span id='user-review-link'><sup><a href='userreviews.html?id=" + review.blockchainId + "'' style='color:#3E4655'>Add Your Own Review</a></sup></span></span><span id='reviewtext'>" + review.reviewText + "</span></div>");
                $("#reviews").append(node);
            }
        }
    },

    renderUserReviews: async function(id) {
        var reviewfound = 0;
        $.ajax({
            url: mongoUserReviewsUrl,
            type: 'get',
            contentType: "application/json; charset=utf-8",
            data: {
                blockchainId: id
            }
        }).done(function(data) {
            while (data.length > 0) {
                let chunks = data.splice(0, 4);
                chunks.forEach(function(review) {
                    if ((review.filmId == id) && (review.deleted == 0)) {
                        reviewfound = 1;
                        let node = $("<div id='user-review'>");
                        node.append("Name: " + review.userName + ". Review: " + review.reviewText + "<img src='images/" + review.score + ".png'/>");
                        $("#user-reviews").append(node);
                    } else {
                        console.log("A userview has been not printed");
                    }

                });

            }
            if (reviewfound == 0) {
                let node = $("<div id='user-review'>");
                node.append("[no user reviews]");
                $("#user-reviews").append(node);
            }
        });
    }

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
            "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live or there will be trouble",
        );
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        // App.web3 = new Web3(
        //     new Web3.providers.HttpProvider("http://127.0.0.1:9545"),
        // );
    }

    App.start();
});