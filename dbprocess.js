require('dotenv').config()
const mongoose = require('mongoose');
const request = require('request-promise-native');
const Store = require('./models/store');
require("./db/connectDB");
async function process() {
    try {

        let allstores = await Store.find({});
        for (const store of allstores) {
            if (!store.location.formattedAddress) {
                const options = {
                    method: 'GET',
                    uri: 'https://reverse.geocoder.ls.hereapi.com/6.2/reversegeocode.json?&mode=retrieveAddresses&prox=' + store.location.coordinates[1] + ',' + store.location.coordinates[0] + ',0&apiKey=OSELW0-Pw_Kq1W6pxw_0u1Xj1S8coASHiKEpYDGrLrE',
                    json: true
                };
                const response = await request(options)
                    .then(async (response) => {
                        console.log(store.location.coordinates)
                        console.log(JSON.stringify(response))
                        let address = JSON.stringify(response.Response.View[0].Result[1].Location.Address.Label);
                        let city = JSON.stringify(response.Response.View[0].Result[1].Location.Address.City);
                        store.address = address;
                        store.city = city;
                        await store.save()

                    })
                    .catch(error => {
                        console.log('\nCaught exception: ' + error);
                    })
            } else {
                store.address = store.location.formattedAddress;
                await store.save()
            }

        }
    } catch (error) {
        console.log(error)
    }

};
async function process2() {
    try {

        let allstores = await Store.find({});
        for (const store of allstores) {
            console.log(store.city)
        }
    } catch (error) {
        console.log(error)
    }

};
process2()