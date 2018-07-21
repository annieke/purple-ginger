import express from 'express';
import paypal from 'paypal-rest-sdk';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import botkit from 'botkit';
import dotenv from 'dotenv';
import Bet form './models/bet';
import * as db from './db';

dotenv.config({ silent: true });
const redirect = 'http://localhost:3001/slack/receive';

const controller = botkit.slackbot({
  debug: true,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: ['bot'],
  redirectUri: 'https://purple-ginger.herokuapp.com/',
});

// PayPal application credentials and payment redirect
// Configure PayPal environment
paypal.configure({
  mode: 'sandbox', //sandbox or live
  client_id: process.env.PP_CLIENT_ID,
  client_secret: process.env.PP_CLIENT_SECRET,
});

// initialize slackbot
const slackbot = controller
  .spawn({
    token: process.env.SLACK_BOT_TOKEN,
    // this grabs the slack token we exported earlier
  })
  .startRTM((err) => {
    // start the real time message client
    if (err) {
      throw new Error(err);
    }
  });

// initialize
const app = express(slackbot);

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);

// botkit controller

// // prepare webhook
// // for now we won't use this but feel free to look up slack webhooks
// controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
//   controller.createWebhookEndpoints(webserver, slackbot, () => {
//     if (err) {
//       throw new Error(err);
//     }
//   });
//   controller.createOauthEndpoints(webserver);
// });

const firstMessage = (user) => {
  const greeting = user ? `Hello, <@${user}>! (Annie)` : 'Hello!';
  const text = `${greeting} What would you like to do?`;
  return [
    {
      text,
      fallback: 'Your action did not work:(',
      callback_id: 'choose_action',
      color: '#EBD1FE',
      attachement_type: 'default',
      actions: [
        {
          name: 'newBet',
          text: 'Start a new bet',
          type: 'button',
          value: 'newBet',
        },
        {
          name: 'viewBets',
          text: 'View current bets',
          type: 'button',
          value: 'viewBets',
        },
      ],
    },
  ];
};

controller.on(
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    bot.startConversation(message, (err, convo) => {
      /* Creating a new bet flow */
      convo.addQuestion('What are you betting on?', [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // create new bet
            // set admin of bet to this user
            convo.say('Created new bet');
            convo.gotoThread('set_time');
          },
        },
      ], {}, 'new_bet');

      convo.addQuestion('When does this expire?', [
        // parse -- moment.js
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // set time
            convo.say('Cool.......');
            convo.gotoThread('amount_to_bet');
          },
        },
      ], {}, 'set_time');

      /* Joining a bet flow */
      convo.addQuestion('Which bet would you like to join? Please select available bet with the corresponding number. \n\n\ 1. 2. 3. 4.', [
        {
          // parse number lol
          ephemeral: true,
          pattern: '1',
          callback: (res, c) => {
            // select the bet by name
            convo.say('Sweet!');
            convo.gotoThread('select_side');
          },
        },
      ], {}, 'join_bet');

      convo.addQuestion('Which side would you like to bet on?', [
        {
          ephemeral: true,
          pattern: 'left',
          callback: (res, c) => {
            // select the left side
            convo.say('Left');
            convo.gotoThread('amount_to_bet');
          },
        },
        {
          pattern: 'right',
          callback: (res, c) => {
            // select the right side
            convo.say('Right');
            convo.gotoThread('amount_to_bet');
          },
        },
      ], {}, 'select_side');


      // questions common to both sides
      convo.addQuestion('How much would you like to bet?', [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // set amount
            convo.say('Thanks for the money');
            convo.gotoThread('nonprofit_choice');
          },
        },
      ], {}, 'amount_to_bet');

      convo.addQuestion('Which nonprofit?', [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // set amount
            convo.say('Thanks for choosing!');
          },
        },
      ], {}, 'nonprofit_choice');

      convo.ask(
        {
          ephemeral: true,
          attachments: firstMessage(message.user),
        },
        [
          {
            pattern: 'newBet',
            callback: (reply) => {
              convo.say('yay');
              convo.gotoThread('new_bet');
              // create a new bet
            },
          },
          {
            pattern: 'joinBet',
            callback: (reply) => {
              convo.say('yay');
              convo.gotoThread('join_bet');
              // list all bets
            },
          },
        ],
      );
    });
  },
);

controller.hears('interactive_message', (bot, message) => {
  const callbackId = message.callback_id;
  console.log('button clicked??');
  console.log(message);
  console.log(bot);

  // Example use of Select case method for evaluating the callback ID
  // Callback ID 123 for weather bot webcam
  switch (callbackId) {
    case 'choose_action':
      bot.replyInteractive(message, 'New bet works!');
      break;
    // Add more cases here to handle for multiple buttons
    default:
      bot.reply(message, 'The callback ID has not been defined');
  }
});

controller.storage.teams.all((err, teams) => {
  if (err) {
    throw new Error(err);
  }
});

app.post('/', (req, res) => {
  const payload = JSON.parse(req.body.payload);
  res.send('got a post');
  console.log('got something on receiver');

  if (payload.callback_id === 'choose_action') {
    console.log('got something');
  }
});






/* PayPal */

const startPayPal = (id, winningSide) => {

  Bet.getBetById(id)
    .then((bet) => {
      let team;
      if (winningSide === bet.left_side_name) {
        team = bet.left_side_users;
        handleTeam(team);
      } else {
        team = bet.right_side_users;
        handleTeam(team);
      }
    })
}

const handleTeam = (team) => {

  const reply = {
    attachments: [{
      fallback: 'Payment initiation information failed to load',
      color: '#36a64f',
      pretext: 'Click the link below to initiate payment',
      title: 'Make payment to COMPANY',
      footer: 'PayPal Payment Bot',
      footer_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-17/70252203425_a7e48673014756aad9a5_96.jpg',
      ts: 'test ts'
    }]
  };

  team.forEach((user) => {
    // Build PayPal payment request
    let payReq = JSON.stringify({
      intent: 'sale',
      redirect_urls: {
        return_url: redirect + '/process',
        cancel_url: redirect + '/cancel'
      },
      payer: {
        payment_method: 'paypal'
      },
      transactions: [{
        description: 'This is the payment transaction description.',
        amount: {
          total: user.money,
          currency: 'USD'
        },
        payee: {
          email: Charity.findById(user.charity)
        }
      }]
    })

    paypal.payment.create(payReq, function (error, payment) {
      if (error) {
        console.error(JSON.stringify(error));
      } else {
        // Capture HATEOAS links
        var links = {};
        payment.links.forEach(function (linkObj) {
          links[linkObj.rel] = {
            href: linkObj.href,
            method: linkObj.method
          };
        })
        // If redirect URL exists, insert link into bot message and display
        if (links.hasOwnProperty('approval_url')) {
          reply.attachments[0].title_link = links['approval_url'].href;
          // create DM
          bot.say({
            text: 'Test',
            channel: user.slack_id,
          });
        } else {
          console.error('no redirect URI present');
        }
      }
    })
  })
}
