var pgPool = require('../js/pgPool');

module.exports.buslogic = function(refundRequestObj) {
    refundController = require('../controler/refundController')(refundRequestObj);
    //refundController.insertRefund(refundRequestObj);
    orderItem = refundController.getOrderById(refundRequestObj.Order.ordernumber, function(req, res) {
        console.log('RETORNO ' + JSON.stringify(orderItem));
    });
    var resp;
    orderItem = refundController.getOrderById(refundRequestObj.Order.ordernumber, resp);
    //var refundObj = new Refund();

    return
};