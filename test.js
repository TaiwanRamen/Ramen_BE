const Store = require('./models/store');

//connect DB
require("./db/connectDB");
async function go() {

    let lng = 121.519;
    let lat = 25.027;

    let foundStore = await Store.aggregate([{
        '$geoNear': {
            'near': {
                'type': 'Point',
                'coordinates': [lng, lat]
            },
            'spherical': true,
            'distanceField': 'dist',
            'maxDistance': 800 //in meter
        }
    }])
    console.log(foundStore)

}
go()