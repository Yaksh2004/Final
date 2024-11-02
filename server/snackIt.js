const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '../dist')));

app.get('/snackit', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'landing.html'));
});

app.get('/list-restaurant', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'listing.html'));
  });

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'signup.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'signin.html'));
});


app.get('/restaurants', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'restaurants.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
