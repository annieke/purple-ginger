import express from 'express';
import paypal from 'paypal-rest-sdk';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import botkit from 'botkit';
import dotenv from 'dotenv';
import Bet from './models/bet';
import { createBet } from './db-actions/bet-actions';
import * as db from './db';

const betactions = require('./db-actions/bet-actions');
const useractions = require('./db-actions/user-actions');
const charityactions = require('./db-actions/charity-actions');

dotenv.config({ silent: true });
const redirect = 'http://localhost:3001/slack/receive';

const controller = botkit.slackbot({
  debug: false,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: ['bot'],
  redirectUri: 'https://purple-ginger.herokuapp.com/',
});

// PayPal application credentials and payment redirect
// Configure PayPal environment
paypal.configure({
  mode: 'sandbox', // sandbox or live
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

const firstMessage = (user) => {
  const greeting = user
    ? `Hello, <@${user}>! (Annie's current branch)`
    : 'Hello!';
  const text = `${greeting} What would you like to do?`;
  return [
    {
      text,
      fallback: 'Your action did not work:(',
      callback_id: 'choose_action',
      color: '#EBD1FE',
      attachment_type: 'default',
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

const closingMessage = (user) => {
  const greeting = user ? `Hello, <@${user}>! Jasmine` : 'Hello!';
  const text = `${greeting} Which bidding pool do you want to close?`;
  return [
    {
      text,
      fallback: 'Your action did not work:(',
      callback_id: 'choose_action',
      color: '#EBD1FE',
      attachment_type: 'default',
      // Ijemma: to do - populate buttons w/ bid types - needs to be persisted/passed around to each conversation
      actions: [
        {
          name: 'Close bet 1',
          text: 'Close INSERT BID 1',
          type: 'button',
          value: 'bid1',
        },
        {
          name: 'Close bet 2',
          text: 'Close INSERT BID 2',
          type: 'button',
          value: 'bid2',
        },
      ],
    },
  ];
};

controller.hears('Close bid', 'ambient', (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.addMessage(
      'Congratulations!',
      [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // TO DO: DISPLAY GRAPHIC
          },
        },
      ],
      {},
      'display_award_graphic',
    );

    convo.addQuestion(
      'Which side won?',
      [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // calculate winning side
            convo.say('Woot! They won.');
            convo.gotoThread('display_award_graphic');
          },
        },
      ],
      {},
      'select_winning_side',
    );

    convo.ask({
      ephemeral: true,
      attachments: closingMessage(message.user),
      callback: (res, c) => {
        // set amount
        convo.say('Thanks for selecting the bid');
        convo.gotoThread('select_winning_side');
      },
    });
  });
});

controller.hears(':thumbsup:', 'ambient', (bot, message) => {
  console.log('heard thumbs up');
  bot.startConversation(message, (err, convo) => {
    console.log('started convo');
    /* Creating a new bet flow */
    convo.addQuestion(
      'What are you betting on?',
      [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // create new bet
            createBet({
              name: res.text,
              admin: res.user,
              left_side_name: 'positive',
              right_side_name: 'negative',
            });
            console.log('creating new bet');
            console.log(res);
            // set admin of bet to this user
            bot.reply(message, 'Created a new bet for you!');
            convo.gotoThread('select_side');
          },
        },
      ],
      {},
      'new_bet',
    );

    /* Joining a bet flow */
    convo.addQuestion(
      'Which bet would you like to join? Please select available bet with the corresponding number. \n\n 1. 2. 3. 4.',
      [
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
      ],
      {},
      'join_bet',
    );

    // questions common to both sides
    convo.addQuestion(
      'Which side would you like to bet on?',
      [
        {
          ephemeral: true,
          pattern: 'for',
          callback: (res, c) => {
            // save bid
            convo.gotoThread('amount_to_bet');
          },
        },
        {
          ephemeral: true,
          pattern: 'against',
          callback: (res, c) => {
            // save bid
            convo.gotoThread('amount_to_bet');
          },
        },
      ],
      {},
      'select_side',
    );

    convo.addQuestion(
      'How much would you like to bet?',
      [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // set amount
            convo.say('Thanks for the money');
            convo.gotoThread('nonprofit_choice');
          },
        },
      ],
      {},
      'amount_to_bet',
    );

    convo.addQuestion(
      'Which nonprofit?',
      [
        {
          ephemeral: true,
          default: true,
          callback: (res, c) => {
            // set nonprofit
            convo.say('Thanks for choosing!');
          },
        },
      ],
      {},
      'nonprofit_choice',
    );

    convo.ask(
      {
        ephemeral: true,
        attachments: firstMessage(message.user),
      },
      [
        {
          pattern: 'newBet',
          callback: (reply) => {
            convo.gotoThread('new_bet');
          },
        },
        {
          pattern: 'joinBet',
          callback: (reply) => {
            convo.gotoThread('join_bet');
          },
        },
      ],
    );
  });
});

app.post('/', (req, res) => {
  const payload = JSON.parse(req.body.payload);
  console.log('got something on receiver');

  if (payload.callback_id === 'choose_action') {
    console.log('got something');
    switch (payload.actions[0].name) {
      case 'newBet':
        console.log('newbet pressed');
        res.send('Got it! Send me a :thumbsup: to continue.');
        break;
      case 'viewBets':
        break;
      default:
        break;
    }
  }
});

/* PayPal */

const startPayPal = (id, winningSide) => {
  Bet.getBetById(id).then((bet) => {
    let team;
    if (winningSide !== bet.left_side_name) {
      team = bet.left_side_users;
      handleTeam(team);
    } else {
      team = bet.right_side_users;
      handleTeam(team);
    }
  });
};

const handleTeam = (team) => {
  const reply = {
    attachments: [
      {
        fallback: 'Payment initiation infromation failed to load',
        color: '#36a64f',
        pretext: 'Click the link below to initiate payment',
        title: 'Make payment to COMPANY',
        footer: 'PayPal Payment Bot',
        footer_icon:
          'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-17/70252203425_a7e48673014756aad9a5_96.jpg',
        ts: 'test ts',
      },
    ],
  };

  team.forEach((user) => {
    // Build PayPal payment request
    const payReq = JSON.stringify({
      intent: 'sale',
      redirect_urls: {
        return_url: `${redirect}/process`,
        cancel_url: `${redirect}/cancel`,
      },
      payer: {
        payment_method: 'paypal',
      },
      transactions: [
        {
          description: 'This is the payment transaction description.',
          amount: {
            total: user.money,
            currency: 'USD',
          },
          payee: {
            email: Charity.findById(user.charity),
          },
        },
      ],
    });

    paypal.payment.create(payReq, (error, payment) => {
      if (error) {
        console.error(JSON.stringify(error));
      } else {
        // Capture HATEOAS links
        const links = {};
        payment.links.forEach((linkObj) => {
          links[linkObj.rel] = {
            href: linkObj.href,
            method: linkObj.method,
          };
        });
        // If redirect URL exists, insert link into bot message and display
        if (links.hasOwnProperty('approval_url')) {
          reply.attachments[0].title_link = links.approval_url.href;
          // create DM
          bot.say({
            text: `There's some good news and some bad news. The bad news is you lost your money. But the good news is you get to give it to charity! \n\n Here is the PayPal link to give to the selected charity: ${
              links.approval_url.href
            }`,
            channel: user.slack_id,
          });
        } else {
          console.error('no redirect URI present');
        }
      }
    });
  });
};
