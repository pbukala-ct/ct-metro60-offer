import {
  createClient
} from '@commercetools/sdk-client-v2'

import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth'
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http'

import fetch from 'node-fetch';


  const projectKey = process.env.CTP_PROJECT_KEY

  const authMiddleware = createAuthMiddlewareForClientCredentialsFlow({
    host: process.env.CTP_AUTH_URL,
    projectKey,
    credentials: {
      clientId: process.env.CTP_CLIENT_ID,
      clientSecret: process.env.CTP_CLIENT_SECRET,
    },
    scopes: [`manage_project:${projectKey}`],
    fetch,
  })
  const httpMiddleware = createHttpMiddleware({
    host: process.env.CTP_API_URL,
    fetch,
  })
  export const client = createClient({
    middlewares: [authMiddleware, httpMiddleware],
  })