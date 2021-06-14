const express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    log = require('../../modules/logger'),
    User = require('../../models/user'),
    StoreRelation = require('../../models/storeRelation'),
    dataValidate = require('../../middleware/dataValidate'),
    middleware = require('../../middleware/checkAuth'),
    response = require('../../modules/responseMessage');


router.post('/registerStoreOwner', middleware.jwtAuth, middleware.isAdmin, dataValidate.registerOrRemoveStoreOwner,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            let storeId = req.body.storeId;
            let userId = req.body.storeOwnerId;

            const user = await User.findOneAndUpdate(
                {'_id': userId},
                {$addToSet: {hasStore: new mongoose.Types.ObjectId(storeId)}},
                {session: session}
            );

            const storeRelation = await StoreRelation.findOneAndUpdate(
                {'storeId': storeId},
                {$addToSet: {owners: new mongoose.Types.ObjectId(userId)}},
                {session: session}
            );

            if (!storeRelation || !user) throw new Error("找不到使用者或是店家")

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

router.delete('/removeStoreOwner', middleware.jwtAuth, middleware.isAdmin, dataValidate.registerOrRemoveStoreOwner,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const storeId = req.body.storeId;
            const userId = req.body.storeOwnerId;

            const storeRelation = await StoreRelation.findOneAndUpdate(
                {'storeId': storeId},
                {$pull: {owners: new mongoose.Types.ObjectId(userId)}},
                {multi: false, session: session}
            );

            let user = await User.findOneAndUpdate(
                {'_id': userId},
                {$pull: {hasStore: new mongoose.Types.ObjectId(storeId)}},
                {multi: false, session: session}
            );

            if (!storeRelation || !user) throw new Error("找不到使用者或是店家")


            await session.commitTransaction()
            session.endSession()
            log.info(`removed owner ${userId} from store ${storeId}`)
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

