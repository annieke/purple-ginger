import mongoose from 'mongoose';
import moment from 'moment';

const { Schema } = mongoose;

const betSchema = new Schema({
  name: { type: String, require: true },
  admin: { type: Schema.Types.ObjectId, ref: 'User' },
  left_side_users: [
    {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
      money: Number,
    },
  ],
  right_side_users: [
    {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
      money: Number,
    },
  ],
  left_side_name: { type: String, required: true },
  right_side_name: { type: String, required: true },
  end_time: { type: Date, default: moment().unix() },
});

const bet = mongoose.model('Bet', betSchema);
module.exports = bet;