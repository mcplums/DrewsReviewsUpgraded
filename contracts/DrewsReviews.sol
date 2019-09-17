pragma solidity >=0.4.0 <0.6.0;

contract DrewsReviews {
    
    uint public reviewIndex;
    uint public userReviewIndex;
    address public owner = 0x7753233bfe961eC770602e3F80900E26A5357F36;
    
    mapping (uint => Review) reviewList;
    mapping (uint => userReview) userReviewList;


	struct Review {
		string name;
		string review;
		uint reviewDate;
		uint score;
		string imageSource;
		uint deleted;
	}

	struct userReview {
		uint filmId;
		string userName;
		string review;
		uint score;
		uint deleted;
	}
	
constructor () public {
    reviewIndex = 27;
    userReviewIndex = 23;
}

event newReview(uint _filmId, string _name, string _review, string _imageSource, uint _score);

event editedReview(uint _filmId, string _name, string _review, string _imageSource, uint _score, uint _deleted);

event newUserReview(uint _filmId, uint _userReviewId, string _userName, string _review, uint _score);

event editedUserReview(uint _filmId, uint _userReviewId, string _userName, string _review, uint _score, uint _deleted);

function addReview(string memory _name, string memory _review, uint _reviewdate, uint _score, string memory _imageSource) public {
	assert(msg.sender == owner);

    reviewIndex += 1;
    Review memory review = Review (_name, _review, _reviewdate, _score, _imageSource, 0 );
    reviewList[reviewIndex] = review;
    emit newReview(reviewIndex, _name, _review, _imageSource, _score);
}

function addUserReview(uint _filmId, string memory _username, string memory _review, uint _score) public {
    userReviewIndex += 1;
    
    userReview memory _userReview = userReview (_filmId, _username, _review, _score, 0);
    userReviewList[userReviewIndex] = _userReview;
    emit newUserReview(_filmId, userReviewIndex, _username, _review, _score);
}

function getReview(uint _filmId) view public returns (string memory, string memory, uint, uint, string memory, uint) {
	Review memory review = reviewList[_filmId];
	return (review.name, review.review, review.reviewDate, review.score, review.imageSource, review.deleted);
}

function getUserReview(uint _userReviewId) view public returns (uint, string memory, string memory, uint, uint) {
	userReview memory _userReview = userReviewList[_userReviewId];
	return (_userReview.filmId, _userReview.userName, _userReview.review, _userReview.score, _userReview.deleted);
}

}