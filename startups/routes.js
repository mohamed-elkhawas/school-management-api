const express = require('express');
const user = require('../routes/user');
const login = require('../routes/login');
const logout = require('../routes/logout');
const school = require('../routes/school');
const classroom = require('../routes/classroom');
const student = require('../routes/student');
const error = require('../middlewares/error');

module.exports = function(app) {
    app.use(express.json());
    app.use('/api/user', user);
    app.use('/api/login', login);
    app.use('/api/logout', logout);
    app.use('/api/school', school);
    app.use('/api/classroom', classroom);
    app.use('/api/student', student);
    app.use(error);
}
