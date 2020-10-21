var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser')
var mercadopago = require('mercadopago')
const herokuApp = 'http://mercado-pago-cert.herokuapp.com/'

mercadopago.configure({
    access_token: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
    integrator_id : 'dev_24c65fb163bf11ea96500242ac130004'
})

var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    res.render('detail', req.query);
});

app.get('/notifications', function (req, res) {
    switch (req.type) {
        case "payment":
          return res.send("Payment created");
        case "plan":
          return res.send("Plan created"); 
        case "subscription":
          return res.send("Subscription created");
        case "invoice":
          return res.send("Invoice created");
        case "test":
          return res.send("Test");
        default:
          return res.status(404).send('Sorry, cant find that');
    }
})

app.get('/webhooks', function (req, res) {
    res.send(req.query)
})

app.get('/callback', function (req, res) {
    if (req.query.status.includes('success')) {
        return res.render('success', {
            payment_type : req.query.payment_type,
            external_reference : req.query.external_reference,
            collection_id : req.query.collection_id,
        })
    }
    
    if (req.query.status.includes('pending')) {
        return res.render('pending')
    }

    if (req.query.status.includes('failure')) {
        return res.render('failure')
    }

    res.redirect('/404')
})

app.post('/checkout', function (req, res) {
    let preference = {
        notification_url : herokuApp + "webhooks",
        external_reference : "avillafane@digitalhouse.com",
        auto_return : 'approved',
        back_urls : {
            success : herokuApp + 'callback?status=success',
            pending : herokuApp + 'callback?status=pending',
            failure : herokuApp + 'callback??status=failure',
        },
        payer : {
            name : 'Lalo',
            surname : 'Landa',
            email : 'test_user_63274575@testuser.com',
            phone : {
                area_code : '11',
                number : 22223333,
            },
            address : {
                zipcode : '1111',
                street_name : 'False',
                street_number : 123,
            }
        },
        payment_methods : {
            installments : 6,
            excluded_payment_methods : [{id : "amex"}],
            excluded_payment_types : [{id : "atm"}],
        },
        items: [{
            id: 1234,
            title: req.body.title,
            unit_price: Number(req.body.price),
            image : req.body.image,
            quantity: 1
        }]
    };

    mercadopago.preferences.create(preference)
        .then(function (response) {
            // global.id = response.body.id;
            res.render('confirm', {init_point : response.body.init_point})
        }).catch(function (error) {
            console.log(error);
            res.send('Algo salio mal');
        });
});

app.get('/404', function (req, res) {
    return res.send('Not found')
})

app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.listen(3000);