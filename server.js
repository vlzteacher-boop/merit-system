require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const pool = require('./models/db');
const {
    normalizeLanguage,
    createTranslator
} = require('./utils/i18n');

const studentRoutes = require('./routes/studentRoutes');
const curatorRoutes = require('./routes/curatorRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
    console.warn(
        'WARNING: SESSION_SECRET is not set. ' +
        'Set it in .env before production deployment.'
    );
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new pgSession({
        pool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'development-only-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.use((req, res, next) => {
    const language = normalizeLanguage(req.session.language);

    req.language = language;
    req.t = createTranslator(language);

    res.locals.lang = language;
    res.locals.t = req.t;
    res.locals.languageUrl = targetLanguage => {
        const target = normalizeLanguage(targetLanguage);
        const nextPath = req.originalUrl.startsWith('/')
            ? req.originalUrl
            : '/student';

        return `/lang/${target}?next=${encodeURIComponent(nextPath)}`;
    };

    next();
});

app.get('/lang/:language', (req, res) => {
    req.session.language = normalizeLanguage(req.params.language);

    const nextPath = String(req.query.next || '/student');

    if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
        return res.redirect('/student');
    }

    return res.redirect(nextPath);
});

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
