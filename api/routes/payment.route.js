var express = require('express');
var router = express.Router();
const paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AdAiC1He4Z_8JZcub97QSzSaKNYdHD8n7cGFGiOvApQY7hb4X3GA7RtS6_cdDrKNB4Vz5_zvYypv3dFd',
    'client_secret': 'EJex4W8iR-YNgINUXG6IZ90Jv0lI65Q_8_CoDKQutHm3Pbp3g8TDaz69wgcvF9Ei2ncfhy-x_MSXcqFN'
});

router.post('/pay', (req, res) => {
    console.log(req.body);
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/payment-success",
            "cancel_url": "http://localhost:5000/api/v1/payment/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "PHIM: "+req.body.film,
                    "sku": "Chỗ ngồi: "+req.body.seatID,
                    "price": "5.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "5.00"
            },
            "description": "Đã đặt thành công vé xem phim " +req.body.film +" tại "+req.body.cinema+", vào lúc "+req.body.time+" ngày "+req.body.date
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            // throw error;
            console.log(error);
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.json(payment.links[i].href);
                }
            }
        }
    });

});

router.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "5.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            // throw error;
            res.json('Hóa đơn này đã thanh toán rồi. Xin quý khách hãy tạo thanh toán mới')
        } else {
            console.log(JSON.stringify(payment.transactions[0].description));
            res.json(payment.transactions[0].description);
        }
    });
});

router.get('/cancel', (req, res) => res.send('Cancelled'));
module.exports = router;
