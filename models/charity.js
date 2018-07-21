import mongoose from 'mongoose';

const { Schema } = mongoose;

const charitySchema = new Schema({
  name: { type: String, require: true },
  money: Number,
  users: [
    {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  ],
});

const charity = mongoose.model('Charity', charitySchema);
module.exports = charity;
