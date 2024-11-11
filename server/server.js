const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const userMiddleware = require('./middlewares/user');
const authenticateJWT = require('./middlewares/jwt');
const {User, Restaurant} = require('./db/index');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'Yaksh@Snackit';
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use('/static',express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended: true}));


app.get('/signin', (req,res) => {
    res.render('signin');
})

app.post('/signin', userMiddleware, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        const token = jwt.sign({ userId: user._id, email: user.email }, SECRET_KEY);

        res.cookie('token', token);

        return res.redirect('/snackit');  
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/signup', (req,res) => {
    res.render('signup');
})

app.post('/signup', async(req, res)=>{
    try {
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        const userFind = await User.findOne({email: email});
        if(!userFind){
            const user = new User({email: email, password: password, name: username});
            await user.save();
            res.redirect('/signin');
    } else {
        console.log("User Already Exists");
        res.json({
            message: "User Already Exists"
        })
    }
    } catch (error) {
        res.redirect('/signup');
    }
})

app.get('/snackit', authenticateJWT, (req, res) => {
    res.render('snackit', { user: req.user }); 
});

app.get('/listing', authenticateJWT, (req, res) => {
    res.render('listing', { user: req.user });
});

app.post('/listing', async (req, res) => {
    const { restaurantName,phone, restaurantimage, foodCategory, address, menuItems } = req.body;

    try {
        const newRestaurant = new Restaurant({
            name: restaurantName,
            category: foodCategory.split(',').map((cat) => cat.trim()), 
            rating: 5, 
            phone: phone, 
            image: restaurantimage,
            address: address,
            menu: JSON.parse(menuItems)
        });

        await newRestaurant.save();

        res.redirect('/restaurants');
    } catch (error) {
        console.error('Error listing restaurant:', error);
        res.status(500).json({ message: 'Failed to list restaurant', error: error.message });
    }
});

app.get('/restaurants', authenticateJWT, async (req, res) => {
    try {
        const search = req.query.search || ''; 
        const category = req.query.category || ''; 

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        } else if (category) {
            query.category = { $in: category.split(',').map(c => c.trim()) };
        }
        const restaurants = await Restaurant.find(query);

        res.render('restaurants', { restaurants, search });  
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/user', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('user', {
            user: user,
            success: req.query.success || null  
        });
    } catch (error) {
        console.error('Error fetching user account:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/update-user', authenticateJWT, async (req, res) => {
    try {
        const { name, email, phone, address, password, confirm_password } = req.body;
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (password && password !== confirm_password) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password) {
            user.password = password;
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();

        res.redirect('/user?success=true');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user details' });
    }
});


app.get('/menu', authenticateJWT, async (req, res) => {
    try {
        const restaurantName = req.query.restaurantName;
        const searchQuery = req.query.menu_search || '';  
        const categoryFilter = req.query.category || '';

        const filters = {};
        
        if (searchQuery) {
            filters.$or = [
                { 'menu.item_name': { $regex: searchQuery, $options: 'i' } },
                { 'menu.item_description': { $regex: searchQuery, $options: 'i' } }
            ];
        }

        if (categoryFilter) {
            filters['menu.item_category'] = categoryFilter;
        }

        const restaurant = await Restaurant.findOne({ name: restaurantName });
        
        if (!restaurant) {
            return res.status(404).send('Restaurant not found');
        }

        if (!Array.isArray(restaurant.menu)) {
            return res.status(500).send('Menu data is corrupted');
        }

        const filteredMenu = restaurant.menu.filter(item => {
            let matches = true;

            if (searchQuery) {
                matches = item.item_name.match(new RegExp(searchQuery, 'i')) || 
                          item.item_description.match(new RegExp(searchQuery, 'i'));
            }

            if (categoryFilter) {
                matches = matches && item.item_category === categoryFilter;
            }

            return matches;
        });

        res.render('menu', { 
            restaurant, 
            searchQuery,       
            categoryFilter,    
            filteredMenu      
        });

    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/cart', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('cart', { user });
    } catch (error) {
        console.error('Error fetching user for cart:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/logout', (req, res) => {
    res.clearCookie('token'); 
    res.redirect('/signin'); 
});

app.post('/checkout', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cart, phone, address } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const amount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const orderDetails = {
            order_id: `ORD-${Date.now()}`,
            order_date: new Date(),
            amount
        };

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.phone) user.phone = phone;
        if (!user.address) user.address = address;

        user.past_orders.push(orderDetails);
        await user.save();

        res.status(200).json({ message: 'Order placed successfully!', orderId: orderDetails.order_id });
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});




const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});