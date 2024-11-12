module.exports = {
  content: [
    './server/views/*.ejs',  // Ensure your views are scanned for Tailwind classes
    './server/public/*.html'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'listing': "url('./public/images/listingBack.jpg')"
      }
    },
  },
  plugins: [],
}