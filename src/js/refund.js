/*jshint esversion: 6 */

class Order {
    constructor(id, orderid, amount) {
        this.id = id;
        this.orderid = orderid
        this.amount = amount;
        this.banktrxid = '';
        this.estado = 'Pendiente';
    }
};

class Order {
    constructor(id, orderid, amount) {
        this.orderid = orderid
        this.amount = amount;
        this.banktrxid = '';
        this.estado = 'Pendiente';
    }
};


module.exports = Order;