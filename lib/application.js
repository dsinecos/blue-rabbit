const Emitter = require('events');
const amqp = require('amqplib');
const debug = require('debug')('blue-rabbit:application');
const compose = require('koa-compose');
const Context = require('./context');

class Application extends Emitter {
    constructor(queue, queueOptions, consumeOptions) {
        super();

        this.connectionUrl = null;
        this.socketOptions = null;
        this.connection = null;

        this.consumerChannel = null;
        this.publisherChannel = null;

        this.queue = queue;
        this.queueInfo = null;
        this.queueOptions = queueOptions;
        this.consumeOptions = consumeOptions;
        this.queueConsumerTag = null;

        this.middleware = [];
    }

    async connect(connectionUrl, socketOptions = {}) {
        this.connectionUrl = connectionUrl;
        this.socketOptions = socketOptions;

        try {

            debug("Initializing consumer");
            this.connection = await this.createConnection();
            this.publisherChannel = await this.createChannel('publisher');
            this.consumerChannel = await this.createChannel('consumer');

            await this.startConsuming();

        } catch (err) {
            debug("Error setting up consumer");
            debug("Error ", err);
            this.emit("setup:error", err);
            this.close();
        }
    }

    async close() {
        debug("Closing setup");

        if (this.consumerChannel) {
            debug("Closing consumer channel");
            await this.consumerChannel.close();
            // delete this.consumerChannel;
        }

        if (this.publisherChannel) {
            debug("Closing publisher channel");
            await this.publisherChannel.close();
            // delete this.publisherChannel;
        }

        if (this.connection) {
            debug("Closing connection");
            await this.connection.close();
            // delete this.connection;
        }
    }

    async createConnection() {
        // Setup connection to RabbitMQ broker
        debug("Inside createConnection");
        const connection = await amqp.connect(this.connectionURL, this.socketOptions);
        debug("Connection to RabbitMQ broker established");

        // Setup connection event handlers
        connection.on('error', (err) => { this.emit('connection:error', err) });
        connection.on('close', (data) => {
            this.emit('connection:close', data)
            debug("Connection closed. Deleting connection");
            delete this.connection;
        });

        return connection;
    }

    async createChannel(id) {
        // Check if connection to RabbitMQ broker exists
        if (!this.connection) {
            throw new Error("Connection to RabbitMQ broker not found");
        }

        const channel = await this.connection.createChannel();
        debug(`${id} Channel setup`)

        channel.on('error', (err) => {
            this.emit(`channel${id}:error`, err)
        });

        channel.on('close', (data) => {
            if (id === 'consumer') {
                debug("Consumer channel closed. Deleting consumer channel");
                delete this.consumerChannel;
            }

            if (id === 'publisher') {
                debug("Publisher channel closed. Deleting publisher channel");
                delete this.publisherChannel;
            }

            this.emit(`channel${id}:close`, data)
        });

        return channel;
    }

    use(middlewareFunction) {
        this.middleware.push(middlewareFunction);
    }

    async onMessage(message) {
        const context = new Context(message, this);

        const middlewareStack = compose(this.middleware);
        try {
            await middlewareStack(context);
        } catch (err) {
            debug("Error caught in middleware stack");
            context.onerror(err);
        }

        // return async function(message) {

        //     debug("Message recieved for processing");
        //     const context = new Context(message, this);

        //     try {

        //         await middlewareStack(context);
        //     } catch (err) {
        //         debug("Error caught in middleware stack");
        //         context.onerror(err);
        //     }
        // }
    }

    async startConsuming() {
        if (!this.consumerChannel) {
            throw new Error("Consumer channel not setup");
        }

        // const messageHandler = this.onMessage()
        debug("Calling startConsuming");

        this.queueInfo = await this.consumerChannel.assertQueue(this.queue, this.queueOptions);

        this.queueConsumerTag = await this.consumerChannel.consume(this.queue, this.onMessage.bind(this), this.consumeOptions);
        debug("Consumer tag ", this.queueConsumerTag);
    }
}

module.exports = Application;
