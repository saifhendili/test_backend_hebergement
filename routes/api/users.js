const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

const { check, validationResult } = require('express-validator');
// const normalize = require('normalize-url');

// @route post api/user
// @desc Test route
//@acess Public

router.post(
  '/',auth,
  [
    check('firstname', 'firstname is required')
      .not()
      .isEmpty(),
    check('lastname', 'lastname is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    // check('phoneNumber', 'Phone Number field must be 8 character long').isLength({ min: 8, max:8 }),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      typeUser
    } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Useral ready exists' }] });
      }

      user = new User({
        firstname,
      lastname,
      email,
      password,
      phoneNumber,
      typeUser
      });
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);
      await user.save();
      res.json("user added");


    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);
module.exports = router;