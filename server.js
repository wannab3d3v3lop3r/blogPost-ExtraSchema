"use strict";

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { PORT, DATABASE_URL} = require('./config');
const { Blog } = require('./models');

mongoose.Promise = global.Promise;

// const bodyParser = require('body-parser');
// const jsonParser = bodyParser.json();

const app = express();
app.use(express.json());

app.get('/posts',(req,res) => {
    Blog
        .find()
        .then(blogs => {
            res.json(blogs.map(blog => blog.serialize()))
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        })
});

app.get('/post/:id',(req,res) => {
    Blog
        .findById(req.params.id)
        .then(blog => res.json(blog.serialize()))
        .catch(err =>{
            console.log(err);
            res.status(400).json({message: `Internal server error`})
        });
});

app.post('/posts',(req,res) => {
    const requiredFields = ['title','content','author'];
    for(let i = 0; i < requiredFields.length; i++){
        const field = requiredFields[i];
        if(!(field in req.body)){
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            res.status(400).send(message);
        }
    }

    Blog
        .create({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
        })
        .then(blogPost => res.status(201).json(blogPost.serialize()))
        .catch(err =>{
            console.error(err);
            res.status(400).json({error: `Internal server error`})
        });
});

app.put('/posts/:id', (req,res) => {

    if(!(req.params.id && req.body.id && req.params.id === req.body.id)){
        const message = `Request path id and request body id values must match`;
        console.error(message);
        res.status(400).send(message);
    }

    const toUpdate = {};
    const updateableFields = ['title','content','author'];
    updateableFields.forEach(field => {
        if(field in req.body){
            toUpdate[field] = req.body[field];
        }
    })

    Blog
        .findByIdAndUpdate(req.params.id, {$set: toUpdate})
        .then(updatedPost => { res.status(204).end()})
        .catch(err => { res.status(500).json({message: `Internal server error`})});
});

app.delete('/posts/id', (req,res) =>{
    Blog
        .findByIdAndRemove(req.params.id)
        .then(() => res.status(204).end())
        .catch(err => res.status(500).json({message: `Internal server error`}))
})


// catch-all endpoint if client makes request to non-existent endpoint
app.use('*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
  });
  
  // closeServer needs access to a server object, but that only
  // gets created when `runServer` runs, so we declare `server` here
  // and then assign a value to it in run
  let server;
  
  // this function connects to our database, then starts the server
  function runServer(databaseUrl, port = PORT) {
  
    return new Promise((resolve, reject) => {
      mongoose.connect(databaseUrl, err => {
        if (err) {
          return reject(err);
        }
        server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
          .on('error', err => {
            mongoose.disconnect();
            reject(err);
          });
      });
    });
  }
  
  // this function closes the server, and returns a promise. we'll
  // use it in our integration tests later.
  function closeServer() {
    return mongoose.disconnect().then(() => {
      return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }
  
  // if server.js is called directly (aka, with `node server.js`), this block
  // runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
  if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
  }
  
  module.exports = { app, runServer, closeServer };
  