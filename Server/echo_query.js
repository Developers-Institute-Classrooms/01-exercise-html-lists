const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  console.log('Echo Query:', req.query);

  res.send(JSON.stringify(req.query));
});

module.exports = router;
