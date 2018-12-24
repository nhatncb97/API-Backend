var mongoose = require('mongoose');

var seatSchema = mongoose.Schema({
	seatID: {
		type: String
    },
    isBooked: {
        type: String
    }
});
var Seat = module.exports = mongoose.model('Seat', seatSchema);

