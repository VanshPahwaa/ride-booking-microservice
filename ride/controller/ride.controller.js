const rideModel = require('../models/ride.model');
const { publishToExchange } = require('../service/rabbit')

module.exports.createRide = async (req, res, next) => {
    const { pickup, destination } = req.body;
    const newRide = new rideModel({
        user: req.user._id,
        pickup,
        destination
    })

    await newRide.save();
    publishToExchange('ride_events', 'ride.new', newRide);
    res.send(newRide);
}

module.exports.acceptRide = async (req, res, next) => {
    const { rideId } = req.query;
    const ride = await rideModel.findById(rideId);
    if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
        return res.status(400).json({ message: 'Ride already accepted' });
    }

    ride.status = 'accepted';
    // Assuming the authenticated user making this request is the captain
    // Ensure you have a 'captain' field in your rideModel schema
    ride.captain = req.user._id; 

    await ride.save();
    publishToExchange('ride_events', 'ride.accepted', ride);
    res.send(ride);
}