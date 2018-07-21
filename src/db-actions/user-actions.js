import User from './../models/user';

// get user with id
// get all users
// create user
// update user

const createUser = (data) => {
  const userData = { username: data.username };
  const newUser = new User(userData);

  newUser.save((err, res) => {
    if (err) return err;

    console.log(`POST new user: ${res.username}`);
    return res;
  });
};

// const addBet = (id, data) => {
//   User.findById(id)
//   .exec((err, user) => {
//     if (err) return err;

//     user.current_bets = Object.assign(user.current_bets, { })
//   })
// }

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

module.exports = { createUser };
