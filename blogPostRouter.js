const express = require('express');
const router = express.Router();

const morgan = require('morgan');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const {BlogPosts} = require('./blogPostModel.js');

//create some data to see
BlogPosts.create('Chris Vo', 'How amazing he is', 'Himself', 'End of Time');
BlogPosts.create('My Laziness', 'How destructive it is', 'not him apparently,', 'Never');

router.get('/', (req,res) => {
    res.json(BlogPosts.get());
})

router.post('/', jsonParser, (req,res) => {
    const requiredFields = ['title','content','author','publishDate'];
    for(let i = 0; i < requiredFields.length; i++){
        let field = requiredFields[i];
        if(!(field in req.body)){
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    const item = BlogPosts.create(req.body.title, req.body.content, req.body.author, req.body.publishDate);
    res.status(201).json(item);
});

router.put('/:id',jsonParser, (req,res) => {
    const requiredFields = ['title','content','author','publishDate', 'id'];
    for(let i = 0; i < requiredFields.length; i++){
        let field = requiredFields[i];
        if(!(field in req.body)){
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    if((req.params.id !== req.body.id)){
        const message = (`Request path id (${req.params.id}) and request body id (${req.body.id}) must match`);
        console.error(message);
        return res.status(400).send(message);
    }
    
    console.log(`Updating Blog Post item \`${req.params.id}\``);
    const updatedItem = BlogPosts.update({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      publishDate: req.body.publishDate,
      id: req.params.id
    });
    res.status(204).end();

});

router.delete('/:id', (req,res) => {
    BlogPosts.delete(req.params.id);
    console.log(`Deleted shopping list item \`${req.params.ID}\``);
    res.status(204).end();
});

module.exports = router;