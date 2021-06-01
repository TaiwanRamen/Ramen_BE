const express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    log = require('../../modules/logger'),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    passport = require('passport'),
    passportJWT = passport.authenticate('jwt', {session: false}),
    dataValidation = require('../../middleware/dataValidate'),
    middleware = require('../../middleware'),
    {startSession} = require('mongoose'),
    response = require('../../modules/response-message');


router.post('/registerStoreOwner', passportJWT, middleware.isAdmin, dataValidation.registerOrRemoveStoreOwner,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            console.log(req.body.storeId);
            console.log(req.body.storeOwnerId)
            let store = await Store.findById(req.body.storeId).session(session);
            let user = await User.findById(req.body.storeOwnerId).session(session);

            if (!store) throw new Error("找不到店家");

            if (!store.owners.includes(req.body.storeOwnerId) && !user.hasStore.includes(req.body.storeId)) {
                store.owners.push(req.body.storeOwnerId);
                user.hasStore.push(req.body.storeId);

            } else {
                throw new Error("使用者已是店家管理員");
            }

            await store.save({session: session});
            await user.save({session: session});

            await session.commitTransaction()
            session.endSession()
            response.success(res);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.log(error)
            response.internalServerError(res, error.message)
        }
    }
)

router.delete('/removeStoreOwner', passportJWT, middleware.isAdmin, dataValidation.registerOrRemoveStoreOwner,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            console.log(req.body.storeId);
            console.log(req.body.storeOwnerId);
            let store = await Store.findById(req.body.storeId).session(session);
            let user = await User.findById(req.body.storeOwnerId).session(session);

            if (!store || !user) throw new Error("找不到使用者或是店家")

            let userHasStoreIndex = user.hasStore.indexOf(req.body.storeId);
            let storeOwnerIndex = store.owners.indexOf(req.body.storeOwnerId);
            if (userHasStoreIndex > -1 && storeOwnerIndex > -1) {
                user.hasStore.splice(userHasStoreIndex, 1);
                store.owners.splice(storeOwnerIndex, 1);
                await user.save({session: session});
                await store.save({session: session});
            }
            await session.commitTransaction()
            session.endSession()
            response.success(res);

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.log(error)
            response.internalServerError(res, error.message)
        }
    }
)


module.exports = router

