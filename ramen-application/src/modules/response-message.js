const response = {};
const StatusCode = require('http-status-codes');
const ResponseCode = require('../enums/response-code');

response.success = (res, data) => {
    res.status(StatusCode.OK).json({
        code: ResponseCode.SUCCESS,
        message: "success",
        data: data
    })
}

response.unAuthorized = (res, error) => {
    res.status(StatusCode.UNAUTHORIZED).json({
        code: ResponseCode.FAIL,
        error: error
    })
}


response.notFound = (res, error) => {
    res.status(StatusCode.NOT_FOUND).json({
        code: ResponseCode.FAIL,
        error: error
    })
}


response.conflicts = (res, error) => {
    res.status(StatusCode.CONFLICT).json({
        code: ResponseCode.FAIL,
        error: error
    })
}


response.badRequest = (res, error) => {
    res.status(StatusCode.BAD_REQUEST).json({
        code: ResponseCode.FAIL,
        error: error
    })
}

response.tooManyRequests = (res, error) => {
    res.status(StatusCode.TOO_MANY_REQUESTS).json({
        code: ResponseCode.FAIL,
        error: error
    })
}

response.internalServerError = (res, error) => {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        code: ResponseCode.FAIL,
        error: error
    })
}

module.exports = response;
