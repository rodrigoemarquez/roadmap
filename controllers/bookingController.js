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

const createBookingCheckout = async session => {
  const event = session;
  const tour = event.client_reference_id;
  const user = (await User.findOne({ email: event.customer_email })).id;
  const price = event.line_items.total;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = await stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    if (event.type === 'checkout.session.completed') {
      await createBookingCheckout(event.data.object);
      res.status(200).json({ received: true });
    }
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
