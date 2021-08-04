const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const router = new express.Router();


// Add new user to database
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
})

// Find logged-in user profile
router.get('/users/me', auth ,async (req, res) => {
  res.send(req.user);
})

// Find user by ID
router.get('/users/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
})

// Update logged-in users profile
router.patch('/users/me', auth, async (req, res) => {
  // Check that all update fields are valid
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!'});
  }

  // Update DB with user updates
  try {
    updates.forEach((update) => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
})

// Remove loggin user's profile. (auto logout)
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
})

// User login process
router.post('/users/login', async (req, res) => {
  try {
    // Validate user creds and create token for session
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
})

// Logout user and remove session token
router.post('/users/logout', auth , async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    })
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
})

// Log user out of all sessions associated to his profile
router.post('/users/logout-all', auth , async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
})

// Upload Avatar
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload only valid pictures.'));
    }
    cb(undefined, true);
  } 
});
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });
})

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if ( !user || !user.avatar ) {
      console.log('Error getting picture.');
      throw new Error();
    }
    res.set('Content-type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
})

module.exports = router;