"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//schema to represent a blog post
const blogPostSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {
        firstName: String,
        lastName: String
    },
    created: {type: Date, default: Date.now}
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
        created: this.created
    }
}

const Blog = mongoose.model("Blog", blogPostSchema);

module.exports = {Blog};