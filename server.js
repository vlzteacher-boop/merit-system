require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const pool = require('./models/db');

const studentRoutes = require('./routes/studentRoutes');
const curatorRoutes = require('./routes/curatorRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new pgSession({
        pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

app.use('/student', studentRoutes);
app.use('/curator', curatorRoutes);
app.use('/teacher', teacherRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.redirect('/student');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
