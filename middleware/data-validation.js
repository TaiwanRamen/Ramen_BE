const Joi = require('joi');
const response = require('../modules/response-message');

const dataValidation = {}

dataValidation.registerOrRemoveStoreOwner = async (req, res, next) => {

    console.log(req.body);

    const schema = Joi.object({
        storeId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
        storeOwnerId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        console.log(error)
        switch (error.details[0].context.key) {
            case 'storeId':
                response.notFound(res,'valid storeId should be provided!');
                break
            case 'storeOwnerId':
                response.notFound(res,'valid storeOwnerId should be provided!');
        }
    } else {
        next()
    }
}

module.exports = dataValidation;