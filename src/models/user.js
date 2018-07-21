import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  current_bets: [
    {
      bet: { type: Schema.Types.ObjectId, ref: 'Bet' },
      money: Number,
    },
  ],
  past_bets: [
    {
      bet: { type: Schema.Types.ObjectId, ref: 'Bet' },
      money: Number,
    },
  ],
  history: {
    wins: Number,
    losses: Number,
  },
  donated_charities: [{ type: Schema.Types.ObjectId }],
});

const user = mongoose.model('User', userSchema);
module.exports = user;
