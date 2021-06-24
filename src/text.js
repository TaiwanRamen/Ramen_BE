require('dotenv').config()
require("./db/connectDB");
const Store = require('./models/store');
const moment = require('moment')

const go = async () => {
    const allStores = await Store.find({}, {
        _id: 1,
        name: 1,
        openPeriodText: 1
    });
    // openPeriod: [{
    //     day: Number,
    //     period: [{
    //         open: Number,
    //         close: Number
    //     }]
    // }],

    for (let store of allStores) {
        let openPeriodText = store.openPeriodText;
        if (openPeriodText !== null && openPeriodText.match(/、/)) {
            let dayStrings = openPeriodText.replace(/\s/g, '').replace('.', '').split(';');
            let weekPeriod = new Array(7).fill(null)
            for (let dayString of dayStrings) {
                let dayPeriod = {}
                let daySegments = dayString.split('、')
                let day = daySegments.shift()
                switch (day) {
                    case "星期日":
                        day = 0
                        break
                    case "星期一":
                        day = 1
                        break
                    case "星期二":
                        day = 2
                        break
                    case "星期三":
                        day = 3
                        break
                    case "星期四":
                        day = 4
                        break
                    case "星期五":
                        day = 5
                        break
                    case "星期六":
                        day = 6
                        break
                }

                dayPeriod.period = []
                for (let daySegment of daySegments) {
                    if (daySegment.match(/到/)) {
                        let timeSlots = daySegment.split(/到/)
                        dayPeriod.period.push({
                            open: timeSlots[0],
                            close: timeSlots[1]
                        })
                    }
                }
                if (daySegments.length === 1) {
                    if (daySegments[0] === "休息") {
                        dayPeriod.period = [{
                            open: "00:00",
                            close: "00:00"
                        }]
                    }
                    if (daySegments[0] === "24小時營業") {
                        dayPeriod.period = [{
                            open: "00:00",
                            close: "23:59"
                        }]
                    }
                }
                weekPeriod[day] = (dayPeriod)
            }
            console.log(weekPeriod[1])
            await Store.findOneAndUpdate(
                {'_id': store._id},
                {openPeriod: weekPeriod}
            );
        }
    }
}

const go2 = async () => {
    const allStores = await Store.find({openPeriodText: {$ne: null}, openPeriod: null}, {
        _id: 1,
        name: 1,
        openPeriodText: 1
    });
    // openPeriod: [{
    //     day: Number,
    //     period: [{
    //         open: Number,
    //         close: Number
    //     }]
    // }],

    for (let store of allStores) {
        let openPeriodText = store.openPeriodText;
        if (openPeriodText.match(/,/)) {
            let dayStrings = openPeriodText.replace(/\s/g, '').replace('.', '').split(';');
            let weekPeriod = new Array(7).fill(null)
            for (let dayString of dayStrings) {
                let dayPeriod = {}
                let daySegments = dayString.split(',')
                let day = daySegments.shift()
                switch (day) {
                    case "星期日":
                        day = 0
                        break
                    case "星期一":
                        day = 1
                        break
                    case "星期二":
                        day = 2
                        break
                    case "星期三":
                        day = 3
                        break
                    case "星期四":
                        day = 4
                        break
                    case "星期五":
                        day = 5
                        break
                    case "星期六":
                        day = 6
                        break
                }
                //如果;裡面的東西只有PM代表所有都是PM
                dayPeriod.period = []
                for (let daySegment of daySegments) {
                    if (daySegment.match("PM") && !daySegment.match("AM")) {
                        if (daySegment.match(/到/)) {
                            let timeSlots = daySegment.split(/到/)
                            timeSlots = timeSlots.map(timeSlot => {
                                if (!timeSlot.match("PM")) {
                                    timeSlot = timeSlot + "PM"
                                }
                                timeSlot = moment(timeSlot, ["h:mm A"]).format("HH:mm");
                                return timeSlot
                            })
                            dayPeriod.period.push({
                                open: timeSlots[0],
                                close: timeSlots[1]
                            })
                        }
                    } else {
                        if (daySegment.match(/到/)) {
                            let timeSlots = daySegment.split(/到/)
                            timeSlots = timeSlots.map(timeSlot => {
                                return moment(timeSlot, ["h:mm A"]).format("HH:mm");
                            })
                            dayPeriod.period.push({
                                open: timeSlots[0],
                                close: timeSlots[1]
                            })
                        }
                    }
                }
                if (daySegments.length === 1) {
                    if (daySegments[0].match(/休息|不營業/)) {
                        dayPeriod.period = [{
                            open: "0000",
                            close: "0000"
                        }]
                    }
                    if (daySegments[0] === "24小時營業") {
                        dayPeriod.period = [{
                            open: "0000",
                            close: "2359"
                        }]
                    }
                }
                weekPeriod[day] = (dayPeriod)
            }
            console.log(store.name, weekPeriod)
            await Store.findOneAndUpdate(
                {'_id': store._id},
                {openPeriod: weekPeriod}
            );
        }
    }
}
go2()

