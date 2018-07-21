import User from './../models/user';
import Charity from './../models/charity';

// update user

const createUser = (data) => {
  const userData = { username: data.username, slack_id: data.slack_id };
  const newUser = new User(userData);

  newUser.save((err, res) => {
    if (err) return err;

    return res;
  });
};

/* HANDLING USERS */
const getAllUsers = () => {
  User.find({})
    .exec((err, res) => {
      if (err) return err;

      return res;
    });
};

const getUserById = (id) => {
  User.findById(id)
    .exec((err, res) => {
      if (err) return err;

      return res;
    });
};

const getUserByName = (username) => {
  User.find({ username })
    .exec((err, res) => {
      if (err) return err;

      return res;
    });
};

/* HANDLING BETS */
const addCurrentBet = (id, data) => {
  getUserById(id)
    .then((user) => {
      Charity.getCharityByName(data.charity)
        .then((charity) => {
          const newBet = { bet: data.id, money: data.money, charity: charity.id };
          user.current_bets = [...user.current_bets, newBet];

          user.save((err, res) => {
            if (err) return err;

            return res;
          });
        });
    });
};

const removeCurrentBet = (id, betId) => {
  getUserById(id)
    .then((user) => {
      user.current_bets = user.current_bets.filter((item) => {
        return item.bet !== betId;
      });
      user.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const addPastBet = (id, betId) => {
  getUserById(id)
    .then((user) => {
      user.current_bets.forEach((bet) => {
        if (bet.bet === betId) {
          user.past_bets = [...user.past_bets, bet];
        }
      });
      removeCurrentBet(id, betId)
        .then((res1) => {
          user.save((err, res) => {
            if (err) return err;

            return res;
          });
        });
    });
};

const updateCurrentBet = (id, data) => {
  getUserById(id)
    .then((user) => {
      user.current_bets.forEach((bet) => {
        if (bet.bet === data.id) {
          bet.money = data.money;
        }
      });
      user.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByName,
  createUser,
  addCurrentBet,
  addPastBet,
  updateCurrentBet,
};
