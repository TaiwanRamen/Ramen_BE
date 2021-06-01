const response = {};
const { StatusCodes } = require('http-status-codes');
const ResponseCode = require('../enums/response-code');

response.success = (res, data) => {
    res.status(StatusCodes.OK).json({
        code: ResponseCode.SUCCESS,
        message: "success",
        data: data
    })
}

response.unAuthorized = (res, error) => {
    res.status(StatusCodes.UNAUTHORIZED).json({
        code: ResponseCode.FAIL,
        message: error
    })
}


response.notFound = (res, error) => {
    res.status(StatusCodes.NOT_FOUND).json({
        code: ResponseCode.FAIL,
        message: error
    })
}


response.conflicts = (res, error) => {
    res.status(StatusCodes.CONFLICT).json({
        code: ResponseCode.FAIL,
        message: error
    })
}


response.badRequest = (res, error) => {
    res.status(StatusCodes.BAD_REQUEST).json({
        code: ResponseCode.FAIL,
        message: error
    })
}

response.tooManyRequests = (res, error) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        code: ResponseCode.FAIL,
        message: error
    })
}

response.internalServerError = (res, error) => {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: ResponseCode.FAIL,
        message: error
    })
}

response.unprocessableEntity = (res, error) => {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        code: ResponseCode.FAIL,
        message: error
    })
}

module.exports = response;
