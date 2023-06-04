var expire_color;
const moment = require("moment");

expire_color = function (sched) {
    let date_now = new Date();
    let diff = moment(sched).diff(moment(date_now), 'hours');

    if(diff <= 48){
        return "text-danger fw-bold"
    }else{
        return "text-success"
    }
};

module.exports = expire_color;
