const {URL} = require('url');
const MONTHS = {
    'დეკ.': 11, 'ნოემ.': 10,
}
const SS_HOST = 'ss.ge';
const MYHOME_HOST = 'myhome.ge';

module.exports.toDateMyHome = (dateString) => {
    const [day, month, time] = dateString.split(' ');
    const [hours, minutes] = time.split(':');
    const date = new Date(new Date().getFullYear(), MONTHS[month], day, hours, minutes);
    if (date > new Date()) {
        date.setFullYear(date.getFullYear() - 1);
    }
    return date;
}
module.exports.toDateSS = (dateString) => {
    const [dateStr, time] = dateString.split('/');
    const [day, month, year] = dateStr.trim().split('.');
    const [hours, minutes] = time.trim().split(':');
    return new Date(year, Number.parseInt(month) - 1, day, hours, minutes);
}
module.exports.getBuildingStatus = (status) => {
    if (status.includes('ახალი')) {
        return 'NEW';
    } else if (status.includes('ძველი')) {
        return 'OLD';
    } else if (status.includes('მშენებარე')) {
        return 'CONSTRUCTION';
    }
    return 'UNKNOWN';
};

module.exports.getSource = (url) => {
    const host = new URL(url).host;
    switch (host) {
        case SS_HOST:
            return 'SS';

        case MYHOME_HOST:
            return 'MYHOME';

        default:
            throw new Error(`Unknown host ${host}`);
    }
}

module.exports.isOwner = (home) => {
    return home.badge === 'მესაკუთრე';
}
module.exports.isDuplicate = (home) => {
    return !!home.duplicatesOf;
}