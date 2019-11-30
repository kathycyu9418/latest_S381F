const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema(
    {
      restaurant_id: Number,
      name: { type: String, required: true },
      borough: String,
      cuisine: String,
      photo: {
        type: Buffer,
      },
      photo_mimetype: String,
      address: {
        street: String,
        building: String,
        zipcode: String,
        coord: [Number,Number]
      },
      grades: [{user: String, score: Number}],
      owner: String
    });
restaurantSchema.index({ "$**": 'text' });
module.exports = mongoose.model('Restaurants', restaurantSchema)
