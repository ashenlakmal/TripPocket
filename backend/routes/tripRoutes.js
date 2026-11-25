import { Router } from 'express';
import { getTrips, createTrip, getTrip, updateTrip, deleteTrip } from '../controllers/tripController.js';

const router = Router();

router.get('/trips', getTrips);
router.post('/trips', createTrip);
router.get('/trips/:id', getTrip);
router.put('/trips/:id', updateTrip);
router.delete('/trips/:id', deleteTrip);

export default router;
