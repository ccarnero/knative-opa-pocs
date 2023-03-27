const express = require('express')
const createOpaMiddleware = require('./opaMiddleware')
const app = express()
const port = 8080

// create opa authorization check middleware and provide api server uri
const hasPermission = createOpaMiddleware("http://ext-auth-svc-opa:8181")

// healthz
app.use('/healthz', (_, res) => {
  res.status = 200;
  res.end();
  return;
});


app.all('*', hasPermission(), (_, res) => {
  res.json({ message: `you shall not pass` })
})

// start server
app.listen(port, () => {
    console.log(`OPA NodeJs is listening at http://localhost:${port}`)
})

