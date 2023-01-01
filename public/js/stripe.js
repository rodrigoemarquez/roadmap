/* eslint-disable */
const stripe = Stripe(
  'pk_test_51MIfYYIHeZaJpU0ELb0QI41fz46ZEQOYIbPefOvrbR3fe0HXFICYvavShaTnOBVP4WycrsldwEpGKyncionsN6lj00nXCvv6Ni'
);
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    // 2) Create checkout form and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
