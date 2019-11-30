
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});
module.exports = User = mongoose.model('Users', UserSchema);

module.exports.createUser = function (newUser, callback) {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(newUser.password, salt, function (err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });

    });
}

module.exports.getUserByName = function (name, callback) {
   let query = { name: name };
    User.findOne(query, callback);
}

module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
        if (err) throw err;
        console.log(err);
        callback(null, isMatch);
    });
}
