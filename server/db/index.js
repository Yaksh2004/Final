const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://Yaksh:Yaksh2004@cluster0.xosik.mongodb.net/SnackIt')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    past_orders: [{
        order_id: String,
        order_date: Date,
        amount: Number
    }]
});

const restaurantSchema = new mongoose.Schema({
    id: String,
    name: String,
    category: [String],
    rating: Number,
    phone: Number,
    image: String, 
    menu: [{
        item_id: String,
        item_name: String,
        isVeg: Boolean,
        item_category: String,
        item_price: Number,
        item_description: String,
        item_image: String
    }]
});

const User = mongoose.model('User', UserSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = { User, Restaurant }; 
