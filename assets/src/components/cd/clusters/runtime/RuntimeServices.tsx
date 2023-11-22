import { Table } from '@pluralsh/design-system'
import { ClustersRowFragment, useRuntimeServicesQuery } from 'generated/graphql'
import { useState } from 'react'

import { useTheme } from 'styled-components'

import { runtimeColumns } from './columns'

const POLL_INTERVAL = 10 * 1000

export default function RuntimeServices({
  cluster,
}: {
  cluster?: ClustersRowFragment | undefined | null
}) {
  const theme = useTheme()
  const [kubeVersion] = useState(
    cluster?.currentVersion || cluster?.version || '1.20.0'
  )

  const { data } = useRuntimeServicesQuery({
    variables: {
      kubeVersion,
      id: cluster?.id ?? '',
    },
    pollInterval: POLL_INTERVAL,
  })

  if ((data?.cluster?.runtimeServices || []).length <= 0) return null

  return (
    <>
      <div
        css={{
          ...theme.partials.text.body1,
          color: theme.colors['text-light'],
        }}
      >
        We detected these kubernetes add-ons in your cluster, you should
        validate they are compatible before upgrading
      </div>
      <Table
        data={data?.cluster?.runtimeServices || []}
        columns={runtimeColumns}
        css={{
          maxHeight: 310,
          height: '100%',
        }}
      />
    </>
  )
}