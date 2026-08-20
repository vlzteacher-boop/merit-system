const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const userModel = require('../models/userModel');
const meritModel = require('../models/meritModel');
const orderModel = require('../models/orderModel');
const pdfGenerator = require('../utils/pdfGenerator');

router.get('/login', (req, res) => {
    res.render('curator/login', { error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.getUserByEmail(email);

        if (!user || user.role !== 'curator') {
            return res.status(400).render('curator/login', {
                error: 'Неверный email или роль'
            });
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).render('curator/login', {
                error: 'Неверный пароль'
            });
        }

        req.session.curatorId = user.id;
        req.session.curatorName = user.full_name;
        req.session.curatorClassId = user.class_id;

        res.redirect('/curator/dashboard');

    } catch (err) {
        console.error('Curator login error:', err);
        res.status(500).render('curator/login', {
            error: 'Ошибка сервера'
        });
    }
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.curatorId) {
        return res.redirect('/curator/login');
    }

    const classId = req.session.curatorClassId;

    if (!classId) {
        return res.status(400).send('У куратора не указан class_id');
    }

    try {
        const students = await userModel.getStudentsByClass(classId);

        const studentsWithBalance = await Promise.all(
            students.map(async s => ({
                ...s,
                balance: await meritModel.getBalance(s.id)
            }))
        );

        const pendingOrders = await orderModel.getPendingOrdersByClass(classId);

        res.render('curator/dashboard', {
            students: studentsWithBalance,
            pendingOrders,
            curatorName: req.session.curatorName
        });

    } catch (err) {
        console.error('Curator dashboard error:', err);
        res.status(500).send('Ошибка');
    }
});

router.post('/add-merits', async (req, res) => {
    if (!req.session.curatorId) {
        return res.status(401).send('Не авторизован');
    }

    const userId = Number(req.body.userId);
    const amount = Number(req.body.amount);
    const reason = String(req.body.reason || '').trim();

    if (!Number.isInteger(userId) || !Number.isInteger(amount) || amount <= 0 || !reason) {
        return res.status(400).send('Некорректные данные');
    }

    try {
        await meritModel.addMerits(
            userId,
            amount,
            reason,
            req.session.curatorId
        );

        res.redirect('/curator/dashboard');

    } catch (err) {
        console.error('Curator add merits error:', err);
        res.status(500).send('Ошибка начисления');
    }
});

router.get('/print-orders', async (req, res) => {
    if (!req.session.curatorId) {
        return res.redirect('/curator/login');
    }

    const classId = req.session.curatorClassId;

    try {
        const orders = await orderModel.getPendingOrdersByClass(classId);

        if (!orders.length) {
            return res.send('Нет заказов для печати');
        }

        const pdfBuffer = await pdfGenerator.generateTickets(orders);

        for (const order of orders) {
            await orderModel.updateOrderStatus(order.id, 'printed');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=tickets.pdf');
        res.send(pdfBuffer);

    } catch (err) {
        console.error('Print error:', err);
        res.status(500).send('Ошибка генерации PDF');
    }
});

router.post('/issue-order', async (req, res) => {
    if (!req.session.curatorId) {
        return res.status(401).send('Не авторизован');
    }

    try {
        await orderModel.updateOrderStatus(req.body.orderId, 'issued');
        res.redirect('/curator/dashboard');
    } catch (err) {
        console.error('Issue order error:', err);
        res.status(500).send('Ошибка');
    }
});

router.post('/reissue-order', async (req, res) => {
    if (!req.session.curatorId) {
        return res.status(401).send('Не авторизован');
    }

    try {
        const oldOrder = await orderModel.getOrderById(req.body.orderId);

        if (!oldOrder) {
            return res.status(404).send('Заказ не найден');
        }

        await orderModel.voidOrder(oldOrder.id);

        const newOrder = await orderModel.createOrder(
            oldOrder.user_id,
            oldOrder.reward_id,
            {
                key: oldOrder.reward_key,
                title: oldOrder.reward_title,
                cost: oldOrder.reward_cost
            }
        );

        await orderModel.updateOrderStatus(newOrder.id, 'printed');

        res.redirect('/curator/dashboard');

    } catch (err) {
        console.error('Reissue order error:', err);
        res.status(500).send('Ошибка перевыпуска');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/curator/login');
    });
});

module.exports = router;
