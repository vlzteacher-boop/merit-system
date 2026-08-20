const express = require('express');
const router = express.Router();

const userModel = require('../models/userModel');
const meritModel = require('../models/meritModel');
const orderModel = require('../models/orderModel');
const rewardModel = require('../models/rewardModel');


// ============================================================
// СТРАНИЦА ВХОДА
// ============================================================

router.get('/', async (req, res) => {
    try {
        const classes =
            await userModel.getClasses();

        res.render(
            'student/login',
            {
                classes
            }
        );

    } catch (err) {
        console.error(
            'Student login page error:',
            err
        );

        res.status(500).send(
            'Не удалось загрузить список классов'
        );
    }
});


// ============================================================
// АВТОРИЗАЦИЯ
// ============================================================

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
                message: 'Ученик не найден'
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
                message: 'Неверный PIN-код'
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
            message: 'Ошибка сервера'
        });
    }
});


// ============================================================
// DASHBOARD УЧЕНИКА
// ============================================================

router.get('/dashboard', async (req, res) => {
    if (!req.session.studentId) {
        return res.redirect('/student');
    }

    const studentId =
        req.session.studentId;

    try {
        const [
            balance,
            orders,
            rewards
        ] = await Promise.all([
            meritModel.getBalance(
                studentId
            ),

            orderModel.getOrdersByUser(
                studentId
            ),

            rewardModel.getActiveRewards()
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
            'Ошибка'
        );
    }
});


// ============================================================
// ВЫХОД
// ============================================================

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/student');
    });
});


module.exports = router;
