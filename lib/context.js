const Emitter = require('events');
const delegates = require('delegates');

class Context extends Emitter {

    static toBuffer(content) {
        if (Buffer.isBuffer(content)) {
            return content;
        }
        const contentToString = (typeof content === 'object') ? JSON.stringify(content) : `${content}`;
        return Buffer.from(contentToString);
    }

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

    async publish(channelKey, exchange, exchangeType, exchangeOptions, routingKey, content, messageOptions) {
        const channel = await this.createChannel(channelKey);
        content = Context.toBuffer(content);

        await channel.assertExchange(exchange, exchangeType, exchangeOptions);
        await channel.publish(exchange, routingKey, content, messageOptions)

        return channel.close();
    }

    async sendToQueue(channelKey, queue, queueOptions, content, messageOptions) {
        const channel = await this.createChannel(channelKey);
        content = Context.toBuffer(content);

        await channel.assertQueue(queue, queueOptions);
        await channel.sendToQueue(queue, content, messageOptions);

        return channel.close();
    }

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