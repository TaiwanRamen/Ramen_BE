const Joi = require('joi');
const response = require('../modules/responseMessage');
const {body, validationResult} = require('express-validator')
const log = require('../modules/logger');

const dataValidate = {}

const idFormat = Joi.string().regex(/^[a-fA-F0-9]{24}$/).required();

dataValidate.registerOrRemoveStoreOwner = async (req, res, next) => {

    const schema = Joi.object({
        storeId: idFormat,
        storeOwnerId: idFormat
    });

    const {error} = schema.validate(req.body);
    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break
            case 'storeOwnerId':
                response.unprocessableEntity(res, 'valid storeOwnerId should be provided!');
                break;
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
        log.error(error);
        switch (error.details[0].context.key) {
            case 'commentId':
                response.unprocessableEntity(res, 'valid comment should be provided!');
                break
            case 'comment':
                response.unprocessableEntity(res, 'storeId should be provided correctly!');
                break;
        }
    } else {
        next()
    }
}

dataValidate.editComment = async (req, res, next) => {
    const schema = Joi.object({
        commentId: idFormat,
        comment: Joi.string()
    });
    const {error} = schema.validate(req.body);

    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'comment':
                response.unprocessableEntity(res, 'valid comment should be provided!');
                break
            case 'storeId':
                response.unprocessableEntity(res, 'storeId should be provided correctly!');
                break;
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

    const {error} = schema.validate(req.body);
    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'commentId':
                response.unprocessableEntity(res, 'valid commentId should be provided!');
                break;
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break;
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
        log.error(error);
        switch (error.details[0].context.key) {
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break;
            case 'review':
                response.unprocessableEntity(res, 'valid review should be provided!');
                break;
            case 'rating':
                response.unprocessableEntity(res, 'valid rating should be provided!');
                break;
        }
    } else {
        next()
    }
}


dataValidate.editReview = async (req, res, next) => {

    const schema = Joi.object({
        storeId: idFormat,
        reviewId: idFormat,
        review: Joi.string(),
        rating: Joi.number().min(0).max(5).integer()
    });

    const {error} = schema.validate(req.body);

    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break;
            case 'reviewId':
                response.unprocessableEntity(res, 'valid reviewId should be provided!');
                break;
            case 'review':
                response.unprocessableEntity(res, 'valid review should be provided!');
                break;
            case 'rating':
                response.unprocessableEntity(res, 'valid rating should be provided!');
                break;
        }
    } else {
        next()
    }
}


dataValidate.deleteReview = async (req, res, next) => {

    const schema = Joi.object({
        storeId: idFormat,
        reviewId: Joi.string(),
    });

    const {error} = schema.validate(req.body);

    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break
            case 'reviewId':
                response.unprocessableEntity(res, 'valid reviewId should be provided!');
                break;
        }
    } else {
        next()
    }
}


dataValidate.getStoresNearMetro = async (req, res, next) => {

    const schema = Joi.object({
        city: Joi.string().allow("taipei", "kaohsiung", "taichung"),
        stationCode: Joi.string().required(),
        maxDistance: Joi.number()
    });

    const {error} = schema.validate(req.query);

    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'city':
                response.unprocessableEntity(res, 'valid city should be provided!');
                break
            case 'stationCode':
                response.unprocessableEntity(res, 'valid stationCode should be provided!');
                break;
            case 'maxDistance':
                response.unprocessableEntity(res, 'valid maxDistance should be provided!');
                break;
        }
    } else {
        next()
    }
}


dataValidate.metroCloseToStore = async (req, res, next) => {

    const schema = Joi.object({
        storeId: idFormat,
        maxDistance: Joi.number()
    });

    const {error} = schema.validate(req.query);

    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break;
            case 'maxDistance':
                response.unprocessableEntity(res, 'valid maxDistance should be provided!');
                break
        }
    } else {
        next()
    }
}

dataValidate.getStoresInMapBound = async (req, res, next) => {

    const schema = Joi.object({
        N: Joi.number().min(-90).max(90),
        S: Joi.number().min(-90).max(90),
        E: Joi.number().min(-180).max(180),
        W: Joi.number().min(-180).max(180),
        search: Joi.string()
    });

    const {error} = schema.validate(req.query);

    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'N':
                response.unprocessableEntity(res, 'valid North should be provided!');
                break;
            case 'S':
                response.unprocessableEntity(res, 'valid South should be provided!');
                break
            case 'E':
                response.unprocessableEntity(res, 'valid East should be provided!');
                break
            case 'W':
                response.unprocessableEntity(res, 'valid West should be provided!');
                break
            case 'search':
                response.unprocessableEntity(res, 'valid maxDistance should be provided!');
                break
        }
    } else {
        next()
    }
}


dataValidate.storeId = async (req, res, next) => {

    const schema = Joi.object({
        storeId: idFormat
    });

    const {error} = schema.validate(req.params);

    if (error) {
        log.error(error);
        switch (error.details[0].context.key) {
            case 'storeId':
                response.unprocessableEntity(res, 'valid storeId should be provided!');
                break
        }
    } else {
        next()
    }
}

module.exports = dataValidate;