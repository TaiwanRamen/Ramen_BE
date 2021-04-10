module.exports = async (message, error, data) => {
    return {
        success: false,
        message: 'Auth failed',
        error: req.user.err
    };
}