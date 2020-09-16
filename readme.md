# Taiwan Ramen Group

> A Node.js web application project making ramen lovers in taiwan finding their favorite ramen store around them more easily.

## Live Demo

To see the app in action, go to [https://ramen-group.herokuapp.com/](https://ramen-group.herokuapp.com/)

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

## Technologies Used:
* HTML5 - markup language for creating web pages and web applications
* CSS3 - used for describing the presentation of a document written in a markup language
* Bootstrap4 - free and open-source front-end web framework for designing websites and web applications quickly
* jQuery - cross-platform JavaScript library designed to simplify the client-side scripting of HTML
* DOM Manipulation - is a platform and language-neutral interface that allows programs and scripts to dynamically access and update the content, structure, and style of a document
* Node.js - pen-source, cross-platform JavaScript run-time environment for executing JavaScript code server-side
* Express.js - for building web applications and APIs and connecting middleware
* REST - REST (REpresentational State Transfer) is an architectural style for developing web services
* MongoDB - open-source cross-platform document-oriented NoSQL database program to store details like users info, campgrounds info and comments
* NodeMailer - module for Node.js applications to allow easy as cake email sending. Used with gmail smtp survice to send email to user.
* PassportJS - authentication middleware for Node.js. Extremely flexible and modular, Passport can be unobtrusively dropped in to any Express-based web application
* Data Associations - associating user data with the respective campgrounds and comments using reference method
* Heroku - cloud platform as a service used as a web application deployment model
and more...

## Built with

### Front-end

* [ejs](http://ejs.co/)
* [mapbox map api](https://docs.mapbox.com/api/)
* [Bootstrap](https://getbootstrap.com/docs/4/)

### Back-end

* [express](https://expressjs.com/)
* [mongoDB](https://www.mongodb.com/)
* [mongoose](http://mongoosejs.com/)
* [async](http://caolan.github.io/async/)
* [bcryptjs](https://www.npmjs.com/package/bcryptjs)
* [passport](http://www.passportjs.org/)
* [passport-local](https://github.com/jaredhanson/passport-local#passport-local)
* [passport-facebook](https://github.com/jaredhanson/passport-facebook)
* [express-session](https://github.com/expressjs/session#express-session)
* [method-override](https://github.com/expressjs/method-override#method-override)
* [nodemailer](https://nodemailer.com/about/)
* [moment](https://momentjs.com/)
* [imgur](https://api.imgur.com/)
* [here-geocoder](https://developer.here.com/)
* [connect-flash](https://github.com/jaredhanson/connect-flash#connect-flash)

### Database

* [mongoDB Atlas](https://cloud.mongodb.com/)

### Platforms

* [imgur](https://api.imgur.com/)
* [Heroku](https://www.heroku.com/)

# Progress
2020/09/07
![image](https://i.imgur.com/Tqq5M4D.png)
finished map on index page, map to chinese, ramen icon

2020/09/08

got some change in index map, put searchbar in map, setup session storage to store currently get stores, add fix nav'

2020/09/13
finish notification
## Undos
v Image corousel  
v show page info => SPA 
v  store edit, add page fix and put route fix 
x  mongoDB ip restriction (need SSL)
v  pagenation
x  sanitize and escape any input
v  navbar make fix
v  delete navebar homebage button
*  picture resize to fit in show page
*  index page stores sorting 
v  notification route not found
*  edit and add  page can add multiple images
v  index page map show
*  navbar to sidebar?
*  index page city tag search
*  index page soup taste search(using tag)
*  store open time
v  fix edit review ui
v  add new store proximity search($near)
*  showpage review put into infoBtn for long review with pictures
*  click review arthor can see all his reviews
*  store unsent review inside browser sessionStorage or localStorage? https://www.w3schools.com/html/html5_webstorage.asp
v  find store througe navigating through map
* 


* 加入index預先顯示灰色的block，

## License

#### [MIT](./LICENSE)