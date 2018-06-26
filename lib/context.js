const Emitter = require('events');
const delegates = require('delegates');
const debug = require('debug')('blue-rabbit:context');

class Context extends Emitter {

    /**
     * Convert String or Object to buffer before publishing to a RabbitMQ channel
     * @static
     * @param {(Object | String | Buffer)} content 
     */
    static toBuffer(content) {
        if (Buffer.isBuffer(content)) {
            return content;
        }
        const contentToString = (typeof content === 'object') ? JSON.stringify(content) : `${content}`;
        return Buffer.from(contentToString);
    }
    
    /**
     * 
     * @param {object} message - Message received from queue
     * @param {object} app - Application object providing access to RabbitMQ connection
     */
    constructor(message, app) {
        super();
        this.message = message;

        this.app = app;
        this.publisherChannel = app.publisherChannel;
        this.consumerChannel = app.consumerChannel;
        this.createChannel = app.createChannel.bind(app);

        this.state = {};
    }

    printContents() {
        console.log(this.message.content.toString());
    }

    /**
     * Publish a message to an exchange
     * @param {String} channelKey - Identifier for a publisher channel 
     * @param {String} exchange - Name of exchange 
     * @param {String} exchangeType - Exchange type 
     * @param {Object} exchangeOptions - Options to define exchange eg. `{ durable: true }` 
     * @param {String} routingKey - Routing key 
     * @param {(String | Object | Buffer)} content - Message to be published to the exchange 
     * @param {Object} messageOptions - Options for message eg. `{ persistent: true }` 
     */
    async publish(channelKey, exchange, exchangeType, exchangeOptions, routingKey, content, messageOptions) {
        const channel = await this.createChannel(channelKey);
        content = Context.toBuffer(content);

        await channel.assertExchange(exchange, exchangeType, exchangeOptions);
        await channel.publish(exchange, routingKey, content, messageOptions)

        return channel.close();
    }

    /**
     * 
     * @param {String} channelKey - Identifier for a publisher channel 
     * @param {String} queue - Name of queue to which the message is to be published
     * @param {Object} queueOptions - Define the options for the queue eg. `{ durable: true }`
     * @param {(String | Object | Buffer)} content - Message to be sent to the queue
     * @param {Object} messageOptions - Options for message eg. `{ persistent: true }`
     */
    async sendToQueue(channelKey, queue, queueOptions, content, messageOptions) {
        const channel = await this.createChannel(channelKey);
        content = Context.toBuffer(content);

        await channel.assertQueue(queue, queueOptions);
        await channel.sendToQueue(queue, content, messageOptions);

        return channel.close();
    }

    /**
     * To emit a 'consumer:error' event
     * @param {Object} err - Error object 
     */
    onerror(err) {
        this.app.emit('consumer:error', err, this);
    }

}

const { prototype } = Context;

delegates(prototype, 'consumerChannel')
    .method('ack')
    .method('ackAll')
    .method('nack')
    .method('nackAll')
    .method('reject')
    .method('recover')

delegates(prototype, 'message')
    .getter('fields')
    .getter('properties')
    .getter('content')

delegates(prototype, 'fields')
    .getter('consumerTag')
    .getter('deliveryTag')
    .getter('redelivered')
    .getter('exchange')
    .getter('routingKey')

delegates(prototype, 'properties')
    .getter('contentType')
    .getter('contentEncoding')
    .getter('headers')
    .getter('deliveryMode')
    .getter('priority')
    .getter('correlationId')
    .getter('replyTo')
    .getter('expiration')
    .getter('messageId')
    .getter('timestamp')
    .getter('type')
    .getter('userId')
    .getter('appId')
    .getter('clusterId')

module.exports = Context;