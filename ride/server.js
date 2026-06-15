const http = require('http');
const app = require('./app');

const server = http.createServer(app);


const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
    console.log(`ride service is running on port ${PORT}`);
})