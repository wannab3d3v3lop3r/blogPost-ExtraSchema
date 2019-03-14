"use strict";

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL} = require('./config');
const { Blog, Author } = require('./models');

const app = express();
app.use(express.json());

app.get('/posts',(req,res) => {
    Blog
        .find()
        .then(blogs => {
            res.json(blogs.map(blog => {
              return {
                //unable to use serialize because comments is in the serialize function
                id: blog._id,
                title: blog.title,
                content: blog.content,
                author: blog.author
              }
            }))
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        })
});

app.get('/post/:id',(req,res) => {
    Blog
        .findById(req.params.id)
        .then(blog => res.json({
            id: blog._id,
            title: blog.title,
            content: blog.content,
            author: blog.author,
            comments: blog.comments
          })
        )
        .catch(err =>{
            console.log(err);
            res.status(500).json({message: `Internal server error`})
        });
});

app.post('/posts',(req,res) => {
    const requiredFields = ['title','content','author_id'];
    for(let i = 0; i < requiredFields.length; i++){
        const field = requiredFields[i];
        if(!(field in req.body)){
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            res.status(400).send(message);
        }
    }

    //collection
    Author
      //find document with certain iD
      .findById(req.body.author_id)
      //resolve if author iD matches
      .then(author)
      console.log(`author is ${author}`)
        //if it does exist
        if(author){
          //create the post using the Blog Schema
          Blog
          .create({
              title: req.body.title,
              content: req.body.content,
              author: req.body.id,
          })
          //then return back to the client side with a 201 status code
          .then(blogPost => res.status(201).json(
            { id: blogPost._id,
              title: blogPost.title,
              content: blogPost.content,
              author: `${blogPost.author.firstName} ${blogPost.author.lastName}`,
              comments: blogPost.comments}
          ))
          .catch(err =>{
              console.error(err);
              res.status(400).json({error: `Internal server error`})
          });
        }
});

app.put('/posts/:id', (req,res) => {

    if(!(req.params.id && req.body.id && req.params.id === req.body.id)){
        const message = `Request path id and request body id values must match`;
        console.error(message);
        res.status(400).send(message);
    }

    const toUpdate = {};
    const updateableFields = ['title','content'];
    updateableFields.forEach(field => {
        if(field in req.body){
            toUpdate[field] = req.body[field];
        }
    })

    Blog
        .findByIdAndUpdate(req.params.id, {$set: toUpdate}, {new: true})
        .then(updatedPost => { res.status(204).json({
          id: updatedPost.id,
          title: updatedPost.title,
          content: updatedPost.content
        })})
        .catch(err => { res.status(500).json({message: `Internal server error`})});
});

app.delete('/posts/id', (req,res) =>{
    Blog
        .findByIdAndRemove(req.params.id)
        .then(() => res.status(204).end())
        .catch(err => res.status(500).json({message: `Internal server error`}))
})

app.get('/authors',(req,res) => {

  //collection
  Author
  //returns all of the databases
    .find()
    //what to do with the databases
    .then(authors => {
      //return in json form an array of objects of individual documents by using the array method map
      res.json(authors.map(author => {
        return {
          id: author.id,
          name: `${author.firstName} ${author.lastName}`,
          userName: author.userName
        }
      }))
    })
    .catch(err => {
      console.error(err);
      res.status(500).send({message: 'Internal server error'})
    })

})

app.post('/authors', (req,res) => {
  //valiating items
  const requiredFields = ['firstName','lastName','userName'];
  //check to see if the req.body has the validating keys
  requiredFields.forEach(field => {
    if(!(field in req.body)){
      let message = `Missing \`${field}\` in request body`
      console.error(message);
      res.status(400).send(message);
    }
  });

  Author
    //dont forget that when .find() finds all
    //When looking for a particular item, it takes in objects
    .findOne({userName: req.body.userName})
    //returns all the documents, IN THIS CASE, its returning only one since the .find() is looking for a particular document
    .then(authors => {
      //If author statement holds true, dont forget you don't need to compare types/data, you can use if loops to see if it holds
      //If author statement holds true, means that the username is already in the database, respond with error message
      if(authors){
        let message = `username already taken`;
        console.error(message);
        res.status(400).send(message);
      }
      //if false, create document
      else{
        Author
          .create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            userName: req.body.userName
        })
          .then(author =>{
            res.status(201).json({
              //_id is used in mongo, not in server.js
              id: author.id,
              name: `${author.firstName} ${author.lastName}`,
              userName: author.userName
            })
          })
          .catch(err => {
            console.log(error);
            res.status(500).json({err: 'Internal Server Error'});
          })
      }
    })  
})
app.put('/authors/:id', (req,res) => {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)){
    const message = `Request path id and request body id values must match`;
    console.error(message);
    res.status(400).send(message);
}

const toUpdate = {};
const updateableFields = ['firstName','lastName','userName'];

updateableFields.forEach(field => {
    if(field in req.body){
        toUpdate[field] = req.body[field];
    }
})

Author
    //finds the particular userName or if its empty or if the id is not the matched id
    // $ne = not equals in a set
    .findOne({userName: toUpdate.userName || '', _id: { $ne: req.params.id }, useNewUrlParser: true})
    .then(author => {
      if(author){
        let message = 'username already taken';
        console.error(message);
        res.status(400).send(message);
      }
      else{
        Author.findByIdAndUpdate(req.params.id, {$set: toUpdate})
        .then(updatedAuthor => { 
          res.status(204).json({
            id: updatedAuthor.id,
            name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
            username: updatedAuthor.userName
        });
      })
        .catch(err => res.status(500).json({message: err}));
      }
    });
});

app.delete('/authors/:id', (req,res) => {
  Blog
  .findByIdAndRemove(req.params.id)
  .then(author => {
    Author
      .findByIdAndRemove(req.params.id)
      .then(() =>{
        console.log(`Deleted blog posts owned by author with id \`${req.params.id}\``)
        res.status(204).end()
      })
  })
  .catch(err => res.status(500).json({error: `Success`}))
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
  