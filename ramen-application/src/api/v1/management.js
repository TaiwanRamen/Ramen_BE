const express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    log = require('../../modules/logger'),
    User = require('../../models/user'),
    StoreRelation = require('../../models/storeRelation'),
    dataValidation = require('../../middleware/dataValidate'),
    middleware = require('../../middleware/checkAuth'),
    response = require('../../modules/responseMessage');


router.post('/registerStoreOwner', middleware.jwtAuth, middleware.isAdmin, dataValidation.registerOrRemoveStoreOwner,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            let storeId = req.body.storeId;
            let storeOwnerId = req.body.storeOwnerId;

            const storeRelation = await StoreRelation.findOne({'storeId': storeId}).session(session);
            let user = await User.findById(req.body.storeOwnerId).session(session);

            if (!storeRelation || !user) throw new Error("找不到使用者或是店家")

            //add to set
            // db.inventory.update(
            //     { _id: 1 },
            //     { $addToSet: { tags: "accessories" } }
            // )
            if (!storeRelation.owners.includes(storeOwnerId) && !user.hasStore.includes(storeId)) {
                storeRelation.owners.push(storeOwnerId);
                user.hasStore.push(storeId);
            } else {
                throw new Error("使用者已是店家管理員");
            }

            await storeRelation.save({session: session});
            await user.save({session: session});

            await session.commitTransaction()
            session.endSession()
            log.info("registered owner {} from store {}", storeOwnerId, storeId)
            response.success(res);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            log.error(error);
            response.internalServerError(res, error.message)
        }
    }
)

router.delete('/removeStoreOwner', middleware.jwtAuth, middleware.isAdmin, dataValidation.registerOrRemoveStoreOwner,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const storeId = req.body.storeId;
            const storeOwnerId = req.body.storeOwnerId;

            const storeRelation = await StoreRelation.findOne({'storeId': storeId}).session(session);
            let user = await User.findById(req.body.storeOwnerId).session(session);

            if (!storeRelation || !user) throw new Error("找不到使用者或是店家")

            let userHasStoreIndex = user.hasStore.indexOf(storeId);
            let storeOwnerIndex = storeRelation.owners.indexOf(storeOwnerId);

            if (userHasStoreIndex > -1 && storeOwnerIndex > -1) {
                user.hasStore.splice(userHasStoreIndex, 1);
                storeRelation.owners.splice(storeOwnerIndex, 1);
                await user.save({session: session});
                await storeRelation.save({session: session});
            }
            await session.commitTransaction()
            session.endSession()
            log.info("removed owner {} from store {}", storeOwnerId, storeId)
            return response.success(res);

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            log.error(error);
            return response.internalServerError(res, error.message)
        }
    }
)


module.exports = router

