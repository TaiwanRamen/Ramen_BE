const JWT = require('jsonwebtoken'),
    config = require('../config/global-config'),
    userRepository = require('../repository/user.repository'),
    log = require('../modules/logger');

const userService = {}

userService.getUserById = async (userId) => {
    try {
        return await userRepository.getUserById(userId)
    } catch (error) {
        log.error(error);
        throw new Error()
    }
}

userService.getFilteredUserById = async (userId) => {
    try {
        const user = await userRepository.getUserById(userId)
        return {
            _id: userId,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
        }
    } catch (error) {
        log.error(error);
        throw new Error()
    }
}


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
        log.error(error);
        throw new Error()
    }
}

userService.getNotifications = async (user, page) => {
    try {
        const notifications = await userRepository.getUserNotifications(user._id, page);
        const count = user.notifications.length;
        return {notifications, count}
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

userService.getFollowedStores = async (user, page) => {
    try {
        const followedStores = await userRepository.getUserFollowedStores(user._id, page);
        const count = user.followedStore.length;
        return {followedStores, count}
    } catch (error) {
        throw new Error()
    }
}

userService.getReviewedStores = async (user, page) => {
    try {
        const reviews = await userRepository.getUserReviewedStores(user._id, page);
        const count = user.reviews.length;
        return {reviews, count}
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}


userService.getUserReviews = async (userId) => {
    try {
        return await userRepository.getUserReviews(userId);
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}


userService.isUserStoreOwner = (user, storeId) => {
    let isStoreOwner = false;
    if (user && user.hasStore.includes(storeId)) {
        isStoreOwner = true;
    }
    return isStoreOwner;
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
        log.error(error);
        throw new Error()
    }
}


userService.addUserFollowedStores = async (userId, storeId, session) => {
    try {
        return await userRepository.addUserFollowedStores(userId, storeId, session)
    } catch (error) {
        log.error(error);
        throw new Error()
    }
}

userService.removeUserFollowedStores = async (userId, storeId, session) => {
    try {
        return await userRepository.removeUserFollowedStores(userId, storeId, session);
    } catch (error) {
        log.error(error);
        throw new Error()
    }
}

userService.addUserReview = async (userId, reviewId, session) => {
    try {
        return await userRepository.addUserReview(userId, reviewId, session)
    } catch (error) {
        log.error(error);
        throw new Error()
    }
}

userService.removeUserReview = async (userId, reviewId, session) => {
    try {
        return await userRepository.removeUserReview(userId, reviewId, session)
    } catch (error) {
        log.error(error);
        throw new Error()
    }
}

module.exports = userService;