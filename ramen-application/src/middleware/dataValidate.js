const Joi = require('joi');
const response = require('../modules/responseMessage');
const {body, validationResult} = require('express-validator')

const dataValidate = {}

const idFormat = Joi.string().regex(/^[a-fA-F0-9]{24}$/).required();

dataValidate.registerOrRemoveStoreOwner = async (req, res, next) => {

    const schema = Joi.object({
        storeId: idFormat,
        storeOwnerId: idFormat
    });

    const {error} = schema.validate(req.body);
    if (error) {
        console.log(error)
        switch (error.details[0].context.key) {
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break
            case 'storeOwnerId':
                response.unprocessableEntity(res, 'valid storeOwnerId should be provided!');
        }
    } else {
        next()
    }
}


dataValidate.addComment = async (req, res, next) => {
    const schema = Joi.object({
        storeId: idFormat,
        comment: Joi.string()
    });
    const {error} = schema.validate(req.body);

    if (error) {
        console.log(error)
        switch (error.details[0].context.key) {
            case 'comment':
                response.unprocessableEntity(res, 'valid comment should be provided!');
                break
            case 'storeId':
                response.unprocessableEntity(res, 'storeId should be provided correctly!');
        }
    } else {
        next()
    }
}

dataValidate.deleteComment = async (req, res, next) => {

    const schema = Joi.object({
        commentId: idFormat,
        storeId: idFormat
    });

    const {error} = schema.validate(req.query);
    if (error) {
        console.log(error)
        switch (error.details[0].context.key) {
            case 'commentId':
                response.unprocessableEntity(res, 'valid commentId should be provided!');
                break
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
        }
    } else {
        next()
    }
}


dataValidate.addReview = async (req, res, next) => {

    const schema = Joi.object({
        storeId: idFormat,
        review: Joi.string(),
        rating: Joi.number().min(0).max(5).integer()
    });

    const {error} = schema.validate(req.body);

    if (error) {
        console.log(error)
        switch (error.details[0].context.key) {
            case 'comment':
                response.unprocessableEntity(res, 'valid comment should be provided!');
                break
            case 'rating':
                response.unprocessableEntity(res, 'valid rating should be provided!');
        }
    } else {
        next()
    }
}


module.exports = dataValidate;