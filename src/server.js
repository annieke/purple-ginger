import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import botkit from 'botkit';
import dotenv from 'dotenv';

dotenv.config({ silent: true });

// initialize
const app = express();

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
const controller = botkit.slackbot({
  debug: false,
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

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) {
      throw new Error(err);
    }
  });
});

const firstMessage = (user) => {
  const greeting = user ? `Hello, <@${user}>!` : 'Hello!';
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

// example hello response
controller.on(
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    bot.startConversation(message, (err, convo) => {
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
            },
          },
        ],
      );
    });
  },
);

controller.on('interactive_message_callback', (bot, message) => {
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
