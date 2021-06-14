require('dotenv').config()
const axios = require("axios");
const log = require('../modules/logger');

module.exports = function getLonLat(address) {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                method: 'GET',
                url: 'https://geocode.search.hereapi.com/v1/geocode?q=' + encodeURI(address) + '&apiKey=' + process.env.HERE_API_KEY,
            }
            const response = await axios(options);
            if(response.status !== 200) throw new Error("geocode fail")
            let location = {};
            location.address = response.data.items[0].title;
            location.city = response.data.items[0].address.county;
            location.longitude = response.data.items[0].position.lon;
            location.latitude = response.data.items[0].position.lat;
            log.error(location);
            resolve(location)
        } catch (error) {
            reject(error)
        }
    })
}