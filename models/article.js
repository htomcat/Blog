var mongoose = require('mongoose');
var articleSchema = mongoose.Schema({
    title: String,
    content: String,
    images: String,
});
articleSchema.methods.getDisplayPrice = function(){
    //return '$' + (this.priceInCents / 100).toFixed(2);
    return ''
};
var article = mongoose.model('Article', articleSchema);
module.exports = article;