const Emitter = require('events');
const amqp = require('amqplib');
const debug = require('debug')('blue-rabbit:application');
const compose = require('koa-compose');
const Context = require('./context');

class Application extends Emitter {
    constructor(connectionURL, consumeQueue, consumeQueueOptions) {
        super();

        this.connectionURL = connectionURL;
        this.connection = null;
        this.consumerChannel = null;
        this.publisherChannel = null;
        this.consumeQueue = consumeQueue;
        this.consumeQueueOptions = consumeQueueOptions;
        this.middleware = [];
    }

    async connect() {
        try {

            debug("Initializing consumer");
            this.connection = await this.createConnection();
            this.publisherChannel = await this.createChannel('publisher');
            this.consumerChannel = await this.createChannel('consumer');

            await this.startConsuming();

        } catch (err) {
            debug("Error setting up consumer");
            debug("Error ", err);
            close();
        }
    }

    async close() {
        debug("Closing setup");
    }

    async createConnection() {
        // Setup connection to RabbitMQ broker

        debug("Inside createConnection");
        const connection = await amqp.connect(this.connectionURL);
        debug("Connection to RabbitMQ broker established");
        debug("Connection information", this.connection);

        // Setup connection event handlers

        connection.on('error', (err) => { this.emit('connection:error', err) });
        connection.on('close', (data) => { this.emit('connection:close', data) });

        return connection;
    }

    async createChannel(id) {
        // Check if connection to RabbitMQ broker exists
        if(!this.connection) {
            throw new Error("Connection to RabbitMQ broker not found");
        }

        const channel = await this.connection.createChannel();
        debug(`Channel - ${id} setup`)
        channel.on('error', (err) => { this.emit(`channel${id}:error`, err) });
        channel.on('close', (data) => { this.emit(`channel${id}:close`, data) });

        return channel;
    }

    use(middlewareFunction) {
        this.middleware.push(middlewareFunction);
    }

    async onMessage(message) {
        const context = new Context(message, this);

        const middlewareStack = compose(this.middleware);
        try {
            middlewareStack(context);
        } catch (err) {

        }
    }

    async startConsuming() {
        if(!this.consumerChannel) {
            throw new Error("Consumer channel not setup");
        }

        const consumerTag = await this.consumerChannel.consume(this.consumeQueue, this.onMessage.bind(this), this.consumeQueueOptions);
    }
}

module.exports = Application;
