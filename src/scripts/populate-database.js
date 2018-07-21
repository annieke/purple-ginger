import mongoose from 'mongoose';
import User from './../models/user';
import Bet from './../models/bet';
import Charity from './../models/charity';

const mongoDB = 'mongodb://localhost/gingy';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;

/* NOTE
 * To run this script:
 * babel-node populate_database.js
 * Pay attention to the console after the script is done
 */

const users = [
  {
    username: 'user1',
    slack_id: '000001',
    current_bets: [],
    past_bets: [],
    history: {
      wins: 1,
      losses: 0,
    },
    donated_charities: [],
  },
  {
    username: 'user2',
    slack_id: '000002',
    current_bets: [],
    past_bets: [],
    history: {
      wins: 3,
      losses: 2,
    },
    donated_charities: [],
  },
  {
    username: 'user3',
    slack_id: '000003',
    current_bets: [],
    past_bets: [],
    history: {
      wins: 0,
      losses: 5,
    },
    donated_charities: [],
  },
];

const bets = [
  {
    name: 'France vs. Belgium',
    admin: mongoose.Types.ObjectId(),
    left_side_users: [],
    right_side_users: [],
    left_side_name: 'France',
    right_side_name: 'Belgium',
  },
  {
    name: 'Nigeria vs. Argentina',
    admin: mongoose.Types.ObjectId(),
    left_side_users: [],
    right_side_users: [],
    left_side_name: 'Nigeria',
    right_side_name: 'Argentina',
  },
  {
    name: 'South Korea vs. Mexico',
    admin: mongoose.Types.ObjectId(),
    left_side_users: [],
    right_side_users: [],
    left_side_name: 'South Korea',
    right_side_name: 'Mexico',
  },
];

const charities = [
  {
    name: 'American Red Cross',
    money: 0,
    users: [],
    paypal: 'testing@testing.com',
  },
  {
    name: 'Make a Wish',
    money: 0,
    users: [],
    paypal: 'testing@testing.com',
  },
];

const createBetsPromises = bets.map((bet) => {
  return new Bet({
    name: bet.name,
    admin: bet.admin,
    left_side_users: bet.left_side_users,
    right_side_users: bet.right_side_users,
    left_side_name: bet.left_side_name,
    right_side_name: bet.right_side_name,
  }).save();
});

const createUsersPromises = users.map((user) => {
  return new User({
    username: user.username,
    current_bets: user.current_bets,
    past_bets: user.past_bets,
    history: user.history,
    donated_charities: user.donated_charities,
  }).save();
});

const createCharitiesPromises = charities.map((charity) => {
  return new Charity({
    name: charity.name,
    money: charity.money,
    users: charity.users,
    paypal: charity.paypal,
  }).save();
});

const handleAllPromises = () => {
  Promise.all(createBetsPromises).then((allBets) => {
    Promise.all(createCharitiesPromises).then((allCharities) => {
      Promise.all(createUsersPromises).then((allUsers) => {
        console.log('REMEMBER TO END THIS SCRIPT: Command ctrl+c');
        console.log('stuff happened');
      });
    });
  });
};

handleAllPromises();
