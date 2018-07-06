#### A lightweight Nodejs-RabbitMQ microservices framework 

A microservice framework based on the middleware pattern (as used in [Koa](https://github.com/koajs/koa))

## Usage and Examples

```javascript
const Consumer = require('./lib/application');

const connectionUrl = 'amqp://localhost';
const queue = 'hello';
const queueOptions = {
    durable: false
};
const consumeOptions = {
    noAck: false
};
const socketOptions = {};

const consumer = new Consumer(queue, queueOptions, consumeOptions);

consumer.connect(connectionUrl, socketOptions);

consumer.on('connection:error', function (err) {
    console.log("Connection error caught in event handler");
    console.log(err);
})

consumer.on('connection:close', function (data) {
    console.log("Connection closed. Caught in event handler");
    console.log(data);
})

consumer.on('setup:error', function (err) {
    console.log("Error setting up. Caught in event handler");
    console.log(err);
})

consumer.on('consumer:error', function (err, context) {
    console.log("Error in consumer caught in event handler");
    console.log("Error ", err);
    console.log("Message that resulted in error ", context.message.content.toString());
})

async function printMessage(context, next) {
    console.log("This is the message");
    console.log(context.message);
    console.log("Message content ", context.message.content.toString());
    await next();
}

consumer.use(printMessage);

async function sendMessage(context, next) {
    console.log("Publishing message");
    const channelKey = "MessagePublishQueue";
    const queue = 'publishQueue';
    const queueOptions = {
        durable: true
    }
    const content = "Test publishing message";
    const messageOptions = {
        persistent: true
    }

    await context.sendToQueue(channelKey, queue, queueOptions, content, messageOptions);
    console.log("Message published");
    await next();
}

consumer.use(sendMessage);

async function publishMessage(context, next) {
    console.log("Publishing message");
    const channelKey = "MessagePublish";
    const exchange = "test";
    const exchangeType = "direct";
    const exchangeOptions = {
        durable: true
    }
    const routingKey = 'testQueue';
    const content = "Test publishing message";
    const messageOptions = {
        persistent: true
    }

    await context.publish(channelKey, exchange, exchangeType, exchangeOptions, routingKey, content, messageOptions);
    console.log("Message published");
    await next();
}

consumer.use(publishMessage);

async function middleware1(context, next) {
    console.log(context.message.content);
    console.log("Downstream middleware 1");
    await next();
    console.log("Upstream middleware 1");
}

consumer.use(middleware1);

async function middleware2(context, next) {
    console.log(context.message.content);
    console.log("Downstream middleware 2");
    await next()
    console.log("Upstream middleware 2");
}

consumer.use(middleware2);

async function middleware3(context, next) {
    console.log("Downstream middleware 3");
    context.printContents();
    await next();
    console.log("Upstream middleware 3");
}

consumer.use(middleware3);

async function generateError(context, next) {
    console.log("Generating error");
    throw new Error("Error in one of the middleware function");
    await next();
}

consumer.use(generateError);

```

## License
MIT