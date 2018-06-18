const Emitter = require('events');

class Context extends Emitter {

    constructor(message, consumer) {
        super();
        this.message = message;
        this.consumer = consumer;
    }

    printContents() {
        console.log(this.message.content.toString());
    }

}

module.exports = Context;