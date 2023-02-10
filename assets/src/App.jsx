import { RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { Grommet } from 'grommet'

import { IntercomProvider } from 'react-use-intercom'

import { ApolloProvider } from '@apollo/client'

import { mergeDeep } from '@apollo/client/utilities'

import { GlobalStyle, styledTheme, theme } from '@pluralsh/design-system'
import { CssBaseline, ThemeProvider } from 'honorable'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'

import { DEFAULT_THEME } from './theme'
import 'react-toggle/style.css'
import 'react-pulse-dot/dist/index.css'
import { client } from './helpers/client'
import { rootRoutes } from './routes/rootRoutes'

const INTERCOM_APP_ID = 'p127zb9y'

const router = createBrowserRouter(createRoutesFromElements(rootRoutes))

export default function App() {
  const mergedStyledTheme = mergeDeep(DEFAULT_THEME, styledTheme)

  return (
    <ApolloProvider client={client}>
      <IntercomProvider appId={INTERCOM_APP_ID}>
        <ThemeProvider theme={theme}>
          <StyledThemeProvider theme={mergedStyledTheme}>
            <CssBaseline />
            <GlobalStyle />
            <Grommet
              full
              theme={mergedStyledTheme}
              themeMode="dark"
            >
              <RouterProvider router={router} />
            </Grommet>
          </StyledThemeProvider>
        </ThemeProvider>
      </IntercomProvider>
    </ApolloProvider>
  )
}