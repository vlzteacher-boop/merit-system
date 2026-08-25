const express = require('express');
const router = express.Router();

const userModel = require('../models/userModel');
const meritModel = require('../models/meritModel');
const orderModel = require('../models/orderModel');
const rewardModel = require('../models/rewardModel');

router.get('/', async (req, res) => {
    try {
        const classes =
            await userModel.getClasses();

        res.render(
            'student/login',
            { classes }
        );

    } catch (err) {
        console.error(
            'Student login page error:',
            err
        );

        res.status(500).send(
            req.t('common.serverError')
        );
    }
});

router.post('/login', async (req, res) => {
    const {
        classId,
        journalNumber,
        pin
    } = req.body;

    try {
        const user =
            await userModel.getUserByClassAndNumber(
                classId,
                journalNumber
            );

        if (!user) {
            return res.status(400).json({
                success: false,
                message:
                    req.t('student.notFound')
            });
        }

        const valid =
            await userModel.verifyPin(
                user.id,
                pin
            );

        if (!valid) {
            return res.status(401).json({
                success: false,
                message:
                    req.t('student.wrongPin')
            });
        }

        req.session.studentId =
            user.id;

        req.session.studentName =
            user.full_name;

        req.session.classId =
            user.class_id;

        return res.json({
            success: true
        });

    } catch (err) {
        console.error(
            'Student login error:',
            err
        );

        return res.status(500).json({
            success: false,
            message:
                req.t('common.serverError')
        });
    }
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.studentId) {
        return res.redirect('/student');
    }

    try {
        const [
            balance,
            orders,
            rewards
        ] = await Promise.all([
            meritModel.getBalance(
                req.session.studentId
            ),
            orderModel.getOrdersByUser(
                req.session.studentId,
                req.language
            ),
            rewardModel.getActiveRewards(
                req.language
            )
        ]);

        res.render(
            'student/dashboard',
            {
                studentName:
                    req.session.studentName,
                balance,
                orders,
                rewards
            }
        );

    } catch (err) {
        console.error(
            'Student dashboard error:',
            err
        );

        res.status(500).send(
            req.t('common.serverError')
        );
    }
});

router.get('/logout', (req, res) => {
    delete req.session.studentId;
    delete req.session.studentName;
    delete req.session.classId;

    res.redirect('/student');
});

module.exports = router;
