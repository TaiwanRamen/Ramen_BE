const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    Store = require('../../models/store');

// request parameter:
// req.query:?page=3
router.get('/', async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;
        let noMatch = null;
        //fuzzy search
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');

            //search from all the fields included in $or
            const allStores = await Store.find({
                $or: [
                    { name: regex },
                    { city: regex },
                    { descriptionText: regex },
                ],
            }).collation({ locale: 'zh@collation=zhuyin' })
                .sort({ rating: -1, city: 1 })
                .skip((perPage * pageNumber) - perPage).limit(perPage).exec();
            const count = await Store.countDocuments({
                $or: [
                    { name: regex },
                    { city: regex },
                    { descriptionText: regex },
                ],
            }).exec()

            if (allStores.length < 1) {
                req.flash("error", "Store no found");
                return res.redirect("back");
            }
            res.render("stores/index", {
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                noMatch: noMatch,
                search: req.query.search
            });

        } else {
            //get all stores from DB
            const allStores = await Store.find().collation({ locale: 'zh@collation=zhuyin' })
                .sort({ rating: -1, city: 1 }).skip((perPage * pageNumber) - perPage).limit(perPage).exec();;
            const count = await Store.countDocuments().exec();

            res.render("stores/index", {
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                noMatch: noMatch,
                search: false
            });
        }
    } catch (error) {
        console.log(error)
    }
});

module.exports = router