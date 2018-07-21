import Bet from './../models/bet';

const createBet = (data) => {
  const betData = {
    name: data.name,
    admin: data.admin,
    chart: data.image,
    left_side_users: [],
    right_side_users: [],
    left_side_name: data.left_side_name,
    right_side_name: data.right_side_name,
  };
  const newBet = new Bet(betData);

  newBet.save((err, res) => {
    if (err) return err;

    return res;
  });
};

/* GETTING BETS */
const getBetsByAdmin = (id) => {
  Bet.findById(id)
    .exec((err, bets) => {
      if (err) return err;

      return bets;
    });
};

const getBetByName = (name) => {
  Bet.find({ name })
    .exec((err, bet) => {
      if (err) return err;

      return bet;
    });
};

const getBetById = (id) => {
  Bet.findById(id)
    .exec((err, bet) => {
      if (err) return err;

      return bet;
    });
};

/* HANDLING USERS */
const addLeftSideUser = (id, data) => {
  getBetById(id)
    .then((bet) => {
      const newLeftSideUser = { user: data.id, money: data.money, charity: data.charity };
      bet.left_side_users = [...bet.left_side_name, newLeftSideUser];
      bet.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const addRightSideUser = (id, data) => {
  getBetById(id)
    .then((bet) => {
      const newRightSideUser = { user: data.id, money: data.money, charity: data.charity };
      bet.right_side_users = [...bet.right_side_users, newRightSideUser];
      bet.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const removeUser = (id, userId) => {
  getBetById(id)
    .then((bet) => {
      bet.left_side_users = bet.left_side_users.filter((item) => {
        return item.user !== userId;
      });
      bet.right_side_users = bet.right_side_users.filter((item) => {
        return item.user !== userId;
      });
      bet.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const updateUser = (id, data) => {
  getBetById(id)
    .then((bet) => {
      let foundUser = false;
      bet.left_side_users.forEach((user) => {
        if (user.user === data.id) {
          user.money = data.money;
          foundUser = true;
        }
      });
      if (!foundUser) {
        bet.right_side_users.forEach((user) => {
          if (user.user === data.id) {
            user.money = data.money;
          }
        });
      }
      bet.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

/* UPDATING BET */
const endBet = (id) => {
  getBetById(id)
    .then((bet) => {
      bet.current = false;

      bet.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

module.exports = {
  createBet,
  getBetsByAdmin,
  getBetByName,
  getBetById,
  addLeftSideUser,
  addRightSideUser,
  removeUser,
  updateUser,
  endBet,
};
