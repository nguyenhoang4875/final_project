

## How It Works<a name="how-it-works"></a>
### Setup Configurations<a name="configurations"></a>
The configurations on production will be assigned from Environment Variables on Heroku, while the development configurations reside inside _app/config/config.json_ file.

#### MongoDB & MongoLab
You need to create a database on MongoLab, then create a database user, get the `MongoDB URI`, and assign it to `dbURI`.

#### Facebook & Twitter
You need to register a new application on both Facebook and Twitter to get your tokens by which users can grant access to your application, and login using their social accounts.

##### Registering the app on Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Add new app, and fill the required information.
3. Get your `App ID`, `App Secret`.
4. Go to Add Product -> Facebook Login -> Valid OAuth redirect URIs
5. Add Valid Callback URIs
6. Go to App Review -> Make your application public.

Now, you can assign the `App ID` to `facebookClientID`, and `App Secret` to `facebookClientSecret`.
##### Registering the app on Twitter
1. Go to [Twitter Apps](https://apps.twitter.com/)
2. Create new app, and fill the required information.
3. Add Website & Callback URL
4. Get your `Consumer Key`, `Consumer Secret`.

Now, you can assign the `Consumer Key` to `twitterConsumerKey`, and `Consumer Secret` to `twitterConsumerSecret`.

##### The Callback URL
- It can point back to your localhost; _[http://localhost:3000/auth/facebook/callback](http://localhost:3000/auth/facebook/callback)_

- When deploy to Heroku, you will have something look like this; _[http://my-chat-app.herokuapp.com/auth/facebook/callback](http://my-chat-app.herokuapp.com/auth/facebook/callback)_

#### Session
The session needs a random string to make sure the session id in the browser is random. That random string is used to encrypt the session id in the browser, _Why?_ To prevent session id guessing.


### Database<a name="database"></a>
Mongoose is used to interact with a MongoDB that's hosted by MongoLab. 

#### Schemas
There are two schemas; users and rooms. 

Each user has a username, passowrd, social Id, and picture. If the user is logged via username and password, then social Id has to be null, and the if logged in via a social account, then the password will be null.

Each room has a title, and array of connections. Each item in the connections array represents a user connected through a unique socket; object composed of _{userId + socketId}_. Both of them together are unique.

### Models<a name="models"></a>
Each model wraps Mongoose Model object, overrides and provides some methods. There are two models; User and Room.

### Session<a name="session"></a>
Session in Express applications are best managed using [express-session](https://github.com/expressjs/session) package. Session data are stored locally on your computer, while it's stored in the database on the production environment. Session data will be deleted upon logging out.

### User Authentication<a name="auth"></a>
User can login using either a username and password, or login via a social account. User authentication is done using [Passport](https://github.com/jaredhanson/passport). Passport has extensive, and step-by-step [documentation](http://passportjs.org/docs/) on how to implement each way of authentication.

### Sockets<a name="sockets"></a>
Having an active connection opened between the client and the server so client can send and receive data. This allows real-time communication using TCP sockets. This is made possible by [Socket.io](https://github.com/socketio/socket.io).

The client starts by connecting to the server through a socket(maybe also assigned to a specific namespace). Once connections is successful, client and server can emit and listen to events. 

There are two namespaces used; `/rooms` and `/chatroom`.

### Logger<a name="logger"></a>
And It doesn't go without saying, you need to monitor your application. [Winston](https://github.com/winstonjs/winston) can log and catch Uncaught Exceptions. All logs are displayed in the console, and saved in _debug.log_ file. 

On Heroku, you can monitor the logs by clicking on _More -> View Logs_ on the top left of your application dashboard.

## Support <a name="support"></a>
I've written this script in my free time during my studies. If you find it useful, please support the project by spreading the word.

## Contribute <a name="contribute"></a>

Contribute by creating new issues, sending pull requests on Github or you can send an email at: omar.elgabry.93@gmail.com

## License <a name="license"></a>
Built under [MIT](http://www.opensource.org/licenses/mit-license.php) license.


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FOmarElGabry%2Fchat.io.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FOmarElGabry%2Fchat.io?ref=badge_large)