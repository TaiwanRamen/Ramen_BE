# Taiwan Ramen Group

> A Node.js web application project making ramen lovers in taiwan finding their favorite ramen store around them more easily.

## Live Demo

To see the app in action, go to [https://ramen-group.herokuapp.com/](https://ramen-group.herokuapp.com//)

## Features

* Authentication:

  * User login with facebook oauth
  
  * User login with username and password

* Authorization:

  * One cannot manage stores and view user profile without being authenticated

  * One cannot edit or delete stores and comments and reviews created by other users

  * Admin can manage all stores,reviews and comments

* Manage stores:

  * Create, edit and delete stores, reviews and comments

  * User can give star review on each stores

  * Star reviews will show on index page for each store

  * User can upload store images

  * Images will be stored in imgur (later might migrate to amazon S3 server)

  * Display store location on mapbox map
  
  * User can search existing store with store name, relative location and city.

  * Pre-existing stores information are scraped from google map by using puppeteer.


* Manage users:

  * User can sign up through email/password, and facebook oath(facebook sign up is recommended)

  * User will get comfirmation email when signing up with email/password.

  * Provided link  has to be clicked in the comfirmation email by user in order to store user data in database.

  * Password can be reset via email confirmation

  * Profile page setup with sign-up

  * User can edit their information including avatar.


* Flash messages responding to users' interaction with the app

* Responsive web design

## Built with

### Front-end

* [ejs](http://ejs.co/)
* [Google Maps APIs](https://developers.google.com/maps/)
* [Bootstrap](https://getbootstrap.com/docs/3.3/)

### Back-end

* [express](https://expressjs.com/)
* [mongoDB](https://www.mongodb.com/)
* [mongoose](http://mongoosejs.com/)
* [async](http://caolan.github.io/async/)
* [crypto](https://nodejs.org/api/crypto.html#crypto_crypto)
* [helmet](https://helmetjs.github.io/)
* [passport](http://www.passportjs.org/)
* [passport-local](https://github.com/jaredhanson/passport-local#passport-local)
* [express-session](https://github.com/expressjs/session#express-session)
* [method-override](https://github.com/expressjs/method-override#method-override)
* [nodemailer](https://nodemailer.com/about/)
* [moment](https://momentjs.com/)
* [cloudinary](https://cloudinary.com/)
* [geocoder](https://github.com/wyattdanger/geocoder#geocoder)
* [connect-flash](https://github.com/jaredhanson/connect-flash#connect-flash)

### Platforms

* [Cloudinary](https://cloudinary.com/)
* [Heroku](https://www.heroku.com/)
* [Cloud9](https://aws.amazon.com/cloud9/?origin=c9io)
## License

#### [MIT](./LICENSE)
## Undos
v Image corousel  
v show page info => SPA 
v  store edit, add page fix and put route fix 
*  notification route not found
*  edit and add  page can add multiple images
*  index page map show
*  navbar to sidebar?
*  index page city tag search
*  index page soup taste search
*  fig edit review ui
*  add new store proximity search($near)
*  showpage review put into infoBtn for long review with pictures
*  pagenation
*  click review arthor can see all his reviews
*  store unsent review inside browser sessionStorage https://www.w3schools.com/html/html5_webstorage.asp
