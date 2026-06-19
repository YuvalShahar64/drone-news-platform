const { Router } = require('express');
const { getAuthor } = require('../controllers/authorController');

const router = Router();
router.get('/:name', getAuthor);

module.exports = router;
