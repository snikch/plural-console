import { useQuery } from '@apollo/client'
import { useParams } from 'react-router-dom'
import { stringify } from 'yaml'
import { LoopingLogo } from '@pluralsh/design-system'

import { Pod } from 'generated/graphql'

import { ScrollablePage } from 'components/utils/layout/ScrollablePage'

import { POLL_INTERVAL } from '../constants'
import { POD_RAW_Q } from '../queries'

import { RawPageCode } from '../RawPageCode'

export default function NodeEvents() {
  const { name, namespace } = useParams()
  const { data } = useQuery<{
    pod: Pod
  }>(POD_RAW_Q, {
    variables: { name, namespace },
    pollInterval: POLL_INTERVAL,
    fetchPolicy: 'cache-and-network',
  })

  if (!data) return <LoopingLogo />

  const {
    pod: { raw },
  } = data

  const content = stringify(JSON.parse(raw))

  return (
    <ScrollablePage
      scrollable={false}
      heading="Raw"
    >
      <RawPageCode>{content}</RawPageCode>
    </ScrollablePage>
  )
}