var detail = require('../lib/detail.js');
var expect = require('chai').expect;

suite('Detail tests', function(){
    test('getDetail() should return a collect character', function(){
        expect(typeof detail.getDetail() === 'string');
    });
});
