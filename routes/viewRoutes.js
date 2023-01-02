const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.get(
  '/',
  bookingController.createBookingCheckout,
  viewsController.getOverview
);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);
router.get(
  '/signup',
  viewsController.userChecker,
  viewsController.getSignupForm
);
router.get('/me', authController.protect, viewsController.getAccount);
router.get(
  '/my-tours',
  // bookingController.createBooking,
  authController.protect,
  viewsController.getMyTours
);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
