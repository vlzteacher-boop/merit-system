const express = require('express');
const router = express.Router();

const purchaseModel = require('../models/purchaseModel');

router.post('/buy', async (req, res) => {
    if (!req.session.studentId) {
        return res.status(401).json({
            success: false,
            message: 'Не авторизован'
        });
    }

    const rewardKey = String(req.body.rewardKey || '').trim();

    if (!rewardKey) {
        return res.status(400).json({
            success: false,
            message: 'Не указана награда'
        });
    }

    try {
        const result = await purchaseModel.purchaseReward(
            req.session.studentId,
            rewardKey
        );

        return res.json({
            success: true,
            newBalance: result.newBalance,
            orderCode: result.order.code,
            reward: {
                id: result.reward.id,
                key: result.reward.reward_key,
                title: result.reward.title,
                cost: result.reward.cost
            }
        });

    } catch (err) {
        if (err instanceof purchaseModel.PurchaseError) {
            return res.status(err.status).json({
                success: false,
                code: err.code,
                message: err.message
            });
        }

        console.error('Atomic buy error:', err);

        return res.status(500).json({
            success: false,
            message: 'Ошибка при покупке'
        });
    }
});

module.exports = router;
