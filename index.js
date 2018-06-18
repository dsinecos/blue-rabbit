const Consumer = require('./lib/application');

const connectionUrl = 'amqp://localhost';
const consumeQueue = 'hello';
const consumeQueueOptions = {
    noAck: true
}

const consumer = new Consumer(connectionUrl, consumeQueue, consumeQueueOptions);

consumer.connect();

consumer.on('connection:error', function (err) {
    console.log("Connection error caught in event handler");
    console.log(err);
})

function middleware1(context, next) {
    // console.log(context.message.content);
    console.log("Downstream middleware 1");
    next();
    console.log("Upstream middleware 1");
}

consumer.use(middleware1);

function middleware2(context, next) {
    // console.log(context.message.content);
    console.log("Downstream middleware 2");
    next()
    console.log("Upstream middleware 2");
}

consumer.use(middleware2);

function middleware3(context, next) {
    console.log("Downstream middleware 3");
    context.printContents();
    next();
    console.log("Upstream middleware 3");
}

consumer.use(middleware3);