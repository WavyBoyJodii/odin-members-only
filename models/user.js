const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, maxLength: 25, required: true },
  password: { type: String, required: true },
  membership: { type: Boolean, default: false },
});

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', UserSchema);
