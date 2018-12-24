var mongoose = require('mongoose');

var ticketSchema = mongoose.Schema({
	filmName: {
		type: String,
		index:true
    },
    cinemaName: {
        type: String
    },
	Date: {
		type: String
	},
	timeSlot: {
		type: String
	},
	seatID: {
		type: String
	}
});