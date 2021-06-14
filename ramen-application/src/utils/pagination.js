const config = require('../config/global-config')

const pagination = (page) => {
    let perPage = config.PER_PAGE;
    let pageQuery = parseInt(page);
    let pageNumber = pageQuery ? pageQuery : 1;
    return {perPage, pageNumber}
}

module.exports = pagination