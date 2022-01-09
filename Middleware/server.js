/**
 * Start middleware.
 * @returns {void}
 */
async function middlewareStart() {
    try {
        // Package for the inizialization of modules.
        const express = require("express");
        // Package for cross-origin resource sharing.
        const cors = require('cors');
        // Package for postgreSQL queries.
        const {Pool} = require('pg');
        // Package for handling JSON Web Token (JWT).
        const jwt = require('jsonwebtoken');
        // Package for hashing passwords.
        const bcrypt = require("bcrypt");
        // Package for parsing incoming request bodies.
        const bodyParser = require('body-parser');
        // Package for https requests. In this case
        const https = require('https');
        // Package for encrypt and decrypt data.
        const crypto = require('crypto');
        // Package for the creation and reading of a keystore.
        const keyStore = require('key-store');
        // Package for reading and writing files.
        const fs = require('fs');
        // Package to support to API.
        const util = require('util');
        // Package to execute command line prompt.
        const prompt = require('prompt');
        // To return a promise by calling fs.readFile
        const readFile = util.promisify(fs.readFile)
        // Start prompt.
        prompt.start();
        // Setup prompt properties.
        const properties = [{
            required: true,
            name: 'masterKey',
            message: 'Enter the master key',
            validator: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{20,}$/,
            warning: 'The master key must consist of at least one upper case letter, one lower case letter, one number and one special character and must be at least 20 characters long.',
            hidden: true,
        }];

        // Read data from the keystore file.
        const readKeys = async () => JSON.parse(await readFile("/var/keystore.txt", 'utf8'))
        // Create a keystore with read data.
        const store = keyStore.createStore(data => {
        }, await readKeys())
        // Get master key from comand line prompt.
        const {masterKey} = await prompt.get(properties);
        // Password regex.
        const regex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d$@$!%*?&]).*$");
        // Setup postgreSQL pool. Decrypt data from keystore with master key.
        const pool = new Pool({
            user: store.getPrivateKeyData('user', masterKey).key,
            host: store.getPrivateKeyData('host', masterKey).key,
            database: store.getPrivateKeyData('database', masterKey).key,
            password: store.getPrivateKeyData('password', masterKey).key,
            port: 5432,
            ssl: false
        });
        // Create express app.
        const app = express();
        // Set security variables.
        const saltRounds = 10;
        // Create random accessToken Secret to sign the accessToken.
        const accessTokenSecret = crypto.randomBytes(512).toString('hex');
        // Define encrypt and decrypt algorithm.
        const algorithm = 'aes-256-cbc';
        // Encrypt key from keystore.
        const key = store.getPrivateKeyData('key', masterKey).key;
        // Create random string.
        const iv = crypto.randomBytes(16);
        // Add module cors with origins.
        app.use(cors({
            origin: [
                'http://147.87.116.23',
                'http://localhost:4200',
            ],
            credentials: true
        }));
        // Add bodyparser and use JSON format.
        app.use(bodyParser.json());

        /**
         * Encrypt given value.
         * @param text - Value to encrypt
         * @returns {JSON} - Returns JSON Object with iv and encryptedData as hex value
         */
        function encrypt(text) {
            // Create ciphre object with given algorithm, key and iv to encrypt data.
            let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
            // Create buffer object which is the result of concatenating all Buffer instances in the list together to encrypt data.
            let encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
            // Return JSON object containing iv as hex value and encryptedData as hex value.
            return {iv: iv.toString('hex'), encryptedData: encrypted.toString('hex')}
        }

        /**
         * Decrypt given value.
         * @param text - Value to decrypt
         * @returns {string} - Returns the decrypted value as text
         */
        function decrypt(text) {
            // Parse given value to JSON object.
            text = JSON.parse(text.split("'").join('"'));
            // Get iv string of JSON object and parse to buffer object.
            let iv = Buffer.from(text.iv, 'hex');
            // Get encryptedText of JSON object and parse to buffer object.
            let encryptedText = Buffer.from(text.encryptedData, 'hex');
            // Create a decipher object with the given algorithm, key and iv.
            let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
            // Create buffer object which is the result of concatenating all Buffer instances in the list together to encrypt data.
            let decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
            // Return decrpyted text.
            return decrypted.toString();
        }

        /**
         * Hash given password.
         * @param password - Password of user
         * @returns {string} - Returns password hash
         */
        function hashPassword(password) {
            return bcrypt.hashSync(password,saltRounds);
        }

        /**
         * Send error message with custom text as http response to client.
         * @param res - Express response object
         * @param errorCode - Http error
         * @param errorMessage - Error message
         * @returns void
         */
        function sendError(res, errorCode, errorMessage) {
            // Write header with errorCode, errorMessage and media type of the resource.
            res.writeHead(errorCode, errorMessage, {'content-type': 'text/plain'});
            // Signal to the server that all of the response headers and body have been sent.
            res.end(errorMessage);
        }

        /**
         * Create JWT with id, username and authorization, which expires after 20 minutes.
         * @param id - Id of user
         * @param username - Name of user
         * @param authorization - Authorization of user
         * @returns {JSON} - Returns a JWT
         */
        function createJWT(id, username, authorization) {
            return jwt.sign({id: id, username: username, authorization: authorization}, accessTokenSecret, {expiresIn: '20m'});
        }

        /**
         * Get decrypted API token.
         * @param userId - Id of user
         * @returns {string} - Returns the decrypted API token
         */
        async function extractAPIToken(userId) {
            try {
                // Get API token of given userId from the database.
                const dbQuery = await pool.query('SELECT "userToken" FROM "users" WHERE "userId" = $1', [userId]);
                // Decrypt userToken.
                return decrypt(dbQuery.rows[0].userToken);
            } catch (e) {
                // Error handling.
                throw "Database - " + e;
            }
        }

        /**
         * Start a REDCap Request.
         * @param userId - Id of user
         * @param data - Data to send to REDCap
         * @returns {Promise<JSON>} - Returns the REDCap return JSON as promise
         */
        async function postAPIRequest(userId, data) {
            // Return a Promise.
            return new Promise(async (resolve, reject) => {
                try {
                    // Set dataString containing API Token and data.
                    const dataString = 'token=' + await extractAPIToken(userId) + data;
                    // Set options.
                    const options = {
                        host: 'redcap.i4mi.bfh.ch',
                        path: '/redcap/api/',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Content-Length': dataString.length
                        },
                        rejectUnauthorized: false,
                        requestCert: true,
                        agent: false
                    };
                    let dataBuffers = [];
                    // Do API request.
                    const request = https.request(options, function (res) {
                        // On receiving data write it into the array.
                        res.on('data', (data) => dataBuffers.push(data))
                        // On end convert data to JSON.
                        res.on('end', () => {
                            var data = Buffer.concat(dataBuffers);
                            const resString = JSON.parse(data);
                            // On error reject error else resolve result.
                            if (resString.hasOwnProperty('error')) {
                                reject("REDCap - " + resString.error);
                            } else {
                                resolve(resString)
                            }
                        })
                    }).on('error', (e) => {
                        // Error handling.
                        reject("REDCap - " + e);
                    })
                    // Add data and end request.
                    request.write(dataString);
                    // End of request.
                    request.end();
                } catch (e) {
                    // Error handling.
                    reject(e);
                }
            })
        }

        /**
         * Check validity of user token.
         * @param req -  Express request object
         * @param res - Express response object
         * @param next - Function to call the next function
         * @returns void
         */
        const authenticateJWT = (req, res, next) => {
            // Get accessToken from headers.
            const accessToken = req.headers.authorization.split(' ')[1];
            // Check if accessToken is available.
            if (accessToken !== "null") {
                // Verify token.
                jwt.verify(accessToken, accessTokenSecret, (err, user) => {
                    if (err) {
                        // Send 401 error as http response to client.
                        sendError(res, 401, 'Authentication failed');
                    } else {
                        // Set variables user and token and go next.
                        req.user = user;
                        req.token = createJWT(user.id, user.username, user.authorization);
                        next();
                    }
                });
            } else {
                // Send 401 error as http response to client.
                sendError(res, 401, 'Authentication failed');
            }
        };


        /**
         * Refresh accessToken.
         */
        app.get('/token', authenticateJWT, (req, res) => {
            res.json({accessToken: req.token});
        });

        /**
         * Check user credentials and get accessToken.
         */
        app.post('/login', async (req, res) => {
            try {
                // Get username and password from body.
                let {username, password} = req.body;
                // Set noMatch variable to true.
                let noMatch = true;
                // Get userName, userId, userPassword and userAuthorization of the given userId from the database.
                const dbQuery = await pool.query('SELECT "userId", "userName", "userPassword", "userAuthorization" FROM "users"');
                for (row of dbQuery.rows) {
                    // If given username from request body matches decrpyted userName from database.
                    if (decrypt(row.userName) === username) {
                        // Set noMatch variable to false;
                        noMatch = false;
                        // Compare passwords.
                        if (bcrypt.compareSync(password, row.userPassword)) {
                            // Create an accessToken.
                            const accessToken = createJWT(row.userId, decrypt(row.userName), parseInt(decrypt(row.userAuthorization)));
                            // Send a JSON response with accessToken.
                            res.json({accessToken});
                        } else {
                            // Send 403 error as http response to client.
                            sendError(res, 403, 'Authentication failed');
                        }
                    }
                }
                // If the given username and password do not match.
                if (noMatch) {
                    // Send 403 error as http response to client.
                    sendError(res, 403, 'Authentication failed');
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, 'Database - ' + e);
            }
        });

        /**
         * Get all protocols.
         */
        app.get('/overview', authenticateJWT, async (req, res) => {
            try {
                // Get all protocols with a REDCap request.
                const result = await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&csvDelimiter=&fields[0]=datum&fields[1]=entldat&fields[2]=gebdat&fields[3]=geschl&fields[4]=patid&fields[5]=protnr_01&fields[6]=protnr_02&fields[7]=protnr_03&fields[8]=protnr_04&fields[9]=protnr_05&fields[10]=record_id&fields[11]=statimport&fields[12]=statmaxpflicht&fields[13]=statistpflicht&fields[14]=stateinsaort_cac&fields[15]=statzckb&fields[16]=staturkrstst&fields[17]=statrosc&fields[18]=statekg1&rawOrLabel=raw&rawOrLabelHeaders=raw&exportCheckboxLabel=false&exportSurveyFields=false&exportDataAccessGroups=false&returnFormat=json');
                // Send a JSON response with protocols and the accessToken.
                res.json({protocols: result, accessToken: req.token});
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        });

        /**
         * Update own user.
         */
        app.put('/user', authenticateJWT, async (req, res) => {
            try {
                // Get user credentials from body.
                const {password, confirmPassword} = req.body;
                // Check if password is strong enough.
                if (password === confirmPassword && (password != null || password !== "") && regex.test(password) && password.length >= 8) {
                    // Hash given password.
                    const hash = hashPassword(password);
                    // Update user in the database.
                    await pool.query('UPDATE "users" SET "userPassword" = $1 WHERE "userId" = $2', [hash, req.user.id]);
                    // Send a JSON response with accesToken.
                    res.json({accessToken: req.token});
                } else {
                    // Send 422 error as http response to client.
                    sendError(res, 422, "Unexpected input");
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Get measuring units and all users.
         */
        app.get('/administration', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // Get measuring units from the database.
                    const dbQueryMeasuringUnit = await pool.query('SELECT "measField", "measValue" FROM "measurement_units"');
                    // Get all users from the database.
                    const dbQueryUsers = await pool.query('SELECT "userId", "userName", "userAuthorization" FROM "users"');
                    // Get hospital management settings from the database.
                    const dbQueryHospital = await pool.query('SELECT "hospCreateUser" FROM "hospital" WHERE "hospId" = 1');
                    // Decrypt userName and userAuthorization for each row of dbQueryUsers.
                    for (row of dbQueryUsers.rows) {
                        row.userName = decrypt(row.userName);
                        row.userAuthorization = decrypt(row.userAuthorization);
                    }
                    // Send a JSON response with measuring units, users, hospital management settings and the accessToken.
                    res.json({units: dbQueryMeasuringUnit.rows, users: dbQueryUsers.rows, management: dbQueryHospital.rows, accessToken: req.token});
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Update management settings.
         */
        app.post('/management', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // If given userCreation value is equals 1 or 2.
                    if (req.body.userCreation >= 1 && req.body.userCreation <= 2) {
                        // Update management settings.
                        await pool.query('UPDATE "hospital" SET "hospCreateUser" = $1 WHERE "hospId" = 1', [req.body.userCreation]);
                    } else {
                        // Send 422 error as http response to client.
                        sendError(res, 422, "Unexpected management value");
                    }
                    // Send a JSON response with accessToken.
                    res.json({accessToken: req.token});
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Get measuring units and all users.
         */
        app.get('/administration/adduser', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // Get management settings from the database.
                    const dbQueryHospital = await pool.query('SELECT "hospCreateUser" FROM "hospital" WHERE "hospId" = 1');
                    // Get all usernames from the database.
                    const dbQuery = await pool.query('SELECT "userName" FROM "users"');
                    // Decrypt userName for each row.
                    for (row of dbQuery.rows) {
                        row.userName = decrypt(row.userName);
                    }
                    // Send a JSON response with users, hospital management settings and accessToken.
                    res.json({users: dbQuery.rows, management: dbQueryHospital.rows, accessToken: req.token});
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Get measuring units.
         */
        app.get('/measuringUnit', authenticateJWT, async (req, res) => {
            try {
                // Get measuring units from the database.
                const dbQueryMeasuringUnit = await pool.query('SELECT "measField", "measValue" FROM "measurement_units"');
                // Send a JSON response with measuring units and accessToken.
                res.json({units: dbQueryMeasuringUnit.rows, accessToken: req.token});
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Update measuring units.
         */
        app.post('/measuringUnit', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // Get measuring units from body.
                    let {co2aufn, lactaufn, kreaaufn, ecprlact, ecprpco2, ecprpao2, bzaufn, hbaufn} = req.body;
                    // Write measuring units values into field variables.
                    const fields = [{name: 'co2aufn', value: co2aufn}, {name: 'lactaufn', value: lactaufn}, {name: 'kreaaufn', value: kreaaufn}, {name: 'ecprlact', value: ecprlact}, {name: 'ecprpco2', value: ecprpco2}, {name: 'ecprpao2', value: ecprpao2}, {name: 'bzaufn', value: bzaufn}, {name: 'hbaufn', value: hbaufn}];
                    for (let field of fields) {
                        // Check validity of field value.
                        if (field.value >= 1 && field.value <= 2) {
                            // Update measuring units in the database.
                            await pool.query('UPDATE "measurement_units" SET "measValue" = $1 WHERE "measField" = \'' + field.name + '\'', [field.value]);
                        } else {
                            // Send 422 error as http response to client.
                            sendError(res, 422, "Unexpected measuring unit - " + field.name + ": " + field.value);
                        }
                    }
                    // Send a JSON response with accessToken.
                    res.json({accessToken: req.token});
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Get user.
         */
        app.get('/administration/user/:id', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // Get id from params.
                    const id = parseInt(req.params.id);
                    // Get user information for given user id from the database.
                    const dbQueryUser = await pool.query('SELECT "userId", "userName", "userAuthorization" FROM "users" WHERE "userId" = $1', [id]);
                    // Get all usernames from the database.
                    const dbQueryUsers = await pool.query('SELECT "userName" FROM "users"');
                    // Decrypt userName and userAuthorization for each dbQueryUser row.
                    for (row of dbQueryUser.rows) {
                        row.userName = decrypt(row.userName);
                        row.userAuthorization = decrypt(row.userAuthorization);
                    }
                    // Decrypt userName for each dbQueryUsers row.
                    for (row of dbQueryUsers.rows) {
                        row.userName = decrypt(row.userName);
                    }
                    // Send a JSON response with userName and UserAuthorization for given user id, all usernames and the accessToken.
                    res.json({user: dbQueryUser.rows, users: dbQueryUsers.rows, accessToken: req.token});
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Delete user.
         */
        app.delete('/administration/user/:id', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // Get id from params.
                    const id = parseInt(req.params.id);
                    if (req.user.id !== id) {
                        // Delete user with given id in the database.
                        await pool.query('DELETE FROM "users" WHERE "userId" = $1', [id]);
                        // Send a JSON response with accessToken.
                        res.json({accessToken: req.token});
                    } else {
                        // Send 422 error as http response to client.
                        sendError(res, 422, "You can not delete yourself")
                    }
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Update user.
         */
        app.put('/administration/user/:id', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // Get id from params.
                    const id = parseInt(req.params.id);
                    // Get variables from request body.
                    let {username, password, confirmPassword, token, authorization} = req.body;
                    // Hash given password.
                    const hash = hashPassword(password);
                    // Get userId and userName of all users from the database.
                    const dbQuery = await pool.query('SELECT "userId", "userName" FROM "users"');
                    for (row of dbQuery.rows) {
                        if (row.userId === id || dbQuery.rowCount === 0) {
                            // Perform appropriate update depending on given variables. Encrypt token, username and authorization. Send a JSON response with accesToken.
                            if (token === "" && password === "" && id !== req.user.id) {
                                authorization = encrypt(authorization);
                                username = encrypt(username);
                                await pool.query('UPDATE "users" SET "userName" = $1, "userAuthorization" = $2 WHERE "userId" = $3', [username, authorization, id]);
                                res.json({accessToken: req.token});
                            } else if (token === "" && password === confirmPassword && password !== "" && id !== req.user.id) {
                                authorization = encrypt(authorization);
                                username = encrypt(username);
                                await pool.query('UPDATE "users" SET "userName" = $1, "userPassword" = $2, "userAuthorization" = $3 WHERE "userId" = $4', [username, hash, authorization, id]);
                                res.json({accessToken: req.token});
                            } else if (token !== "" && password === confirmPassword && password !== "" && id !== req.user.id) {
                                username = encrypt(username);
                                authorization = encrypt(authorization);
                                token = encrypt(token);
                                await pool.query('UPDATE "users" SET "userName" = $1, "userPassword" = $2, "userToken" = $3, "userAuthorization" = $4 WHERE "userId" = $5', [username, hash, token, authorization, id]);
                                res.json({accessToken: req.token});
                            } else if (token !== "" && password === "" && id !== req.user.id) {
                                username = encrypt(username);
                                token = encrypt(token);
                                authorization = encrypt(authorization);
                                await pool.query('UPDATE "users" SET "userName" = $1, "userToken" = $2, "userAuthorization" = $3 WHERE "userId" = $4', [username, token, authorization, id]);
                                res.json({accessToken: req.token});
                            } else if (token === "" && password === "" && id === req.user.id) {
                                username = encrypt(username);
                                await pool.query('UPDATE "users" SET "userName" = $1 WHERE "userId" = $2', [username, id]);
                                token = createJWT(req.user.id, username, req.user.authorization);
                                res.json({accessToken: token});
                            } else if (token === "" && password === confirmPassword && password !== "" && id === req.user.id) {
                                username = encrypt(username);
                                await pool.query('UPDATE "users" SET "userName" = $1, "userPassword" = $2 WHERE "userId" = $3', [username, hash, id]);
                                res.json({accessToken: createJWT(req.user.id, username, req.user.authorization)});
                            } else if (token !== "" && password === confirmPassword && password !== "" && id === req.user.id) {
                                username = encrypt(username);
                                token = encrypt(token);
                                await pool.query('UPDATE "users" SET "userName" = $1, "userPassword" = $2, "userToken" = $3 WHERE "userId" = $4', [username, hash, token, id]);
                                res.json({accessToken: createJWT(req.user.id, username, req.user.authorization)});
                            } else if (token !== "" && password === "" && id === req.user.id) {
                                username = encrypt(username);
                                token = encrypt(token);
                                await pool.query('UPDATE "users" SET "userName" = $1, "userToken" = $2 WHERE "userId" = $3', [username, token, id]);
                                res.json({accessToken: createJWT(req.user.id, username, req.user.authorization)});
                            }
                        }
                    }
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });

        /**
         * Create user.
         */
        app.post('/administration/user', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization === 3) {
                    // Get variables from request body.
                    let {username, password, confirmPassword, token, authorization} = req.body;
                    // Encrypt username, authorization and token.
                    username = encrypt(username);
                    authorization = encrypt(authorization);
                    token = encrypt(token);
                    // Get userId for given username from the database.
                    const dbQuery = await pool.query('SELECT "userId" FROM "users" WHERE "userName" = $1', [username]);
                    // Checks if the input is valid and no userIds exist for the specified username.
                    if (password === confirmPassword && password !== "" && username !== "" && token !== "" && authorization !== "" && regex.test(password) && password.length >= 8 && dbQuery.rowCount === 0) {
                        // Hash password.
                        const hash = hashPassword(password);
                        // Create user in the database.
                        await pool.query('INSERT INTO "users" ("userName", "userPassword", "userToken", "userAuthorization") VALUES ($1, $2, $3, $4)', [username, hash, token, authorization]);
                        // Send a JSON response with accessToken.
                        res.json({accessToken: req.token});
                    } else {
                        // Send 422 error as http response to client.
                        sendError(res, 422, "Given informations are invalid")
                    }
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, "Database - " + e);
            }
        });


        /**
         * Get protocol.
         */
        app.get('/protocol/:id', authenticateJWT, async (req, res) => {
            try {
                // Get id from params.
                const id = parseInt(req.params.id);
                if (Number.isInteger(id)) {
                    // Get data of the protocol with the given record_id with a REDCap request.
                    const result = await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&csvDelimiter=&records[0]=' + id + '&rawOrLabel=raw&rawOrLabelHeaders=raw&exportCheckboxLabel=false&exportSurveyFields=false&exportDataAccessGroups=false&returnFormat=json');
                    // Send a JSON response with protocol and accessToken.
                    res.json({protocol: result, accessToken: req.token});
                } else {
                    // Send 422 error as http response to client.
                    sendError(res, 422, "ID is not an integer.");
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        });

        /**
         * Get all EV protocol numbers.
         */
        app.get('/evprotnr', authenticateJWT, async (req, res) => {
            try {
                // Get all protnr's with a REDCap request.
                const result = await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&csvDelimiter=&fields[0]=protnr_01&fields[1]=protnr_02&fields[2]=protnr_03&fields[3]=protnr_04&fields[4]=protnr_05&fields[5]=record_id&rawOrLabel=raw&rawOrLabelHeaders=raw&exportCheckboxLabel=false&exportSurveyFields=false&exportDataAccessGroups=false&returnFormat=json');
                // Send a JSON response with protnr's and accessToken.
                res.json({protocol: result, accessToken: req.token});
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        });

        /**
         * Delete Protocol.
         */
        app.delete('/protocol/:id', authenticateJWT, async (req, res) => {
            try {
                // Check authorization level of user.
                if (req.user.authorization >= 2) {
                    // Get id from params.
                    const id = parseInt(req.params.id);
                    if (Number.isInteger(id)) {
                        // Delete the protocol of the given ID with a REDCap request.
                        await postAPIRequest(req.user.id, '&action=delete&content=record&records[0]=' + id);
                        // Send a JSON response with accessToken.
                        res.json({accessToken: req.token});
                    } else {
                        // Send 422 error as http response to client.
                        sendError(res, 422, "ID is not an integer.");
                    }
                } else {
                    // Send 403 error as http response to client.
                    sendError(res, 403, "You do not have the correct authorization level")
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        });

        /**
         * Update protocol.
         */
        app.put('/protocol/:id', authenticateJWT, async (req, res) => {
            try {
                // Get variables from body.
                let {protocol, amountMaxField, amountField, valid, evprotnrs} = req.body;
                // Get id from params.
                const id = parseInt(req.params.id);
                if (Number.isInteger(id)) {
                    // set variables.
                    let data = '"record_id":"' + id + '"';
                    let muco2aufn = 0;
                    let mulactaufn = 0;
                    let mukreaaufn = 0;
                    let muecprpco2 = 0;
                    let muecprpao2 = 0;
                    let muecprlact = 0;
                    let mubzaufn = 0;
                    let muhbaufn = 0;
                    // Get measuring units from the database.
                    const dbQueryMeasuringUnit = await pool.query('SELECT "measField", "measValue" FROM "measurement_units"');
                    // Set measuring units.
                    for (row of dbQueryMeasuringUnit.rows) {
                        switch (row.measField) {
                            case 'co2aufn':
                                muco2aufn = row.measValue;
                                break;
                            case   'lactaufn':
                                mulactaufn = row.measValue;
                                break;
                            case  'kreaaufn':
                                mukreaaufn = row.measValue;
                                break;
                            case  'ecprpco2':
                                muecprpco2 = row.measValue;
                                break;
                            case  'ecprpao2':
                                muecprpao2 = row.measValue;
                                break;
                            case  'ecprlact':
                                muecprlact = row.measValue;
                                break;
                            case  'bzaufn':
                                mubzaufn = row.measValue;
                                break;
                            case  'hbaufn':
                                muhbaufn = row.measValue;
                                break;
                        }
                    }
                    // Add protocol validity to the data string.
                    data += valid ? ',"validity":"1"' : ',"validity":"0"';
                    // Convert all date fields.
                    for (date of [['section1', 'datum'], ['section1', 'adatum'], ['section1', 'gebdat'], ['section4', 'dekg12'], ['section4', 'dct'], ['section4', 'dcoro'], ['section4', 'decls'], ['section4', 'diabp'], ['section4', 'dimpella'], ['section4hyb', 'dlyse'], ['section5', 'ecprdbk'], ['section5', 'ecprdst'], ['section5', 'ecprdend'], ['section6', 'dkuehlbeg'], ['section6', 'dzieltemp'], ['section8', 'vdatum'], ['section8', 'entldat'], ['section8hyb', 'dtod']]) {
                        if (protocol[date[0]][date[1]] && protocol[date[0]][date[1]] !== '') {
                            protocol[date[0]][date[1]] = Date.parse(protocol[date[0]][date[1]])
                            protocol[date[0]][date[1]] = new Date(protocol[date[0]][date[1]])
                            protocol[date[0]][date[1]].setDate(protocol[date[0]][date[1]].getDate() + 1);
                            protocol[date[0]][date[1]] = protocol[date[0]][date[1]].toISOString().split('T')[0]
                        }
                    }

                    /**
                     * Convert input with radio button to input and add to data string.
                     * @param section - Name of section of input field
                     * @param field - Name of input field
                     * @returns void
                     */
                    function setInputWithRadio(section, field) {
                        if (section[field] !== null && section[field] !== '' && section[field] !== 'NaN') {
                            data += ',"' + field + '":"' + section[field] + '"';
                        } else if (section[field + 'R'] && section[field + 'R'] !== '') {
                            data += ',"' + field + '":"' + section[field + 'R'] + '"';
                        } else {
                            data += ',"' + field + '":""';
                        }
                    }

                    /**
                     * Convert to the measuring units of the corresponding input and add to data string.
                     * @param section - Name of section of input field
                     * @param field - Name of input field
                     * @param calc - Multiplicator
                     * @param round - Rounds to the specified number of digits after the decimal point
                     * @returns void
                     */
                    function setInputCalcWithRadio(section, field, calc, round) {
                        if (section[field] !== null && section[field] !== '' && section[field] !== 'NaN') {
                            data += ',"' + field + '":"' + (parseFloat(section[field]) * calc).toFixed(round) + '"';
                        } else if (section[field + 'R'] && section[field + 'R'] !== '') {
                            data += ',"' + field + '":"' + section[field + 'R'] + '"';
                        } else {
                            data += ',"' + field + '":""';
                        }
                    }

                    /**
                     * Add input value to data string.
                     * @param section - Name of section of input field
                     * @param field - Name of input field
                     * @returns void
                     */
                    function setInputValue(section, field) {
                        data += section[field] ? ',"' + field + '":"' + section[field] + '"' : ',"' + field + '":""';
                    }

                    /**
                     * Check if input of radio button is possible then add to data string.
                     * @param section - Name of section of input field
                     * @param field - Name of input field
                     * @param values - Possible radio button values
                     * @returns void
                     */
                    function setRadioValue(section, field, values) {
                        data += values.includes(section[field]) ? ',"' + field + '":"' + section[field] + '"' : ',"' + field + '":""';
                        if (['zckb', 'urkrstst', 'rosc', 'ekg1', 'einsaort_cac'].includes(field) && values.includes(section[field])) {
                            data += ',"stat' + field + '":"1"';
                            amountField--;
                        } else if (['zckb', 'urkrstst', 'rosc', 'ekg1', 'einsaort_cac'].includes(field) && !values.includes(section[field])) {
                            data += ',"stat' + field + '":"0"';
                        }
                    }

                    /**
                     * Remove all checkboxes and add to data string.
                     * @param section - Name of section of input field
                     * @param field - Name of input field
                     * @param values - Possible checkbox values
                     * @returns void
                     */
                    function setCheckboxToZero(section, field, values) {
                        for (const val of values) {
                            data += ',"' + field + '___' + val + '":"0"';
                        }
                    }

                    /**
                     * Add all selected checkboxes to data string.
                     * @param section - Name of section of input field
                     * @param field - Name of input field
                     * @param values - Possible checkbox values
                     * @returns void
                     */
                    function setCheckbox(section, field, values) {
                        count = 1;
                        for (const val of values) {
                            data += section[field + count] ? ',"' + field + '___' + val + '":"1"' : ',"' + field + '___' + val + '":"0"';
                            count++;
                        }
                    }

                    // Set values of section 1.
                    let section = protocol.section1
                    let count = 1;
                    for (let i = 0; i < 5; i++) {
                        let protnr = section.protnrArray[i] ? section.protnrArray[i] : null;
                        for (const protocol of Object.values(evprotnrs)) {
                            if (protnr && protnr.protnr && id !== parseInt(protocol.record_id, 10) && [protocol.protnr_01, protocol.protnr_02, protocol.protnr_03, protocol.protnr_04, protocol.protnr_05].includes(protnr.protnr)) {
                                data += ',"protnr_0' + count + '":""';
                            } else if (protnr && protnr.protnr && protnr.protnr && id === parseInt(protocol.record_id, 10)) {
                                data += ',"protnr_0' + count + '":"' + protnr.protnr + '"';
                            } else if (id === parseInt(protocol.record_id, 10)) {
                                data += ',"protnr_0' + count + '":""';
                            }
                        }
                        count++;
                    }
                    setInputValue(section, 'datum');
                    if (section.adatum && section.adatum !== '') {
                        data += ',"adatum":"' + section.adatum + '"';
                    } else if (section.adatumR && section.adatumR !== '') {
                        data += ',"adatum":"' + section.adatumR + '"';
                    } else {
                        data += ',"adatum":""';
                    }
                    if (section.gebdat && section.gebdat !== '') {
                        data += ',"gebdat":"' + section.gebdat + '"';
                    } else if (section.gebdatR && section.gebdatR !== '') {
                        data += ',"gebdat":"' + section.gebdatR + '"';
                    } else {
                        data += ',"gebdat":""';
                    }
                    for (field of ['zadatum', 'stokenn', 'namklin', 'patid', 'aufnq']) {
                        setInputValue(section, field);
                    }
                    data += ',"iknumklin":"' + section.namklin + '"';

                    setRadioValue(section, 'geschl', ['01', '02', '03']);
                    setRadioValue(section, 'aufnq', ['01', '02']);
                    setRadioValue(section, 'zkuebgp', ['00', '01', '02', '03', '04', '05', '06', '07', '08', '99']);
                    // Set values of section 2.
                    section = protocol.section2
                    setRadioValue(section, 'ekg1', ['01', '09', '10', '11', '97', '99']);
                    setRadioValue(section, 'urkrstst', ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '99']);
                    if (protocol.section1.aufnq === '01') {
                        setRadioValue(section, 'einsaort_cac', ['00', '01', '02', '03', '04', '06', '07', '09', '10', '11', '12', '99']);
                        data += ',"eoko":"","eokc":""';
                    }
                    if (protocol.section1.aufnq === '02') {
                        setRadioValue(section, 'eoko', ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '99']);
                        setRadioValue(section, 'eokc', ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '98']);
                        data += ',"einsaort_cac":""';
                    }
                    setRadioValue(section, 'zckb', ['01', '02', '03', '04', '05', '98']);
                    for (field of ['zkoll', 'zhdm']) {
                        setInputValue(section, field);
                    }
                    setRadioValue(section, 'zchdm', ['01', '02', '03', '04', '99']);
                    setRadioValue(section, 'rosc', ['01', '02']);
                    if (section.rosc === '02') {
                        setInputValue(section, 'zrosc1');
                    } else {
                        data += ',"zrosc1":""';
                    }
                    for (field of ['adrena', 'amioda']) {
                        setInputWithRadio(section, field)
                    }
                    setRadioValue(section, 'pes', ['00', '01', '02', '03', '04', '05']);
                    setRadioValue(section, 'autocpr', ['05', '06']);
                    // Set values of section 3.
                    section = protocol.section3
                    setRadioValue(section, 'rosca', ['01', '02', '03', '04', '98', '99']);
                    if (section.rosca === '01') {
                        setRadioValue(section, 'bewaufn', ['01', '02', '03', '04', '98', '99']);
                        for (field of ['rraufn', 'rrdaufn', 'hfaufn']) {
                            setInputWithRadio(section, field)
                        }
                    } else {
                        for (field of ['bewaufn', 'rraufn', 'rrdaufn', 'hfaufn']) {
                            data += ',"' + field + '":""';
                        }
                    }
                    setCheckbox(section, 'ekgaufn', ['00', '01', '02', '03', '04', '05', '06', '09', '10', '11', '12', '13', '98', '99'])
                    muco2aufn === 2 ? setInputCalcWithRadio(section, 'co2aufn', 7.5006375541921, 3) : setInputWithRadio(section, 'co2aufn');
                    mulactaufn === 2 ? setInputCalcWithRadio(section, 'lactaufn', 9.01, 2) : setInputWithRadio(section, 'lactaufn');
                    mubzaufn === 2 ? setInputCalcWithRadio(section, 'bzaufn', 18.018, 0) : setInputWithRadio(section, 'bzaufn');
                    mukreaaufn === 2 ? setInputCalcWithRadio(section, 'kreaaufn', 0.0113120016765577, 3) : setInputWithRadio(section, 'kreaaufn');
                    for (field of ['afaufn', 'o2saufn', 'tempaufn']) {
                        setInputWithRadio(section, field)
                    }
                    setRadioValue(section, 'beataufn', ['01', '02']);
                    setRadioValue(section, 'bgaaufn', ['00', '01', '02', '03', '99']);
                    if (['01', '02', '03', '99'].includes(section.bgaaufn)) {
                        for (field of ['phaufn', 'beaufn', 'pco2aufn']) {
                            setInputWithRadio(section, field)
                        }
                        muhbaufn === 1 ? setInputCalcWithRadio(section, 'hbaufn', 0.1, 1) : setInputWithRadio(section, 'hbaufn');
                    } else {
                        for (field of ['phaufn', 'beaufn', 'pco2aufn', 'hbaufn']) {
                            data += ',"' + field + '":""';
                        }
                    }
                    setRadioValue(section, 'tropart', ['01', '02']);
                    for (field of ['troponw', 'tropaaufn', 'tropaufn', 'trop2aaufn', 'trop2aufn', 'bnpaufn']) {
                        setInputValue(section, field)
                    }
                    setRadioValue(section, 'urkrststaufn', ['01', '02', '03', '04', '05', '13', '98', '99']);
                    if (['02', '03', '04', '98'].includes(section.rosca)) {
                        setInputWithRadio(section, 'zroscaufn')
                    } else {
                        for (field of ['zroscaufn']) {
                            data += ',"' + field + '":""';
                        }
                    }
                    // Set values of section 3hyb.
                    section = protocol.section3hyb;
                    setCheckbox(section, 'reaverl', ['02', '03', '04', '05', '06', '07', '08', '10'])
                    // Set values of section 4.
                    section = protocol.section4;
                    setRadioValue(section, 'ekg12', ['01', '03', '99']);
                    setRadioValue(section, 'ct', ['01', '03', '99']);
                    if (section.ekg12 === '01') {
                        setInputValue(section, 'dekg12');
                        setInputValue(section, 'zekg12');
                        setRadioValue(section, 'ekg12auf', ['01', '02']);
                    } else {
                        data += ',"dekg12":"","zekg12":"","ekg12auf":""';
                    }
                    if (section.ct === '01') {
                        setInputValue(section, 'dct');
                        setInputValue(section, 'zct');
                    } else {
                        data += ',"dct":""';
                        data += ',"zct":""';
                    }
                    setRadioValue(section, 'stemi', ['01', '02']);
                    setRadioValue(section, 'efast', ['01', '02', '99']);
                    setRadioValue(section, 'coro', ['01', '02', '99']);
                    if (section.coro === '01') {
                        setInputValue(section, 'dcoro');
                        setInputValue(section, 'zcoro');
                        setRadioValue(section, 'coro_cpr', ['01', '02', '03', '04', '98']);
                        data += ',"ncoro_grund":""';
                    } else if (section.coro === '02') {
                        data += ',"dcoro":"","zcoro":"","coro_cpr":""';
                        setRadioValue(section, 'ncoro_grund', ['04', '05', '06']);
                    } else {
                        data += ',"dcoro":"","zcoro":"","coro_cpr":"","ncoro_grund":""';
                    }
                    setRadioValue(section, 'ecls', ['01', '02', '03']);
                    if (['02', '03'].includes(section.ecls)) {
                        setInputValue(section, 'decls');
                        setInputValue(section, 'zecls');
                    } else {
                        data += ',"decls":"","zecls":""';
                    }
                    setRadioValue(section, 'geniabp', ['02', '03', '04', '05']);
                    if (['03', '04'].includes(section.geniabp)) {
                        setInputValue(section, 'diabp');
                        setInputValue(section, 'ziabp');
                    } else {
                        data += ',"diabp":"","ziabp":""';
                    }
                    setRadioValue(section, 'genimpella', ['02', '03', '04']);
                    if (['03', '04'].includes(section.geniabp)) {
                        setInputValue(section, 'dimpella');
                        setInputValue(section, 'zimpella');
                    } else {
                        data += ',"diabp":"","ziabp":""';
                    }
                    setRadioValue(section, 'acb', ['02', '03', '04', '05']);
                    setRadioValue(section, 'genpacerwv', ['02', '03', '04']);
                    setRadioValue(section, 'epu', ['01', '02']);
                    setCheckbox(section, 'hits', ['01', '02', '03', '04', '05', '06', '07', '08', '98'])
                    setRadioValue(section, 'bzziel2', ['01', '02']);
                    setInputWithRadio(section, 'rrziel3');
                    // Set values of section 4ICU.
                    section = protocol.section4ICU
                    setCheckbox(section, 'instab', ['01', '02', '03', '04', '97', '98'])
                    // Set values of section 4hyb.
                    section = protocol.section4hyb
                    setRadioValue(section, 'tee', ['01', '02', '99']);
                    setRadioValue(section, 'tte', ['01', '03', '99']);
                    if (protocol.section4.coro === '01') {
                        setRadioValue(section, 'pci', ['01', '02', '99']);
                        if (section.pci === '01') {
                            setRadioValue(section, 'pcierfolg', ['01', '02', '99']);
                            if (section.pcierfolg === '01') {
                                setCheckbox(section, 'pcigefae', ['01', '02', '03', '04', '98'])
                            } else {
                                setCheckboxToZero(section, 'pcigefae', ['01', '02', '03', '04', '98'])
                            }
                        } else {
                            setCheckboxToZero(section, 'pcigefae', ['01', '02', '03', '04', '98'])
                            data += ',"pcierfolg":""';
                        }
                    } else {
                        setCheckboxToZero(section, 'pcigefae', ['01', '02', '03', '04', '98'])
                        data += ',"pcierfolg":"","pci":""';
                    }
                    setRadioValue(section, 'lyse', ['01', '02', '03', '98', '99']);
                    if (['02', '03', '98'].includes(section.lyse)) {
                        setCheckbox(section, 'lyse_rosc', ['01', '02', '03'])
                        setInputValue(section, 'dlyse');
                        setInputValue(section, 'zlyse');
                    } else {
                        setCheckboxToZero(section, 'lyse_rosc', ['01', '02', '03'])
                        data += ',"dlyse":"","zlyse":""';
                    }
                    // Set values of section 5.
                    section = protocol.section5
                    if (protocol.section4.ecls === '02') {
                        for (field of ['ecprdbk', 'ecprzbk', 'ecprdst', 'ecprzst', 'ecprph', 'ecprbe', 'ecprdend', 'ecprzend']) {
                            setInputValue(section, field)
                        }
                        setRadioValue(section, 'ecprpunkt', ['01', '02', '03', '04']);
                        setRadioValue(section, 'ecprart', ['01', '02', '03', '98']);
                        setCheckbox(section, 'ecprven', ['01', '02', '03', '04', '98'])
                        setCheckbox(section, 'ecprkompl', ['01', '02', '03', '04', '98', '99'])
                        setRadioValue(section, 'ecprbein', ['01', '02']);
                        setRadioValue(section, 'ecprvav', ['01', '02', '03']);
                        setRadioValue(section, 'roscecpr', ['01', '02', '03', '04']);
                        setRadioValue(section, 'ecprende', ['01', '02', '03']);
                        muecprpco2 === 2 ? setInputCalcWithRadio(section, 'ecprpco2', 7.5006375541921, 3) : setInputWithRadio(section, 'ecprpco2');
                        muecprpao2 === 2 ? setInputCalcWithRadio(section, 'ecprpao2', 7.5006375541921, 3) : setInputWithRadio(section, 'ecprpao2');
                        muecprlact === 2 ? setInputCalcWithRadio(section, 'ecprlact', 9.01, 2) : setInputWithRadio(section, 'ecprlact');
                        if (['03', '04'].includes(protocol.section4.iabp)) {
                            setRadioValue(section, 'eclsiabp', ['01', '02', '03']);
                        } else {
                            data += ',"eclsiabp":""';
                        }
                        if (['03', '04'].includes(protocol.section4.impella)) {
                            setRadioValue(section, 'impellaecls', ['01', '02', '03']);
                        } else {
                            data += ',"impellaecls":""';
                        }
                    } else {
                        data += ',"ecprdbk":"","ecprzbk":"","ecprdst":"","ecprzst":"","ecprlact":"","ecprph":"","ecprbe":"","ecprpco2":"","ecprpao2":"","ecprpunkt":"","ecprart":"","ecprbein":"","ecprvav":"","roscecpr":"","ecprende":"","ecprdend":"","ecprzend":"","eclsiabp":"","impellaecls":""';
                        setCheckboxToZero(section, 'ecprven', ['01', '02', '03', '04', '98'])
                        setCheckboxToZero(section, 'ecprkompl', ['01', '02', '03', '04', '98', '99'])
                    }
                    // Set values of section 6.
                    section = protocol.section6
                    setRadioValue(section, 'aktkuehl', ['00', '01', '02', '03']);
                    if (section.aktkuehl === '01') {
                        setRadioValue(section, 'kuehlbeg', ['01', '03', '04']);
                        setInputWithRadio(section, 'dkuehlbeg')
                        setInputWithRadio(section, 'zkuehlbeg')
                        setRadioValue(section, 'dauerkuehl', ['01', '02', '03', '04', '99']);
                        setRadioValue(section, 'zieltemp1', ['01', '02', '03', '04', '99']);
                        setInputValue(section, 'dzieltemp');
                        setInputValue(section, 'zzieltemp');
                        setRadioValue(section, 'kuehlrel', ['01', '02']);
                        data += ',"naktkuehl_grund":""';
                    } else if (section.aktkuehl === '02') {
                        setRadioValue(section, 'naktkuehl_grund', ['04', '05', '06', '98']);
                        data += ',"kuehlbeg":"","dkuehlbeg":"","zkuehlbeg":"","dauerkuehl":"","zieltemp1":"","dzieltemp":"","zzieltemp":"","kuehlrel":""';
                    } else {
                        data += ',"naktkuehl_grund":"","kuehlbeg":"","dkuehlbeg":"","zkuehlbeg":"","dauerkuehl":"","zieltemp1":"","dzieltemp":"","zzieltemp":"","kuehlrel":""';
                    }
                    setRadioValue(section, 'fieb', ['01', '02']);
                    if (section.fieb === '01') {
                        setRadioValue(section, 'fiebrpae', ['01', '02']);
                    } else {
                        data += ',"fiebrpae":""';
                    }
                    // Set values of section 7.
                    section = protocol.section7;
                    for (field of ['ssep', 'nse', 'eegwv', 'cct', 'cmrt', 'neuro']) {
                        setRadioValue(section, field, ['01', '02']);
                    }
                    // Set values of section 8hyb.
                    section = protocol.section8hyb;
                    setRadioValue(section, 'leb24h', ['01', '02', '99']);
                    setInputWithRadio(section, 'dtod');
                    setInputWithRadio(section, 'ztod');
                    // Set values of section 8.
                    section = protocol.section8;
                    setRadioValue(section, 'leb30d', ['01', '02', '99']);
                    setCheckbox(section, 'komplsek', ['02', '03', '04', '05', '08', '09', '97', '98', '99'])
                    setInputWithRadio(section, 'icutage');
                    setInputWithRadio(section, 'beatstd');
                    setRadioValue(section, 'icdimpl', ['01', '02']);
                    setRadioValue(section, 'lebentl', ['01', '02', '99']);
                    setRadioValue(section, 'thlimit', ['01', '02', '99']);
                    if (section.thlimit === '01') {
                        setCheckbox(section, 'gthlimit', ['01', '02', '03', '04', '98'])
                    } else {
                        setCheckboxToZero(section, 'gthlimit', ['01', '02', '03', '04', '98'])
                    }
                    setRadioValue(section, 'organexpl', ['01', '02']);
                    setInputWithRadio(section, 'entldat')
                    setRadioValue(section, 'wvwie', ['01', '02', '99']);
                    if (section.wvwie === '01') {
                        setInputValue(section, 'vdatum');
                        setInputValue(section, 'zvdatum');
                        setCheckbox(section, 'wvgrund', ['01', '02', '03', '04', '05', '06', '07', '98'])
                    } else {
                        data += ',"vdatum":"","zvdatum":""';
                        setCheckboxToZero(section, 'wvgrund', ['01', '02', '03', '04', '05', '06', '07', '98'])
                    }
                    if (section.lebentl === '01') {
                        setRadioValue(section, 'cpcentl', ['01', '02', '03', '04', '99']);
                        setRadioValue(section, 'mrsentl', ['00', '01', '02', '03', '04', '05']);
                        if (section.lebensqual1 === '01') {
                            setInputValue(section, 'eq5d');
                            setInputValue(section, 'sf12');
                        } else {
                            data += ',"eq5d":"","sf12":""';
                        }
                    } else {
                        data += ',"cpcentl":"","mrsentl":"","eq5d":"","sf12":""';
                    }
                    setRadioValue(section, 'cpcvor', ['01', '02', '03', '04']);
                    setRadioValue(section, 'mrsvor', ['00', '01', '02', '03', '04', '05']);
                    setRadioValue(section, 'lebensqual1', ['01', '02']);
                    data += ',"statmaxpflicht":"' + amountMaxField + '","statistpflicht":"' + amountField + '"';
                    // Update protocol  with REDCap request.
                    const result = await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&overwriteBehavior=overwrite&forceAutoNumber=false&data=[{' + data + '}]&returnContent=count&returnFormat=json');
                    if (result.count === 1) {
                        // Send a JSON response with accessToken.
                        res.json({accessToken: req.token});
                    } else {
                        // Send 422 error as http response to client.
                        sendError(res, 422, "Update not successful");
                    }
                } else {
                    // Send 422 error as http response to client.
                    sendError(res, 422, "ID is not an integer.");
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        });

        /**
         * Create a protocol.
         */
        app.post('/protocol', authenticateJWT, async (req, res) => {
            try {
                // Get the patid, the number of required fields and the number of filled required fields from the body.
                const patid = parseInt(req.body.patid);
                const maxRequired = parseInt(req.body.maxRequired);
                const isValid = parseInt(req.body.isValid);
                if (Number.isInteger(patid)) {
                    // Get next higher record_id from REDCap.
                    const newId = await postAPIRequest(req.user.id, '&content=generateNextRecordName');
                    const data = '"record_id":"' + newId + '","patid":"' + patid + '","statmaxpflicht":"' + maxRequired + '","statistpflicht":"' + isValid + '"';
                    // Create a new protocol.
                    await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&overwriteBehavior=normal&forceAutoNumber=false&data=[{' + data + '}]&returnContent=count&returnFormat=json');
                    // Get data of created protocol.
                    const result = await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&csvDelimiter=&records[0]=' + newId + '&rawOrLabel=raw&rawOrLabelHeaders=raw&exportCheckboxLabel=false&exportSurveyFields=false&exportDataAccessGroups=false&returnFormat=json');
                    // Send a JSON response with record_id and accessToken.
                    res.json({protocol: result[0].record_id, accessToken: req.token});
                } else {
                    // Send 422 error as http response to client.
                    sendError(res, 422, "Patid is not an integer.");
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        });

        /**
         * Get protnr's, record_id and importstatus of protocols.
         */
        app.get('/import/checkImport/:data', authenticateJWT, async (req, res) => {
            try {
                // Get protocol numbers from the body.
                const protnrs = req.params.data.split(',');
                const results = [];
                // For each protnr in the array, a REDCap request is performed to get data.
                for (protnr of protnrs) {
                    if (protnr !== '') {
                        const result = await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&csvDelimiter=&fields[0]=protnr_01&fields[1]=protnr_02&fields[2]=protnr_03&fields[3]=protnr_04&fields[4]=protnr_05&fields[5]=record_id&fields[6]=statimport&rawOrLabel=raw&rawOrLabelHeaders=raw&exportCheckboxLabel=false&exportSurveyFields=false&exportDataAccessGroups=false&returnFormat=json&filterLogic=[protnr_01]="' + protnr + '" || [protnr_02]="' + protnr + '" || [protnr_03]="' + protnr + '" || [protnr_04]="' + protnr + '" || [protnr_05]="' + protnr + '"');
                        if (result.length === 1) {
                            // Send a JSON response with protocols and accessToken.
                            results.push({
                                'id': result[0].record_id,
                                'protnr': protnr,
                                'statimport': result[0].statimport
                            });
                        } else if (result.length > 1) {
                            // Send 422 error as http response to client.
                            sendError(res, 422, "Multiple value of id detected: " + protnr);
                        }
                    }
                }
                // Send a JSON response with protocols and accessToken.
                res.json({protocols: results, accessToken: req.token});
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        })

        /**
         * Import protocol data.
         */
        app.put('/import/', authenticateJWT, async (req, res) => {
            try {
                // get length of import.
                const length = req.body.import.length;
                let counter = 0;
                for (let protocol of req.body.import) {
                    delete protocol.protnr;
                    let data = '"aufnq":"01"';
                    //  For each field of the protocol that should be imported, the validity of the entry is checked.
                    //  If the data is valid, it is added to the string data. If there is an error, the 422-http error is sent to the client.
                    if (protocol.einsaort_cac && ['01', '02', '03', '11', '06', '10', '04', '09', '00'].includes(protocol.einsaort_cac)) {
                        data += ',"einsaort_cac":"' + protocol.einsaort_cac + '","stateinsaort_cac":"' + 1 + '"';
                    } else if (protocol.einsaort_cac) {
                        sendError(res, 422, "Given informations of field einsaort_cac is invalid");
                    }
                    if (protocol.zckb && ['05', '01', '02', '04', '98'].includes(protocol.zckb)) {
                        data += ',"zckb":"' + protocol.zckb + '","statzckb":"' + 1 + '"';
                    } else if (protocol.zckb) {
                        sendError(res, 422, "Given informations of field zckb is invalid");
                    }
                    if (protocol.urkrstst && ['02', '05', '03', '04'].includes(protocol.urkrstst)) {
                        data += ',"urkrstst":"' + protocol.urkrstst + '","staturkrstst":"' + 1 + '"';
                    } else if (protocol.urkrstst) {
                        sendError(res, 422, "Given informations of field urkrstst is invalid");
                    }
                    if (protocol.rosc && ['01', '02'].includes(protocol.rosc)) {
                        data += ',"rosc":"' + protocol.rosc + '","statrosc":"' + 1 + '"';
                    } else if (protocol.rosc) {
                        sendError(res, 422, "Given informations of field rosc is invalid");
                    }
                    if (protocol.ekg1 && ['11', '09', '10', '01', '99'].includes(protocol.ekg1)) {
                        data += ',"ekg1":"' + protocol.ekg1 + '","statekg1":"' + 1 + '"';
                    } else if (protocol.ekg1) {
                        sendError(res, 422, "Given informations of field ekg1 is invalid");
                    }
                    if (protocol.autocpr && ['05', '06'].includes(protocol.autocpr)) {
                        data += ',"autocpr":"' + protocol.autocpr + '"';
                    } else if (protocol.autocpr) {
                        sendError(res, 422, "Given informations of field autocpr is invalid");
                    }
                    if (protocol.id) {
                        data += ',"record_id":"' + protocol.id + '"';
                    } else {
                        sendError(res, 422, "Given informations of field id is invalid");
                    }
                    if (protocol.imported && ['1'].includes(protocol.imported)) {
                        data += ',"statimport":"1"';
                    } else if (protocol.imported) {
                        sendError(res, 422, "Given informations of field imported is invalid");
                    }
                    // Do REDCap import request.
                    const result = await postAPIRequest(req.user.id, '&content=record&format=json&type=flat&overwriteBehavior=overwrite&forceAutoNumber=false&data=[{' + data + '}]&returnContent=count&returnFormat=json');
                    counter += result.count;
                }
                if (counter === length) {
                    // Send a JSON response with accessToken to client.
                    res.json({accessToken: req.token});
                } else {
                    // Send 422 error as http response to client.
                    sendError(res, 422, "Something went wrong");
                }
            } catch (e) {
                // Send 500 error as http response to client.
                sendError(res, 500, e.toString());
            }
        })
        // Start app on port 3000.
        app.listen(3000, () => {
            console.log('Middleware runs at port 3000')
        })
    } catch (e) {
        // Output errors in the console.
        console.log(e);
    }
}

// Start Middleware
middlewareStart();
