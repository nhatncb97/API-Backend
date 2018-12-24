const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  date: { type: Date, required: 'Starting date is required'},
  price: {type:Number},
  seatID: { type: String },
  time: {type: String},
  cinema: {type:String},
  bookingDate: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: 'User'},
  film: { type: Schema.Types.ObjectId, ref: 'Film'}
});


module.exports = mongoose.model('Booking', bookingSchema );