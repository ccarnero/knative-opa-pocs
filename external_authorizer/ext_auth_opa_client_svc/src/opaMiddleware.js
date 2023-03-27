const axios = require('axios')

function createOpaMiddleware(opaAgentUri) {
  const client = axios.create({
    baseURL: opaAgentUri,
  })

  return () =>
    // this will be run per request
    async (request, response, next) => {
      try {
        const role = request.headers.authorization

        if (!role) {
          throw new Error("No authorization header")
        }

        // query OPA api server
        const response = await client.post(
          '/v1/data/authorization/allow',
          {
            input: {
              subject: { roles: [role] }
            }
          },
        )

        // OPA api server query's result
        const allow = response.data?.result
        if (!allow) {
          throw new Error("Unauthorized")
        }

        // authorized
        await next()
      } catch (err) {
        // unauthorized
        response.status(403).send(err.message)
      }
    }
  }

module.exports = createOpaMiddleware