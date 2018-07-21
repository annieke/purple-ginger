import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import botkit from 'botkit';
import dotenv from 'dotenv';
import * as db from './db';

dotenv.config({ silent: true });

const controller = botkit.slackbot({
  debug: false,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: ['bot'],
  redirectUri: 'https://purple-ginger.herokuapp.com/',
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
      convo.addQuestion(
        'What are you betting on?',
        [
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
        ],
        {},
        'new_bet',
      );

      convo.addQuestion(
        'When does this expire?',
        [
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
        ],
        {},
        'set_time',
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

      convo.addQuestion(
        'Which side would you like to bet on?',
        [
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
        ],
        {},
        'select_side',
      );

      // questions common to both sides
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
              // set amount
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

// controller.hears('interactive_message', (bot, message) => {
//   const callbackId = message.callback_id;
//   console.log('button clicked??');
//   console.log(message);
//   console.log(bot);
//
//   // Example use of Select case method for evaluating the callback ID
//   // Callback ID 123 for weather bot webcam
//   switch (callbackId) {
//     case 'choose_action':
//       bot.replyInteractive(message, 'New bet works!');
//       break;
//     // Add more cases here to handle for multiple buttons
//     default:
//       bot.reply(message, 'The callback ID has not been defined');
//   }
// });

// controller.storage.teams.all((err, teams) => {
//   if (err) {
//     throw new Error(err);
//   }
// });

controller.hears(':thumbsup:', 'ambient', (bot, message) => {
  console.log('heard thumbs up');
  bot.startConversation(message, (err, convo) => {
    console.log('started convo');
    /* Creating a new bet flow */
    convo.ask(
      'What are you betting on?',
      [
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
      ],
      {},
      'new_bet',
    );

    convo.addQuestion(
      'When does this expire?',
      [
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
      ],
      {},
      'set_time',
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

    convo.addQuestion(
      'Which side would you like to bet on?',
      [
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
      ],
      {},
      'select_side',
    );

    // questions common to both sides
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
            // set amount
            convo.say('Thanks for choosing!');
          },
        },
      ],
      {},
      'nonprofit_choice',
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
