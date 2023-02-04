const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const nodemailer = require("nodemailer");
// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
         { expiresIn: 36000000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


router.post(
  '/forgot-password', async (req, res) => {
  const user = await User.findOne({email: req.body.email}).select("-password");

  if (user) {
      const randomNumber = randomIntBetween(1000, 9999);

      // token creation
      const token = await generateResetToken(randomNumber)

      const success = await sendEmail({
          from: "tn.kitebi.app@gmail.com",
          to: req.body.email,
          subject: "Password reset - tEST",
          html:
              "<h3>You have requested to reset your password</h3><p>Your reset code is : <b style='color : #7b2bf1'>" +
              randomNumber +
              "</b></p>",
      }).catch((error) => {
          console.log(error)
          return res.status(500).send({
              message: "Error : email could not be sent"
          })
      });

      if (success) {
          return res.status(200).send({
              message: "Reset email has been sent to : " + user.email, token
          })
      } else {
          return res.status(500).send({
              message: "Email could not be sent"
          })
      }
  } else {
      return res.status(404).send({message: "User does not exist"});
    }}
)

router.post(
  '/verify-reset-code',  async (req, res) => {
  let openToken
  try {
      openToken = jwt.verify(req.body.token, 'jwtSecret');
  } catch (e) {
      console.log(e)
      return res.status(500).send({message: "Error, could not decrypt token"});
  }

  if (String(openToken.resetCode) === req.body.typedResetCode) {
      res.status(200).send({message: "Success"});
  } else {
      res.status(403).send({message: "Incorrect reset code"});
  }
})

router.post(
  '/reset-password',  async (req, res) => {
  const {
      email,
      password,
  } = req.body;

  try {
      await User.findOneAndUpdate({email},
          {
              $set: {
                  password: await bcrypt.hash(password, 10),
              },
          }
      )
      res.status(200).send({message: "Success"});
  } catch (error) {
      res.status(500).send({error});
  }
})

// UTILITIES FUNCTIONS - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



function generateResetToken(resetCode) {
  return jwt.sign(
      {resetCode},
      "jwtSecret", {
          expiresIn: "100000000", // in Milliseconds (3600000 = 1 hour)
      })
}

async function sendEmail(mailOptions) {
  let transporter = await nodemailer.createTransport({
      service: "gmail",
      auth: {
          user: "saifhendili12@gmail.com",
          pass: "otvnnaerpxaclwec",
      },
  })
  await transporter.verify(function (error) {
    if (error) {
        console.log(error);
        console.log("Server not ready");
        success = false
    } else {
        console.log("Server is ready to take our messages");
    }
})
await transporter.sendMail(mailOptions, function (error, info) {
  if (error) {
      console.log(error);
      return false;
  } else {
      console.log("Email sent: " + info.response);
      return true;
  }
});

return true
}


function randomIntBetween(min, max) {
  return Math.floor(
      Math.random() * (max - min + 1) + min
  )
}
module.exports = router;