const express = require('express');
const router = express.Router();

const purchaseModel = require('../models/purchaseModel');

router.post('/buy', async (req, res) => {
    if (!req.session.studentId) {
        return res.status(401).json({
            success: false,
            message: req.t('purchase.notAuthorized')
        });
    }

    const rewardKey =
        String(req.body.rewardKey || '').trim();

    if (!rewardKey) {
        return res.status(400).json({
            success: false,
            message: req.t('purchase.noReward')
        });
    }

    try {
        const result =
            await purchaseModel.purchaseReward(
                req.session.studentId,
                rewardKey,
                req.language
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
            let message =
                req.t('purchase.generic');

            if (err.code === 'REWARD_NOT_FOUND') {
                message =
                    req.t('purchase.rewardMissing');
            }

            if (err.code === 'INSUFFICIENT_MERITS') {
                message =
                    req.t(
                        'purchase.insufficient',
                        {
                            amount:
                                err.meta.missing ?? 0
                        }
                    );
            }

            return res
                .status(err.status)
                .json({
                    success: false,
                    code: err.code,
                    message
                });
        }

        console.error(
            'Atomic buy error:',
            err
        );

        return res.status(500).json({
            success: false,
            message: req.t('purchase.generic')
        });
    }
});

module.exports = router;
