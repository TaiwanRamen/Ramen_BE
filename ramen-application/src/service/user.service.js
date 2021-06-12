const JWT = require('jsonwebtoken'),
    config = require('../config/global-config'),
    userRepository = require('../repository/user.repository'),
    log = require('../modules/logger');

const userService = {}

userService.signToken = async (user) => {
    return await JWT.sign({
        iss: 'Taiwan Ramen-Club',
        sub: user._id,
        iat: new Date().getTime(), // current time
        exp: new Date(new Date().getTime() + config.JWT_MAX_AGE).getTime()
    }, process.env.JWT_SIGNING_KEY, {algorithm: config.JWT_SIGNING_ALGORITHM});
}

userService.notificationCount = async (userId) => {
    try {
        return await userRepository.getUserNotificationCount(userId)
    } catch (error) {
        log.error(error)
    }
}

userService.getNotifications = async (user, page) => {
    try {
        const notifications = await userRepository.getUserNotifications(user._id, page);
        const count = user.notifications.length;
        return {notifications, count}
    } catch (error) {
        log.error(error)
    }
}

userService.getFollowedStores = async (user, page) => {
    try {
        const followedStores = await userRepository.getUserFollowedStores(user._id, page);
        const count = user.followedStore.length;
        return {followedStores, count}
    } catch (error) {
        log.error(error)
    }
}

userService.getReviewedStores = async (user, page) => {
    try {
        const reviews = await userRepository.getUserFollowedStores(user._id, page);
        const count = user.reviews.length;
        return {reviews, count}
    } catch (error) {
        log.error(error)
    }
}

userService.isUserInRamenGroup = async (user) => {
    let isUserInGroup = false;
    try {
        let response = await axios.get(`https://graph.facebook.com/v10.0/${user.fbUid}/groups?pretty=0&admin_only=false&limit=10000&access_token=${user.fbToken}`)
        let groupsList;
        if (!response.data.paging.next) {
            groupsList = response.data.data;
        }
        if (groupsList.length > 0) {
            isUserInGroup = groupsList.some(group => {
                return group.id === "1694931020757966"
            })
        }
        return isUserInGroup;
    } catch (error) {
        log.error(error)
        return isUserInGroup;
    }
}




module.exports = userService;