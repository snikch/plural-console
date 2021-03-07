import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { setContext } from 'apollo-link-context'
import { onError } from 'apollo-link-error'
import * as AbsintheSocket from "@absinthe/socket"
import { Socket as PhoenixSocket } from "phoenix"
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link"
import { createPersistedQueryLink } from "apollo-link-persisted-queries"
import { hasSubscription } from "@jumpn/utils-graphql"
import { split } from 'apollo-link'
import { apiHost, secure } from './hostname'
import { HttpLink } from 'apollo-boost'
import { fetchToken, wipeToken } from './auth'

const API_HOST = apiHost()
const GQL_URL = `${secure() ? 'https' : 'http'}://${API_HOST}/gql`
const WS_URI  = `${secure() ? 'wss' : 'ws'}://${API_HOST}/socket`

export function buildClient(gqlUrl, wsUrl, onNetworkError, fetchToken) {
  const httpLink = new HttpLink({uri: gqlUrl})

  const authLink = setContext((_, { headers }) => {
    const token = fetchToken()
    let authHeaders = token ? {authorization: `Bearer ${token}`} : {}
    return {headers: {...headers, ...authHeaders}}
  })

  const resetToken = onError(({ networkError }) => {
    if (networkError && networkError.statusCode === 401) onNetworkError()
  });

  const socket = new PhoenixSocket(wsUrl, {
    params: () => {
      const token = fetchToken()
      return token ? { Authorization: `Bearer ${token}`} : {}
    }
  })

  const absintheSocket = AbsintheSocket.create(socket)

  const socketLink = createAbsintheSocketLink(absintheSocket)
  const gqlLink = createPersistedQueryLink().concat(resetToken).concat(httpLink)

  const splitLink = split(
    (operation) => hasSubscription(operation.query),
    socketLink,
    authLink.concat(gqlLink)
  )

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache()
  })
}

function onNetworkError() {
  wipeToken()
  window.location = '/login'
}

export const client = buildClient(GQL_URL, WS_URI, onNetworkError, fetchToken)