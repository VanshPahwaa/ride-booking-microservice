const userModel = require('../models/user.model');
const blacklisttokenModel = require('../models/blacklisttoken.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { subscribeToQueue } = require('../service/rabbit')
const EventEmitter = require('events');
const rideEventEmitter = new EventEmitter();

module.exports.register = async (req, res) => {
    try {
        console.log("in post register");
        const { name, email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = new userModel({ name, email, password: hash });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // res.cookie('token', token);

        delete newUser._doc.password;

        res.send({ token, newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel
            .findOne({ email })
            .select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        delete user._doc.password;

        // res.cookie('token', token);

        res.send({ message: "user logged in successfully", token, user });

    } catch (error) {

        res.status(500).json({ message: error.message });
    }

}

module.exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // req.cookies.token;
        await blacklisttokenModel.create({ token });
        // res.clearCookie('token');
        res.send({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.profile = async (req, res) => {
    try {
        res.send(req.user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.acceptedRide = async (req, res) => {

    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(204).send();
        }

    }, 30000);

    rideEventEmitter.once('ride-accepted', (data) => {

        clearTimeout(timeout);
        console.log("sending data", data)

        if (!res.headersSent) {
            res.send(data);
        }

    });

}

subscribeToQueue('ride-accepted', async (msg) => {
    const data = JSON.parse(msg);
    rideEventEmitter.emit('ride-accepted', data);
});