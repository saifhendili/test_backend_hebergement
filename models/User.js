const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  typeUser: {
    type: String,
    required: true,

  },
  
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = User = mongoose.model('user', UserSchema);