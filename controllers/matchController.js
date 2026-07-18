const matchService = require("../services/matchService");

exports.getMatch = async (req, res) => {

    try {

        const result = await matchService.matchPO(req.params.poNumber);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};