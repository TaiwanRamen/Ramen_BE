require('dotenv').config()
const request = require('request-promise-native');

module.exports = function getLonLat(address) {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                method: 'GET',
                uri: 'https://geocode.search.hereapi.com/v1/geocode?q=' + encodeURI(address) + '&apiKey=' + process.env.HERE_API_KEY,
                json: true
            }
            const response = await request(options)
            let location = {};
            location.address = response.items[0].title;
            location.city = response.items[0].address.county;
            location.longitude = response.items[0].position.lng;
            location.latitude = response.items[0].position.lat;
            resolve(location)
        } catch (error) {
            reject(error)
        }
    })
}