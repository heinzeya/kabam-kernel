var mwcCore = require('./../index.js');
//setting up the config
var MWC = mwcCore(require('./config.json')[(process.env.NODE_ENV) ? (process.env.NODE_ENV) : 'development']);

MWC.extendCore('getSum',function(a,b){return a+b;});


//set global lever variables for expressJS application
MWC.extendApp(['development', 'staging'], function (core) {
  core.app.set('TempVar', '42');
});


MWC.extendModel('Cats', function (mongoose, config) {
  var CatsSchema = new mongoose.Schema({
    'nickname': String
  });

  CatsSchema.index({
    nickname: 1
  });

  return mongoose.model('cats', CatsSchema);
});

//set middleware for development and staging enviroments
MWC.extendMiddlewares(['development', 'staging'], function (core) {
  return function (req, res, next) {
    res.setHeader('X-Production', 'NO!');
    next();
  };
});
//we add some routes
MWC.extendRoutes(
  function (core) {
    core.app.get('/', function (req, res) {
      var authByGoogleString = (req.user)?'<li><a href="/my">See your profile</a></li>':'<li><a href="/auth/google">Auth by google</a></li>';

      res.send('<html>' +
        '<head>MyWebClass Core Example</head>' +
        '<body>' +
        '<p>TempVar is ' + core.app.get('TempVar') + '</p>' +
        '<p>Hello, friend! You can do this things:</p><ul>' +
        '<li>See current <a href="/time">time</a>.</li>' +
        '<li>See <a href="/team">team</a> on this server.</li>' +
        '<li>See all <a href="/redis">redis</a> keys stored.</li>' +
        authByGoogleString +
        '<li>See this server <a href="/config">parameters</a>.</li>' +
        '<li>See users <a href="/api/users">api endpoint</a> on this server.</li>' +
        '<li>See <a href="/plugins">plugins</a> installed on this server.</li>' +
        '<li><a href="/honeypot">Notify</a> admin of your presense.</li>' +
        '<li>See this application <a href="https://github.com/mywebclass/mwc_plugin_example">source on Github</a></li>' +
        '</ul></body>' +
        '</html>');
    });

    //we use Mongoose Model in this route
    core.app.get('/team', function (request, response) {
      request.model.Users.find({active: 1}, function (err, users) {
        if (err) {
          throw err;
        }
        response.json({'Team': users});
      });
    });
    //we use exposed Redis client. In a rather stupid way.
    core.app.get('/redis', function (request, response) {
      request.redisClient.keys('*', function (err, keys) {
        response.json(keys);
      });
    });

    //making mousetrap - when user visits this url, MWC emmits the event
    core.app.get('/honeypot', function (request, response) {
      request.emitMWC('honeypot accessed', 'Somebody with IP of ' + request.ip + ' accessed the honeypot');
      response.send('Administrator was notified about your actions!');
    });

    core.app.get('/kittens',function(request,response){
      request.model.Cats.find({},function(err,cats){
        if(err) throw err;
        response.json(cats);
      });
    });

    core.app.get('/dogs',function(request,response){
      request.model.Dogs.find({},function(err,dogs){
        if(err) throw err;
        response.json(dogs);
      });
    });

  }
);

//injecting plugin as an object
MWC.usePlugin({
  'extendCore': null, //can be ommited
  'extendModel':{'Dogs':function (mongoose, config) {
    var DogsSchema = new mongoose.Schema({
      'nickname': String
    });
    DogsSchema.index({
      nickname: 1
    });
    return mongoose.model('dogs', DogsSchema);
  }},
  'extendApp': null, //can be ommited
  'extendMiddlewares': null, //can be ommited
  'extendRoutes': function (core) {
    core.app.get('/newPlugin', function (req, res) {
      res.send('New plugin is installed as object');
    });
  }
});

//try{
//  //injecting plugin as an name of installe npm package!
//  MWC.usePlugin('mwc_plugin_example');
//} catch (e){
//  if(e.code === 'MODULE_NOT_FOUND'){
//    console.error('mwc_plugin_example is not installed.');
//  }
//}

//listening of MWC events. 'Coocoo!' is emmited by mwc_plugin_example every 5 seconds
MWC.extendListeners('Coocoo!',function (message) {
  console.log('Coocoo! Coocoo! ' + message);
});

MWC.extendListeners('honeypot accessed',function (message) {
  console.log('Attention! Somebody tries to hack us! ' + message);
});


//binding application to port
MWC.listen();

//testing custom function defined on line 10
console.log('Sum of 2 and 2 is ' + MWC.getSum(2, 2));


setInterval(function () {
  MWC.emit('Coocoo!', 'Time now is ' + (new Date().toLocaleTimeString()));
}, 5000);


setTimeout(function(){
  MWC.model.Cats.create({nickname:'Chubais'},function(err,cat){
    if(err) throw err;
    if(cat){
      console.log('Skoro tolko koshki rodyatsya!');
      console.log('Happy birthday, '+cat.nickname);
    }
  });
},5000);

setTimeout(function(){
  MWC.model.Dogs.create({nickname:'Laika'},function(err,dog){
    if(err) throw err;
    if(dog){
      console.log('Happy birthday, '+dog.nickname);
    }
  });
},4000);