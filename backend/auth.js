const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const postgresApi = require('./postgresApi');

function hashPassword(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
}

function comparePassword(password, hashPassword) {
  return bcrypt.compareSync(password, hashPassword);
}

function generateToken(id) {
  const token = jwt.sign({
    userId: id
  },
    process.env.secret, { expiresIn: '7d' }
  );
  return token;
}

// Verify JSON Web Token authentication
async function verifyAuth(req, res, next) {
  if (process.env.NODE_ENV === 'DEV') {
    next(); // Shortcut for development
    return;
  }

  const token = req.headers['x-access-token'];

  if(!token) {
    return res.status(400).send({ 'message': 'Access token is not provided.' });
  }

  try {
    const decoded = await jwt.verify(token, process.env.secret);
    
    const result = await postgresApi.getUser(decoded.userId);

    if(!result) {
      return res.status(401).send({ 'message': 'The provided access token is invalid.' });
    }

    req.user = { id: decoded.userId };
    next();
    return;
  }
  catch(e) {
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).send({ 'message': 'The provided access token is invalid.' });
    }

    console.error(e.stack);
    return res.status(500).send(e.message);
  }
}

// verifySihteeri and verifyMyyja: check that the user has the required privileges for the operation
// Both functions assume that verifyAuth has been executed before them

async function verifyMyyja(req, res, next) {
  return await verifyRole(req, res, next, postgresApi.getMainosmyyja);
}

async function verifySihteeri(req, res, next) {
  return await verifyRole(req, res, next, postgresApi.getTaloussihteeri);
}

async function verifyRole(req, res, next, apiFunction) {
  if (process.env.NODE_ENV === 'DEV') {
    next(); // Shortcut for development
    return;
  }

  const username = req.user.id;

  if (!username) {
    return res.status(500).send({ 'message': 'Käyttäjän roolia ei voitu vahvistaa.' });
  }

  try {
    const result = await apiFunction(username);

    if(!result) {
      return res.status(401).send({ 'message': 'Käyttäjän roolilla ei ole valtuuksia tähän toimenpiteeseen.' });
    }

    next();
    return;
  }
  catch(e) {
    console.error(e.stack);
    return res.status(500).send(e.message);
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyAuth,
  verifyMyyja,
  verifySihteeri
};