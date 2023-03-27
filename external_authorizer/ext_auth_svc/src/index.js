const express = require('express')
const basicAuth = require('basic-auth')
const app = express()
const port = 8080

app.use('/healthz', (_, res) => {
  res.status = 200;
  res.end();
  return;
});


app.all('*', (req, res, next) => {
  console.log(req.path)
  console.log(req.headers)
  const auth = basicAuth(req);

  if (!auth) {
    res.status(401)
    res.end('Unauthorized')
    return;
  }

  const { name, pass } = auth;

  if (name === 'boo' && pass === '123456') {
    res.status(200)
    res.end()
  } else {
    res.status(401)
    res.end('Unauthorized')
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
