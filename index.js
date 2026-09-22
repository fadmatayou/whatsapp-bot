const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => {
  res.send('Bot Live');
});
app.listen(PORT, () => {
  console.log('Live on ' + PORT);
});
