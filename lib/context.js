const Emitter = require('events');
const delegates = require('delegates');

class Context extends Emitter {

    constructor(message, app) {
        super();
        this.message = message;
        this.app = app;
        this.publisherChannel = app.publisherChannel;
        this.consumerChannel = app.consumerChannel;
    }

    printContents() {
        console.log(this.message.content.toString());
    }

}

const { prototype } = Context;

delegates(prototype, 'consumerChannel')
    .method('ack')

module.exports = Context;