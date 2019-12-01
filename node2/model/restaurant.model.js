const mongoose = require('mongoose');
var subSchema = mongoose.Schema({
  user: String, score: Number
}, {_id:false});
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
      grades: [subSchema],
      owner: String
    });

restaurantSchema.index({ "$**": 'text' });
module.exports = mongoose.model('Restaurants', restaurantSchema)
