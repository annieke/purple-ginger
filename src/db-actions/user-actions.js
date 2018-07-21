import User from './../models/user';

// update user

const createUser = (data) => {
  const userData = { username: data.username };
  const newUser = new User(userData);

  newUser.save((err, res) => {
    if (err) return err;

    return res;
  });
};

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

const addCurrentBet = (id, data) => {
  User.findById(id)
    .then((user) => {
      const newBet = { bet: data.id, money: data.money };
      user.current_bets = Object.assign(user.current_bets, newBet);

      user.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const removeCurrentBet = (id, betId) => {
  User.findById(id)
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
  User.findById(id)
    .then((user) => {
      user.current_bets.forEach((bet) => {
        if (bet.bet === betId) {
          user.past_bets = Object.assign(user.past_bets, bet);
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

// const updateUser = (data) => {
//   return new Promise((resolve, reject) => {
//     User.update(
//       { username: data.username },
//       { $set: { startDate: data.startDate, endDate: data.endDate } }
//     )
//       .exec((err, res) => {
//         if (err) reject(err)
//         resolve(`Successfully updated the term ${data.name}`)
//       })
//   })
// }

module.exports = {
  getAllUsers,
  getUserById,
  getUserByName,
  createUser,
  addCurrentBet,
  addPastBet,
};
