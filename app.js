var express = require('express');
var handlebars = require('express-handlebars').create({ 
    defaultLayout: 'main',
});
var handlebars_sections = require('express-handlebars-sections');
var jqupload = require('jquery-file-upload-middleware');

var detail = require('./lib/detail.js');
var credentials = require('./credentials.js');
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

// body parser
app.use(require('body-parser').urlencoded({ extended: true }));

// setting and accessing cookies.
app.use(require('cookie-parser')(credentials.cookieSecret));

app.get('/', function(req, res){
	res.render('home');
});

app.get('/about', function(req, res){
	res.render('about', {
		detail: detail.getDetail(),
		pageTestScript: 'qa/tests-about.js'
	
	} );
});

app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
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

app.post('/process', function(req, res){
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
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
