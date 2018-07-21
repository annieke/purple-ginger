import Charity from './../models/charity';

const createCharity = (data) => {
  const charityData = {
    name: data.name,
    money: 0,
    users: [],
  };
  const newCharity = new Charity(charityData);

  newCharity.save((err, res) => {
    if (err) return err;

    return res;
  });
};

const getCharityByName = (name) => {
  Charity.find({ name })
    .exec((err, res) => {
      if (err) return err;

      return res;
    });
};

const getCharityById = (id) => {
  Charity.findById(id)
    .exec((err, res) => {
      if (err) return err;

      return res;
    });
};

const addAmount = (id, money) => {
  getCharityById(id)
    .then((charity) => {
      charity.money += money;

      charity.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const removeAmount = (id, money) => {
  getCharityById(id)
    .then((charity) => {
      charity.money -= money;

      charity.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const addUser = (id, userId) => {
  getCharityById(id)
    .then((charity) => {
      charity.users = [...charity.users, userId];
      charity.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

const removeUser = (id, userId) => {
  getCharityById(id)
    .then((charity) => {
      charity.users = charity.users.filter((item) => {
        return item !== userId;
      });

      charity.save((err, res) => {
        if (err) return err;

        return res;
      });
    });
};

module.exports = {
  getCharityByName,
  createCharity,
  getCharityById,
  addAmount,
  removeAmount,
  addUser,
  removeUser,
};
