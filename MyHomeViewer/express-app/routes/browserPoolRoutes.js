const {
    browserPool
} = myHome;

module.exports = app => {
    app.get('/api/browser', getBrowsers);
};

async function getBrowsers(req, res) {
    let browsers = browserPool.showBrowsers();

    res.send(browsers);
}
