"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const commentSchema = mongoose.Schema({content: 'string'});

//schema to represent a blog post
const blogPostSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'Author'},
    comments: [commentSchema]
});

const authorSchema = mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    userName: {type: String, required: true, unique: true}
});

blogPostSchema.virtual('authorName').get(function(){
    return `${this.author.firstName} ${this.author.lastName}`.trim();
})

blogPostSchema.methods.serialize = function(){
    return {
        id: this._id,
        title: this.title,
        content: this.content,
        author: this.authorName,
        comments: this.comments
    }
}

blogPostSchema.pre('find', function(next){
    this.populate('author');
    next();
})

blogPostSchema.pre('findOne', function(next){
    this.populate('author');
    next();
})


authorSchema.virtual('authorName').get(function(){
    return `${this.author.firstName} ${this.author.lastName}`.trim();
})

const Blog = mongoose.model("Blog", blogPostSchema);
const Author = mongoose.model("Author",authorSchema);

module.exports = {Blog, Author};