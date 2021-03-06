var express = require('express');
var handlebars = require('express-handlebars').create({ 
    defaultLayout: 'main',
});
var handlebars_sections = require('express-handlebars-sections');
var jqupload = require('jquery-file-upload-middleware');

var detail = require('./lib/detail.js');
var credentials = require('./credentials.js');
var Article = require('./models/article.js');
var app = express();

app.set('port', process.env.PORT || 3000);

// set up handlebars view engine
handlebars_sections(handlebars);   // CONFIGURE 'express_handlebars_sections'
app.engine('handlebars', handlebars.engine);

app.set('view engine', 'handlebars');

// test
app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});

// database
var mongoose = require('mongoose');
switch(app.get('env')){
    case 'development':
        mongoose.connect(credentials.mongo.development.url, {
            auth: {
              user: credentials.mongo.development.user,
              password: credentials.mongo.development.password
            },
            useNewUrlParser: true
          })
        break;
    case 'production':
        mongoose.connect('MONGO_URL', {
            auth: {
              user: 'MONGO_DB_USER',
              password: 'MONGO_DB_PASSWORD'
            },
            useNewUrlParser:true
          })
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}

// body parser
app.use(require('body-parser').urlencoded({ extended: true }));

// setting and accessing cookies.
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}));

app.use(function(req, res, next){
        console.log('processing request for "' + req.url + '"....');
        next();
});

app.use('/about', function(req, res, next){
    console.log('test');
    next();
});

// csurf
app.use(require('csurf')({ cookie: true }));
app.use(function(req, res, next){
    res.locals._csrfToken = req.csrfToken();
    next();
});

app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    // handle CSRF token errors here
    res.status(403)
    res.send('403 forbidden')
})

// flash message
app.use(function(req, res, next){
        // if there's a flash message, transfer
        // it to the context, then clear it
        res.locals.flash = req.session.flash;
        delete req.session.flash;
        next();
});

// get
app.get('/', function(req, res){
    res.render('home', {
        featurette: [true, false, true]
    });
});

app.get('/detail', function(req, res){
    Article.find({ available: true }, function(err, articles){
        var data = {
            articles: articles.map(function(article){
                return {
                    title: article.title,
                    content: article.content,
                    images: article.images,
                }
            })
        };
	    res.render('detail', data);
    });
});

app.get('/form', function(req, res){
    res.render('form');
});

app.get('/about', function(req, res){
	res.render('about', {
		detail: detail.getDetail(),
		pageTestScript: 'qa/tests-about.js'
	
	} );
});

app.get('/nursery-rhyme', function(req, res){
        res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
        res.json({
                animal: 'squirrel',
                bodyPart: 'tail',
                adjective: 'bushy',
                noun: 'heck',
        });
});

app.get('/newsletter', function(req, res){
    // we will learn about CSRF later...for now, we just
    // provide a dummy value
    res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.get('/thank-you', function(req, res){
    res.render('thank-you');
});

app.get('/login', function(req, res){
    res.render('login');
});

// post
app.post('/process', function (req, res) {
    new Article({
        title: 'dummyTitle',
        content: 'dummyContent',
        images: 'dummyURL',
    }).save();
    res.redirect(303, '/thank-you');
});

// resource
app.use(express.static(__dirname + '/public'));

// custom 404 page
app.use(function(req, res){
	res.status(404);
	res.render('404');
});

app.use('/upload', function(req, res, next){
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function(){
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function(){
            return '/uploads/' + now;
        },
    })(req, res, next);
});

// custom 500 page
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});

// post
// slightly modified version of the official W3C HTML5 email regex:
// https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
        '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
        '(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$');

app.post('/newsletter', function(req, res){
    var name = req.body.name || '', email = req.body.email || '';
    // input validation
    if(!email.match(VALID_EMAIL_REGEX)) {
        if(req.xhr) return res.json({ error: 'Invalid name email address.' });
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was  not valid.',
        };
        return res.redirect(303, '/newsletter/archive');
    }
    // NewsletterSignup is an example of an object you might create;
    // since every implementation will vary, it is up to you to write these
    // project-specific interfaces.  This simply shows how a typical Express
    // implementation might look in your project.
    new NewsletterSignup({ name: name, email: email }).save(function(err){
        if(err) {
            if(req.xhr) return res.json({ error: 'Database error.' });
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            }
            return res.redirect(303, '/newsletter/archive');
        }
if(req.xhr) return res.json({ success: true });
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        return res.redirect(303, '/newsletter/archive');
    });
});

