const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const userModel = require('../models/userModel');
const meritModel = require('../models/meritModel');
const orderModel = require('../models/orderModel');
const pdfGenerator = require('../utils/pdfGenerator');
const { getAcademicContext } = require('../config/academicPeriods');

router.get('/login', (req, res) => {
    res.render(
        'curator/login',
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
            user.role !== 'curator' ||
            !user.password_hash
        ) {
            return res.status(400).render(
                'curator/login',
                {
                    error:
                        req.t(
                            'curator.invalidLogin'
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
                'curator/login',
                {
                    error:
                        req.t(
                            'curator.invalidLogin'
                        )
                }
            );
        }

        req.session.curatorId =
            user.id;

        req.session.curatorName =
            user.full_name;

        res.redirect(
            '/curator/dashboard'
        );

    } catch (err) {
        console.error(
            'Curator login error:',
            err
        );

        res.status(500).render(
            'curator/login',
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
    if (!req.session.curatorId) {
        return res.redirect(
            '/curator/login'
        );
    }

    try {
        const classes =
            await userModel.getCuratorClasses(
                req.session.curatorId
            );

        if (!classes.length) {
            return res.render(
                'curator/dashboard',
                {
                    curatorName:
                        req.session.curatorName,
                    classes: [],
                    selectedClassId: null,
                    students: [],
                    pendingOrders: [],
                    academicContext:
                        getAcademicContext(),
                    success: null
                }
            );
        }

        const requestedClassId =
            Number(req.query.classId);

        const allowedRequestedClass =
            classes.some(
                item =>
                    item.id ===
                    requestedClassId
            );

        const selectedClassId =
            allowedRequestedClass
                ? requestedClassId
                : classes[0].id;

        req.session.curatorSelectedClassId =
            selectedClassId;

        const academicContext =
            getAcademicContext();

        const [
            students,
            earningStats
        ] = await Promise.all([
            userModel.getStudentsByClass(
                selectedClassId
            ),

            meritModel.getEarningStatsByClass(
                selectedClassId,
                academicContext
            )
        ]);

        const studentsWithBalance =
            await Promise.all(
                students.map(
                    async student => {
                        const stats =
                            earningStats.get(
                                Number(student.id)
                            ) || {
                                earnedQ1: 0,
                                earnedQ2: 0,
                                earnedQ3: 0,
                                earnedQ4: 0,
                                earnedAcademicYear: 0,
                                earnedAllTime: 0
                            };

                        return {
                            ...student,

                            balance:
                                await meritModel.getBalance(
                                    student.id
                                ),

                            ...stats
                        };
                    }
                )
            );

        const pendingOrders =
            await orderModel.getOpenOrdersByClass(
                selectedClassId
            );

        res.render(
            'curator/dashboard',
            {
                curatorName:
                    req.session.curatorName,
                classes,
                selectedClassId,
                students:
                    studentsWithBalance,
                pendingOrders,
                academicContext,
                success:
                    req.query.success === '1'
                        ? req.t(
                            'curator.success'
                        )
                        : null
            }
        );

    } catch (err) {
        console.error(
            'Curator dashboard error:',
            err
        );

        res.status(500).send(
            req.t('common.serverError')
        );
    }
});

router.post('/add-merits', async (req, res) => {
    if (!req.session.curatorId) {
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
            req.t('curator.invalidData')
        );
    }

    try {
        const allowed =
            await userModel.curatorHasClass(
                req.session.curatorId,
                classId
            );

        if (!allowed) {
            return res.status(403).send(
                req.t(
                    'curator.forbiddenClass'
                )
            );
        }

        const students =
            await userModel.getStudentsByClass(
                classId
            );

        const studentExists =
            students.some(
                student =>
                    student.id === userId
            );

        if (!studentExists) {
            return res.status(400).send(
                req.t(
                    'curator.wrongStudentClass'
                )
            );
        }

        await meritModel.addMerits(
            userId,
            amount,
            reason,
            req.session.curatorId
        );

        res.redirect(
            `/curator/dashboard?classId=${classId}&success=1`
        );

    } catch (err) {
        console.error(
            'Curator add merits error:',
            err
        );

        res.status(500).send(
            req.t('common.serverError')
        );
    }
});

router.get('/print-orders', async (req, res) => {
    if (!req.session.curatorId) {
        return res.redirect(
            '/curator/login'
        );
    }

    const classId =
        Number(
            req.query.classId ||
            req.session.curatorSelectedClassId
        );

    if (!Number.isInteger(classId)) {
        return res.redirect(
            '/curator/dashboard'
        );
    }

    try {
        const allowed =
            await userModel.curatorHasClass(
                req.session.curatorId,
                classId
            );

        if (!allowed) {
            return res.status(403).send(
                req.t(
                    'curator.forbiddenClass'
                )
            );
        }

        const orders =
            await orderModel.getPendingOrdersByClass(
                classId
            );

        if (!orders.length) {
            return res.send(
                req.t(
                    'curator.noPrintOrders'
                )
            );
        }

        const pdfBuffer =
            await pdfGenerator.generateTickets(
                orders
            );

        for (const order of orders) {
            await orderModel.updateOrderStatus(
                order.id,
                'printed'
            );
        }

        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=merit-tickets.pdf'
        );

        res.send(pdfBuffer);

    } catch (err) {
        console.error(
            'Print error:',
            err
        );

        res.status(500).send(
            req.t('curator.printError')
        );
    }
});

router.post('/issue-order', async (req, res) => {
    if (!req.session.curatorId) {
        return res.status(401).send(
            req.t('purchase.notAuthorized')
        );
    }

    const classId =
        Number(req.body.classId);

    const orderId =
        Number(req.body.orderId);

    try {
        const allowed =
            await userModel.curatorHasClass(
                req.session.curatorId,
                classId
            );

        if (!allowed) {
            return res.status(403).send(
                req.t(
                    'curator.forbiddenClass'
                )
            );
        }

        const order =
            await orderModel.getOrderForClass(
                orderId,
                classId
            );

        if (!order || order.status !== 'printed') {
            return res.status(400).send(
                req.t('curator.issueError')
            );
        }

        await orderModel.updateOrderStatus(
            orderId,
            'issued'
        );

        res.redirect(
            `/curator/dashboard?classId=${classId}`
        );

    } catch (err) {
        console.error(
            'Issue order error:',
            err
        );

        res.status(500).send(
            req.t('curator.issueError')
        );
    }
});

router.post('/reissue-order', async (req, res) => {
    if (!req.session.curatorId) {
        return res.status(401).send(
            req.t('purchase.notAuthorized')
        );
    }

    const classId =
        Number(req.body.classId);

    const orderId =
        Number(req.body.orderId);

    try {
        const allowed =
            await userModel.curatorHasClass(
                req.session.curatorId,
                classId
            );

        if (!allowed) {
            return res.status(403).send(
                req.t(
                    'curator.forbiddenClass'
                )
            );
        }

        const oldOrder =
            await orderModel.getOrderForClass(
                orderId,
                classId
            );

        if (!oldOrder) {
            return res.status(404).send(
                req.t('curator.reissueError')
            );
        }

        await orderModel.voidOrder(
            oldOrder.id
        );

        const newOrder =
            await orderModel.createOrder(
                oldOrder.user_id,
                oldOrder.reward_id,
                {
                    key:
                        oldOrder.reward_key,
                    titleRu:
                        oldOrder.reward_title_ru ||
                        oldOrder.reward_title,
                    titleEn:
                        oldOrder.reward_title_en ||
                        oldOrder.reward_title,
                    cost:
                        oldOrder.reward_cost
                },
                oldOrder.locale || 'ru'
            );

        res.redirect(
            `/curator/dashboard?classId=${classId}`
        );

    } catch (err) {
        console.error(
            'Reissue order error:',
            err
        );

        res.status(500).send(
            req.t('curator.reissueError')
        );
    }
});

router.get('/logout', (req, res) => {
    delete req.session.curatorId;
    delete req.session.curatorName;
    delete req.session.curatorSelectedClassId;

    res.redirect('/curator/login');
});

module.exports = router;
