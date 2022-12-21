const MONTHS = {
    'დეკ.': 11, 'ნოემ.': 10,
}

module.exports.toDate = (dateString) => {
    const [day, month, time] = dateString.split(' ');
    const [hours, minutes] = time.split(':');
    const date = new Date(new Date().getFullYear(), MONTHS[month], day, hours, minutes);
    if (date > new Date()) {
        date.setFullYear(date.getFullYear() - 1);
    }
    return date;
}