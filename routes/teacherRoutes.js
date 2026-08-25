const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const userModel = require('../models/userModel');
const meritModel = require('../models/meritModel');

router.get('/login', (req, res) => {
    res.render(
        'teacher/login',
        { error: null }
    );
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user =
            await userModel.getUserByEmail(
                email
            );

        if (
            !user ||
            user.role !== 'teacher' ||
            !user.password_hash
        ) {
            return res.status(400).render(
                'teacher/login',
                {
                    error:
                        req.t(
                            'teacher.invalidLogin'
                        )
                }
            );
        }

        const valid =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!valid) {
            return res.status(401).render(
                'teacher/login',
                {
                    error:
                        req.t(
                            'teacher.invalidLogin'
                        )
                }
            );
        }

        req.session.teacherId =
            user.id;

        req.session.teacherName =
            user.full_name;

        res.redirect(
            '/teacher/dashboard'
        );

    } catch (err) {
        console.error(
            'Teacher login error:',
            err
        );

        res.status(500).render(
            'teacher/login',
            {
                error:
                    req.t(
                        'common.serverError'
                    )
            }
        );
    }
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.teacherId) {
        return res.redirect(
            '/teacher/login'
        );
    }

    try {
        const classes =
            await userModel.getClasses();

        if (!classes.length) {
            return res.render(
                'teacher/dashboard',
                {
                    teacherName:
                        req.session.teacherName,
                    classes: [],
                    selectedClassId: null,
                    students: [],
                    success: null
                }
            );
        }

        const requestedClassId =
            Number(req.query.classId);

        const classExists =
            classes.some(
                item =>
                    item.id ===
                    requestedClassId
            );

        const selectedClassId =
            classExists
                ? requestedClassId
                : classes[0].id;

        const students =
            await userModel.getStudentsByClass(
                selectedClassId
            );

        const studentsWithBalance =
            await Promise.all(
                students.map(
                    async student => ({
                        ...student,
                        balance:
                            await meritModel.getBalance(
                                student.id
                            )
                    })
                )
            );

        res.render(
            'teacher/dashboard',
            {
                teacherName:
                    req.session.teacherName,
                classes,
                selectedClassId,
                students:
                    studentsWithBalance,
                success:
                    req.query.success === '1'
                        ? req.t(
                            'teacher.success'
                        )
                        : null
            }
        );

    } catch (err) {
        console.error(
            'Teacher dashboard error:',
            err
        );

        res.status(500).send(
            req.t('common.serverError')
        );
    }
});

router.post('/add-merits', async (req, res) => {
    if (!req.session.teacherId) {
        return res.status(401).send(
            req.t('purchase.notAuthorized')
        );
    }

    const userId =
        Number(req.body.userId);

    const classId =
        Number(req.body.classId);

    const amount =
        Number(req.body.amount);

    const reason =
        String(req.body.reason || '').trim();

    if (
        !Number.isInteger(userId) ||
        !Number.isInteger(classId) ||
        !Number.isInteger(amount) ||
        amount <= 0 ||
        !reason
    ) {
        return res.status(400).send(
            req.t('teacher.invalidData')
        );
    }

    try {
        const students =
            await userModel.getStudentsByClass(
                classId
            );

        const studentExists =
            students.some(
                item => item.id === userId
            );

        if (!studentExists) {
            return res.status(400).send(
                req.t('teacher.wrongClass')
            );
        }

        await meritModel.addMerits(
            userId,
            amount,
            reason,
            req.session.teacherId
        );

        res.redirect(
            `/teacher/dashboard?classId=${classId}&success=1`
        );

    } catch (err) {
        console.error(
            'Teacher add merits error:',
            err
        );

        res.status(500).send(
            req.t('teacher.addError')
        );
    }
});

router.get('/logout', (req, res) => {
    delete req.session.teacherId;
    delete req.session.teacherName;

    res.redirect('/teacher/login');
});

module.exports = router;
