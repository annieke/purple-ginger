import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  slack_id: { type: String, required: true },
  current_bets: [
    {
      bet: { type: Schema.Types.ObjectId, ref: 'Bet' },
      money: Number,
      charity: { type: Schema.Types.ObjectId, ref: 'Charity' },
    },
  ],
  past_bets: [
    {
      bet: { type: Schema.Types.ObjectId, ref: 'Bet' },
      money: Number,
      charity: { type: Schema.Types.ObjectId, ref: 'Charity' },
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
