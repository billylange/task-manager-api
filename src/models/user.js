const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

// Define schema for User data
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }, 
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid!');
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a positive number')
      }
    }
  },
  password: {
    type: String,
    required: true,
    minLength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Password is invalid!');
      }
    }
  },
  avatar: {
    type: Buffer
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Setup relationship between User and Tasks
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

// Create session token and add to user profile
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "1d"});
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
}

// Hide user passwords and Session tokens from user output
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  // remove password and tokens from output
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
}

// Validate user credencials
userSchema.statics.findByCredentials = async (email, password) => {
  // Find user profile with email provided
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login.');
  }
  // Compare password provided to what we have on file
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login.');
  }
  return user;
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
})

// Remove user tasks if user is removed
userSchema.pre('remove', async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;