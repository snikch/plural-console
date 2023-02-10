import { useEffect, useRef } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { TabPanel } from '@pluralsh/design-system'
import { useTheme } from 'styled-components'

import { ResponsiveLayoutSidecarContainer } from 'components/utils/layout/ResponsiveLayoutSidecarContainer'
import { ResponsiveLayoutSidenavContainer } from 'components/utils/layout/ResponsiveLayoutSidenavContainer'
import { ResponsiveLayoutSpacer } from 'components/utils/layout/ResponsiveLayoutSpacer'
import { ResponsiveLayoutContentContainer } from 'components/utils/layout/ResponsiveLayoutContentContainer'

import { useBreadcrumbs } from 'components/layout/Breadcrumbs'

import { ResponsiveLayoutPage } from 'components/utils/layout/ResponsiveLayoutPage'

import Sidecar from './PodSidecar'
import SideNav from './PodSideNav'

export default function Node() {
  const tabStateRef = useRef<any>()
  const theme = useTheme()
  const { name, namespace } = useParams()
  const { setBreadcrumbs } = useBreadcrumbs()

  // TODO: Investigate whether these links could more specific,
  // based on where they navigated from, perhaps the `namespace` crumb
  // could navigate to the Pods view already filtered for that namespace
  useEffect(() => {
    if (name && namespace) {
      setBreadcrumbs([
        { text: 'pods', url: '/pods' }, // Add filter param here later maybe?
        { text: name, url: name },
      ])
    }
  }, [name, namespace, setBreadcrumbs])

  return (
    <ResponsiveLayoutPage>
      <ResponsiveLayoutSidenavContainer paddingTop={theme.spacing.xxxlarge}>
        <SideNav tabStateRef={tabStateRef} />
      </ResponsiveLayoutSidenavContainer>
      <ResponsiveLayoutSpacer />
      <TabPanel
        as={<ResponsiveLayoutContentContainer overflow="visible" />}
        stateRef={tabStateRef}
      >
        <Outlet />
      </TabPanel>
      <ResponsiveLayoutSpacer />
      <ResponsiveLayoutSidecarContainer>
        <Sidecar />
      </ResponsiveLayoutSidecarContainer>
    </ResponsiveLayoutPage>
  )
}