const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: String,
    ref: 'Tour',
    required: [true, 'Booking must belong a Tour!']
  },
  user: {
    type: String,
    ref: 'User',
    required: [true, 'Booking must belong to an User!']
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  }
});


const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
