import mongoose from 'mongoose';

const { Schema } = mongoose;

const charitySchema = new Schema({
  name: { type: String, required: true },
  money: Number,
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  paypal: { type: String, required: true },
});

const charity = mongoose.model('Charity', charitySchema);
module.exports = charity;
