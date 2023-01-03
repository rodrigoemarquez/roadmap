const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const Booking = require('./../models/bookingModel');

let session;

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) Create checkout session

  const product = await stripe.products.create({
    name: tour.name,
    description: tour.summary,
    images: [
      `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
    ]
  });

  const price = await stripe.prices.create({
    unit_amount: tour.price * 100,
    currency: 'usd',
    product: product.id
  });

  session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: price.id,
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

// exports.createBookingCheckout = async (req, res, next) => {
//   // This is only temporary because it is UNSECURE, everyone can make booking without paying it
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// };

// exports.createBookingCheckout = async (req, res, next) => {
//   // This is only temporary because it is UNSECURE, everyone can make booking without paying it
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// };

const createBookingDocument = async event => {
  const tour = event.data.object.client_reference_id;
  const user = await User.findOne({
    email: event.data.object.customer_details.email
  });
  const userId = user._id;
  const price = event.data.object.amount_total / 100;
  await Booking.create({ tour, userId, price });
};

exports.webhookCheckout = (req, res) => {
  let event;
  const secret = process.env.STRIPE_SIGNING_SECRET;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      secret
    );
  } catch (err) {
    return res.status(400).send(`There was a webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingDocument(event);
  }

  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
