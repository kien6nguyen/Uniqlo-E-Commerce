
const mongoose = require('mongoose');
const seedDB = require('./src/seed/productSeed');
require('dotenv').config();

async function run() {
    try {
        // Connect to the Docker MongoDB on port 27018
        const MONGO_URI = "mongodb://localhost:27018/shopdb";
        console.log('Connecting to Docker MongoDB at', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        await seedDB();

        console.log('DONE!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
