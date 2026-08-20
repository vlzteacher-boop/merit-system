const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const userModel = require('../models/userModel');
const meritModel = require('../models/meritModel');

router.get('/login', (req, res) => {
    res.render('teacher/login', { error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.getUserByEmail(email);

        if (!user || user.role !== 'teacher') {
            return res.status(400).render('teacher/login', {
                error: 'Неверный email или роль'
            });
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).render('teacher/login', {
                error: 'Неверный пароль'
            });
        }

        req.session.teacherId = user.id;
        req.session.teacherName = user.full_name;

        res.redirect('/teacher/dashboard');

    } catch (err) {
        console.error('Teacher login error:', err);
        res.status(500).render('teacher/login', {
            error: 'Ошибка сервера'
        });
    }
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.teacherId) {
        return res.redirect('/teacher/login');
    }

    try {
        const classes = await userModel.getClasses();

        if (!classes.length) {
            return res.render('teacher/dashboard', {
                teacherName: req.session.teacherName,
                classes: [],
                selectedClassId: null,
                students: [],
                success: null
            });
        }

        const requestedClassId = Number(req.query.classId);
        const classExists = classes.some(c => c.id === requestedClassId);

        const selectedClassId = classExists
            ? requestedClassId
            : classes[0].id;

        const students = await userModel.getStudentsByClass(selectedClassId);

        const studentsWithBalance = await Promise.all(
            students.map(async s => ({
                ...s,
                balance: await meritModel.getBalance(s.id)
            }))
        );

        res.render('teacher/dashboard', {
            teacherName: req.session.teacherName,
            classes,
            selectedClassId,
            students: studentsWithBalance,
            success: req.query.success === '1' ? 'Мериты начислены' : null
        });

    } catch (err) {
        console.error('Teacher dashboard error:', err);
        res.status(500).send('Ошибка загрузки кабинета учителя');
    }
});

router.post('/add-merits', async (req, res) => {
    if (!req.session.teacherId) {
        return res.status(401).send('Не авторизован');
    }

    const userId = Number(req.body.userId);
    const classId = Number(req.body.classId);
    const amount = Number(req.body.amount);
    const reason = String(req.body.reason || '').trim();

    if (
        !Number.isInteger(userId) ||
        !Number.isInteger(classId) ||
        !Number.isInteger(amount) ||
        amount <= 0 ||
        !reason
    ) {
        return res.status(400).send('Некорректные данные');
    }

    try {
        const students = await userModel.getStudentsByClass(classId);
        const studentExists = students.some(s => s.id === userId);

        if (!studentExists) {
            return res.status(400).send('Ученик не относится к выбранному классу');
        }

        await meritModel.addMerits(
            userId,
            amount,
            reason,
            req.session.teacherId
        );

        res.redirect(`/teacher/dashboard?classId=${classId}&success=1`);

    } catch (err) {
        console.error('Teacher add merits error:', err);
        res.status(500).send('Ошибка начисления меритов');
    }
});

router.get('/logout', (req, res) => {
    delete req.session.teacherId;
    delete req.session.teacherName;
    res.redirect('/teacher/login');
});

module.exports = router;
