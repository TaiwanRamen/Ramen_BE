const mongoose = require('mongoose');
const Store = require('./models/store');
require("./db/connectDB")
async function go() {
    let stores = await Store.find({});
    for (const store of stores) {
        if (/[\s\S]*\(/.test(store.name)) {
            let toDelete = store.name.match(/\([\s\S]*\)/);
            name = store.name.replace(toDelete, '')
            await console.log(name)
        } else {
            await console.log(store.name)
        }
    }
}
go();