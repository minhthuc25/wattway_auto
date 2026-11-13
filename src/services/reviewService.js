import { getVehicle } from '../storage/vehicleStore.js';
import { hasPurchasedVehicle } from '../storage/orderStore.js';
import { listReviews, createReview } from '../storage/reviewStore.js';

function averageRating(reviews) {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export async function getVehicleReviews(vehicleId) {
  if (!(await getVehicle(vehicleId))) return null;

  const reviews = await listReviews(vehicleId);
  return { reviews, reviewCount: reviews.length, averageRating: averageRating(reviews) };
}

export async function addVehicleReview(user, vehicleId, input) {
  if (!(await getVehicle(vehicleId))) return { problem: 'vehicle_not_found' };
  if (!(await hasPurchasedVehicle(user.id, vehicleId))) return { problem: 'not_verified_owner' };

  const review = await createReview(user.id, vehicleId, input);
  if (!review) return { problem: 'already_reviewed' };
  return { review: { username: user.username, ...review } };
}
