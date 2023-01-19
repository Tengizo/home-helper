const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors')

const app = express();

app.use(bodyParser.json());
app.use(cors());

require('./routes/propertyRoutes')(app);
require('./routes/scrapperRoutes')(app);
require('./routes/browserPoolRoutes')(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Listening on port`, PORT);
});