const Emitter = require('events');
const amqp = require('amqplib');
const debug = require('debug')('blue-rabbit:application');

class Application extends Emitter {
    constructor(connectionURL) {
        super();

        this.connectionURL = connectionURL;
        this.connection = null;
        this.consumerChannel = null;
        this.publisherChannel = null;
    }

    async connect() {
        debug("Inside connect()")
        this.connection = await this.createConnection();
    }

    async createConnection() {
        try {
            debug("Inside createConnection");
            this.connection = await amqp.connect(this.connectionURL);
            debug("Connection to RabbitMQ broker established");
            debug("Connection information", this.connection);
            this.connection.on('error', (err) => { this.emit('connection:error', err) });
            this.connection.on('close', (data) => { this.emit('connection:close', data) });

        } catch (err) {
            debug("Error creating connection");
            debug(err);
            this.emit('connection:error', err);
        }
    }
}

module.exports = Application;
