// Package for the creation and reading of a keystore.
const keyStore = require('key-store');
// Package for reading and writing files.
const fs = require('fs');
// Package to support to API.
const util = require('util');
// Package for postgreSQL queries.
const {Pool} = require('pg');
// Package for hashing passwords.
const bcrypt = require("bcrypt");
// Package for encrypt and decrypt data.
const crypto = require('crypto');
// Package to execute command line prompt.
const prompt = require('prompt');
// To return a promise by calling fs.readFile or fs.writeFile
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
// Define encrypt and decrypt algorithm.
const algorithm = 'aes-256-cbc';
// Create random string.
const iv = crypto.randomBytes(16);

/**
 * Encrypt given value.
 * @param text - Value to encrypt
 * @returns {JSON} - Returns JSON Object with iv and encryptedData as hex value
 */
function encrypt(text, key) {
    // Create ciphre object with given algorithm, key and iv to encrypt data.
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    // Create buffer object which is the result of concatenating all Buffer instances in the list together to encrypt data.
    let encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    // Return JSON object containing iv as hex value and encryptedData as hex value.
    return {iv: iv.toString('hex'), encryptedData: encrypted.toString('hex')}
}

// Setup prompt properties.
const propertiesKeystore = [{
    required: true,
    name: 'masterPassword',
    validator: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{20,}$/,
    hidden: true,
    warning: 'The master key must consist of at least one upper case letter, one lower case letter, one number and one special character and must be at least 20 characters long.',
    message: 'Enter the master key',
}, {
    required: true,
    validator: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{32}$/,
    name: 'cryptPassword',
    warning: 'The encrypt key must consist of at least one upper case letter, one lower case letter, one number and must be 32 characters long.',
    message: 'Enter the decrypt and encrypt key',
    hidden: true
}, {
    required: true,
    name: 'dbHost',
    message: "Enter the database host name"
}, {
    required: true,
    name: 'dbName',
    validator: /^[a-zA-Z]+$/,
    warning: 'Database name must be only letters',
    message: 'Enter the database name'
}, {
    required: true,
    name: 'dbUser',
    validator: /^[a-zA-Z]+$/,
    warning: 'Database username must be only letters',
    message: 'Enter the database username'
}, {
    required: true,
    name: 'dbPassword',
    hidden: true,
    message: "Enter the database password"
}];
// Setup prompt properties.
const propertiesCreateAdmin = [{
    required: true,
    name: 'adminName',
    validator: /^[a-zA-Z]{3,}$/,
    warning: 'Username must be only letters and must be at least 3 characters long.',
    message: 'Enter the username of the administrator'

}, {
    name: 'adminPassword',
    required: true,
    validator: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/,
    hidden: true,
    warning: 'The password must consist of at least one upper case letter, one lower case letter, one number and one special character and must be at least 8 characters long.',
    message: 'Enter the password of the administrator'
}, {
    name: 'adminToken',
    required: true,
    message: 'Enter the REDCap-Token of the administrator'
}];
// Setup prompt properties.
const propertiesCreateAdminQuestion = [{
    required: true,
    name: 'createAdmin',
    message: 'Do you want to create an administrator? If yes type y and if not type n',
    validator: /^[yn]$/,
    warning: 'Answer can only be y or n.'
}];

// Start prompt.
prompt.start();

/**
 * Start middleware.
 * @returns {void}
 */
async function setup() {
    try {
        // Get values from comand line prompt.
        const {masterPassword, cryptPassword, dbUser, dbHost, dbName, dbPassword} = await prompt.get(propertiesKeystore);
        // Create a new keystore. Add function to save data to file.
        let store = await keyStore.createStore(data => writeFile("/var/keystore.txt", JSON.stringify(data), 'utf8'));
        // Add keys to keystore.
        await store.saveKeys([
            {keyID: 'key', password: masterPassword, privateData: {key: cryptPassword}},
            {keyID: 'user', password: masterPassword, privateData: {key: dbUser}},
            {keyID: 'host', password: masterPassword, privateData: {key: dbHost}},
            {keyID: 'database', password: masterPassword, privateData: {key: dbName}},
            {keyID: 'password', password: masterPassword, privateData: {key: dbPassword}}
        ]);
        // Get value from comand line prompt.
        const {createAdmin} = await prompt.get(propertiesCreateAdminQuestion);
        // If value is y create an administrator.
        if (createAdmin === 'y') {
            // Get values from comand line prompt.
            let {adminToken, adminName, adminPassword} = await prompt.get(propertiesCreateAdmin);
            // Setup postgreSQL pool.
            const pool = new Pool({user: dbUser, host: dbHost, database: dbName, password: dbPassword, port: 5432, ssl: false});
            // Hash given password and encrypt given adminName, adminToken and the adminAuthorization level 3.
            adminPassword = bcrypt.hashSync(adminPassword, 10);
            adminName = encrypt(adminName, cryptPassword);
            adminToken = encrypt(adminToken, cryptPassword);
            adminAuthorization = encrypt("3", cryptPassword);
            // Create administrator in the database.
            pool.query('INSERT INTO "users" ("userName", "userPassword", "userToken", "userAuthorization") VALUES ($1, $2, $3, $4)', [adminName, adminPassword, adminToken, adminAuthorization], (err, res) => {
                if (err) {
                    throw err;
                }
                // When the user is successfully created, the success message is displayed.
                if (res.rowCount === 1) {
                    console.log("User and keystore successfully created. Path to the keystore:/var/keystore.txt");
                    process.exit(0);
                }
            });
        }
        // If the value is n, the programme will stop and display the success message.
        else if (createAdmin === 'n') {
            console.log("Keystore successfully created. Path to the keystore:/var/keystore.txt");
            process.exit(0);
        }
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}
// Setup keystore.
setup();




