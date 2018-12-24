var Booking = require('../../models/booking');
var User = require('../../models/user');
var Film = require('../../models/film');
var Seat = require('../../models/seat');
module.exports.createBooking = (req, res) => {
  const { cinema, date, time, price, seatID, film } = req.body;
  const user = req.user;
  const booking = new Booking({ cinema, date, time, price, seatID });
  Film.findOne({filmName:film})
    .exec(function (err, foundSlot) {
      if (err) throw err;
      booking.user = user;
      booking.film = foundSlot;
      console.log(foundSlot);
      console.log(booking.seatID);
      booking.save();
      Seat.findOneAndUpdate({ seatID:booking.seatID }, {isBooked:true}, function (error, doc) { });
      User.update({ _id: user._id }, { $push: { bookings: booking } }, function () { });
      Film.update(foundSlot, { $push: { bookings: booking } }, function () { });

      console.log(booking);
      return res.json({ date: booking.date, time: booking.time, price: booking.price, film: booking.film, seatID: booking.seatID });
    })

}
module.exports.getUserBookings = function (req, res) {
  const user = req.user;
  Booking
    .where({ user })
    .populate('film')
    .exec(function (err, foundBookings) {
      if (err) {
        return res.status(422).send();
      }
      return res.json(foundBookings);
    });
}