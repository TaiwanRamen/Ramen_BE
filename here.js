require('dotenv').config()
const request = require('request-promise-native');
let address = '新北市中和區秀峰街103巷6弄1號';
async function getLonLat() {
    const options = {
        method: 'GET',
        uri: 'https://geocode.search.hereapi.com/v1/geocode?q=' + encodeURI(address) + '&apiKey=' + process.env.HERE_API_KEY,
        json: true
    }
    const response = await request(options)
        .then(response => {
            //console.log(JSON.stringify(response))
            return JSON.stringify(response)
        })
        .catch(error => {
            console.log('\nCaught exception: ' + error);
        })
    return response
}


var lonlat = getLonLat()
console.log(lonlat)