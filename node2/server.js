const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Restaurant = require('./model/restaurant.model.js');
const User = require('./model/user.model.js');
const expressValidator = require('express-validator');
const fs = require('fs');
const formidable = require('formidable');
const app = express();
const session = require('express-session');
const mongourl = 'mongodb+srv://lauwa:1027@cluster0-7cnzq.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'test';
const Joi = require('joi');
const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;
const validateScheme = require('./model/validate.js');

//CONECTING DB// APP CONFI
mongoose.connect(mongourl,
 function(err) {
  if (err) {
    throw err;
  }else{
    console.log("connected");
  }
});

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const key1 = "I go to school by bug";
const key2 = "since 2017";
app.use(session({
  name:'session',
  secret: 'secret',
  key:[key1,key2],
  saveUninitialized: false,
  resave: false,
  maxAge: 2 * 60 * 60 * 1000
}));

const redirectLogin = (req,res,next) => {
  if(!req.session.authenticated){
    res.redirect('login');
  }else{
    next();
  }
};

app.get('/', redirectLogin,(req, res) => {
  res.redirect('/restaurants');
})

//LOGIN
app.get('/login', (req, res) => {
  res.render('login');
})

//Register
app.get('/register',(req, res) => {
  res.render('register');
});
app.post('/register',(req, res) => {
  const result = Joi.validate(req.body, validateScheme);
  if(result.error){
    console.log(result.error);
    res.status(400).send(result.error.details[0].message);
  }
  User.findOne({name:req.body.name}).exec(function (err, user) {
    if(user){
      res.send("User exist!")
    }else{
      let user = new User(req.body);
      user.save(function (err) {
        if (err) return handleError(err);
        // saved!
        res.send("success");
    })
  }
  });
});

app.post('/login', (req, res) => {
  User.findOne({name:req.body.name}).exec(function (err, user) {
    if(!user){
      res.send("User is not exist!");
    }else{
      if(user.name == req.body.name && user.password == req.body.password){
        req.session.authenticated = true;
        req.session.username = user.name;
        res.redirect('restaurants');
      }else{
        res.send("Password is not correct!");
      }
    }
  });
});

app.get('/logout', (req, res) => {
  console.log(req.session.authenticated);
  console.log(req.session.username);
  req.session.authenticated = false;
  req.session.username = "";
  res.redirect('/');
});

app.get('/search', function (req, res) {
	var q = req.query.q;
  console.log(q)

	// PARTIAL TEXT SEARCH USING REGEX
	Restaurant.find({
    $text: {$search: new RegExp(q)
		}}, function (err, data) {
        console.log(data);
		    res.json(data);
	});
});

app.get('/restaurants', redirectLogin, (req, res) => {
  //RETRIEVING ALL RESTARUANTS
  Restaurant.find({}, (error, restaurants) => {
    if (error) {
      console.log(error);
    } else {
      res.render('restaurants', { restaurants: restaurants});
    }
  });

});

//NEW ROUTE
app.get('/restaurants/new', redirectLogin, (req, res) => {
  res.render('new')
})


//CREATE
app.post('/restaurants', (req, res) => {
  const form = new formidable.IncomingForm();
   form.parse(req, (err, fields, files) => {
     let new_r = {};
     new_r['name'] = fields.name;
     new_r['borough'] = fields.borough;
     new_r['cuisine'] = fields.cuisine;
     new_r['address.street']= fields.street;
     new_r['address.building'] = fields.building;
     new_r['address.zipcode'] = fields.zipcode;
     new_r['address.coord'] = [fields.Latitude, fields.Longitude];
     new_r['owner'] = req.session.username;

     if(files.filetoupload.size > 0){
       console.log(files.filetoupload.path);
       const filename = files.filetoupload.path;
       let mimetype = "images/jpeg";
       if (files.filetoupload.type) {
         mimetype = files.filetoupload.type;
       }
       fs.readFile(files.filetoupload.path, (err,data) => {
         assert.equal(err,null);
         new_r['photo_mimetype'] = mimetype;
         new_r['photo'] = new Buffer.from(data).toString('base64');
         console.log(new_r);
          var restaurant = new Restaurant(new_r);
          restaurant.save(function (err, result) {
            if (err) return handleError(err);
            // saved!
            console.log(result);
            res.status(302).redirect(`/restaurants/${result._id}`);
          });
     })
   }else{
     console.log(new_r);
     console.log(new_r.address);
      var restaurant = new Restaurant(new_r);
      restaurant.save(function (err, result) {
        if (err) return handleError(err);
        // saved!
        console.log(result);
        res.status(302).redirect(`/restaurants/${result._id}`);
      });
   }
    })
  })
  //SHOW ROUTE
app.get('/restaurants/:id', (req, res) => {
  Restaurant.findById(req.params.id, (error, foundRestaurant) => {
    if (error) {
      res.redirect('/restaurants')
    } else {
      res.status(200).render('show', { restaurant: foundRestaurant });
    }
  })
});
//Rate
app.get('/restaurants/rate/:id', (req, res) => {
  let id = ObjectID(req.params.id);
  Restaurant.findOne({$and:[{"grades.user": req.session.username}, {_id:id}]}, (error, foundRestaurant) => {
    assert.equal(error,null);
    if(foundRestaurant){
      console.log(foundRestaurant);
      res.status(401).render('handleMessage.ejs', {message:"Your already Rated!"});
    }else{
      Restaurant.findById(req.params.id, (error, result) => {
       assert.equal(error,null);
       res.render('rate', { restaurant: result });
     });
   };
 });
});

app.put('/restaurants/rate/:id', (req, res) => {
  Restaurant.findById(req.params.id, (error, foundRestaurant) => {
    assert.equal(error,null);
    foundRestaurant.grades.push({user:req.session.username, score: req.body.score});
    foundRestaurant.save(function(err, updatedResult) {
       assert.equal(err,null);
       res.status(302).redirect(`/restaurants/${req.params.id}`);
     })
  });
});
//EDIT
app.get('/restaurants/:id/edit', (req, res) => {
  Restaurant.findById(req.params.id, (error, foundRestaurant) => {
    assert.equal(error,null);
    if(foundRestaurant.owner == req.session.username){
      res.render('edit', { restaurant: foundRestaurant });
    }else{
      res.status(401).render('handleMessage.ejs', {message:"Not your restaurant"});
    }
  })
});

//UPDATE ROUT
app.put('/restaurants/:id', (req, res) => {
  console.log(req.params.id);
  const form = new formidable.IncomingForm();
   form.parse(req, (err, fields, files) => {
     let id = new ObjectID(req.params.id);
     Restaurant.findOne({_id:id}, (err, result) => {
       assert.equal(err,null);
       result.name = fields.name;
       result.borough = fields.borough;
       result.cuisine = fields.cuisine;;
       result.address.street = fields.street;
       result.address.building = fields.building;
       result.address.zipcode = fields.zipcode;
       result.address.coord = [fields.Latitude, fields.Longitude];
       if(files.filetoupload.size > 0){
         console.log(files.filetoupload.path);
         const filename = files.filetoupload.path;
         let mimetype = "images/jpeg";
         if (files.filetoupload.type) {
           mimetype = files.filetoupload.type;
         }
         fs.readFile(files.filetoupload.path, (err,data) => {
           assert.equal(err,null);
           result.photo_mimetype = mimetype;
           result.photo = new Buffer.from(data).toString('base64');
           result.save(function(err, updatedResult) {
            assert.equal(err,null);
              res.status(302).redirect(`/restaurants/${id}`);
            })
         });
     }else{
       result.save(function(err, updatedResult) {
        assert.equal(err,null);
          res.status(302).redirect(`/restaurants/${id}`);
       })
      }
    });
  });
});


//DELETE ROUTE
app.delete('/restaurants/:id', (req, res) => {
  //DESTROY
  console.log(req.params.id);
  Restaurant.findById(req.params.id, (error, foundRestaurant) => {
    assert.equal(error,null);
    console.log(foundRestaurant);
    if(foundRestaurant.owner == req.session.username){
      Restaurant.findByIdAndDelete(req.params.id, (error) => {
          assert.equal(error,null);
          res.status(302).redirect('/restaurants');
      });
    }else{
      res.status(401).render('handleMessage.ejs', {message:"Not your restaurant"});
    }
  });
});

//MAP ROUTE
app.get('/map', redirectLogin,(req, res) => {
  res.render('gmap.ejs', {
    lat: req.query.lat,
    lon: req.query.lon,
    zoom: req.query.zoom ? req.query.zoom : 15
  });
  console.log(req.query.lat);
});

app.listen(process.env.PORT || 8098);
