var Browser = require('zombie'), assert = require('chai').assert;

var browser;

suite('Cross-Page Tests', function(){
    setup(function(){
        browser = new Browser();
    });

    test('requesting', function(done){
        var referrer = 'http://localhost:3000/tours/hood-river';
        broswer.visit(referrer, function(){
            browser.clickLink('.requestGroupRate', function(){
                assert(browser.field('referrer').value === referrer);
                done();
            });
        });
    });

    test('requesting', function(done){
        var referrer = 'http://localhost:3000/tours/oregon-coast';
        broswer.visit(referrer, function(){
            browser.clickLink('.requestGroupRate', function(){
                assert(browser.field('referrer').value === referrer);
                done();
            });
        });
    });

    test('visting', function(done){
        broswer.visit(referrer, function(){
            browser.visit('http://localhost:3000/tours/request-group-rate', function(){
                assert(browser.field('referrer').value === '');
                done();
            });
        });
    });
});
