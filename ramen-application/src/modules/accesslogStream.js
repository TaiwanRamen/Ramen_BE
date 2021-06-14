const pad = num => (num > 9 ? "" : "0") + num;
const generator = (time, index) => {
    if (!time) return "access.log";
    let month = time.getFullYear() + "" + pad(time.getMonth() + 1);
    let day = pad(time.getDate());
    let hour = pad(time.getHours());
    let minute = pad(time.getMinutes());
    let second = pad(time.getSeconds());
    return `${month}/${month}${day}-${hour}:${minute}:${second}-${index}-access.log`;
};

const rfs = require("rotating-file-stream");
const path = require('path');
const stream = rfs.createStream(generator, {
    interval: "1h",
    path: path.join(__dirname, '../../logs'),
    compress: (source, dest) => "cat " + source + " | gzip -c9 > " + dest
});

module.exports = stream;
