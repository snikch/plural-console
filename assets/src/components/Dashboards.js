import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useQuery } from 'react-apollo'
import { Box, Text } from 'grommet'
import { Select } from 'forge-core'
import { BreadcrumbsContext } from './Breadcrumbs'
import { BUILD_PADDING } from './Builds'
import { DASHBOARDS_Q } from './graphql/dashboards'
import Dashboard from './Dashboard'
import { ApplicationIcon, hasIcon, InstallationContext, useEnsureCurrent } from './Installations'
import { LoopingLogo } from './utils/AnimatedLogo'


export function DashboardHeader({name, label}) {
  return (
    <Box gap='xxsmall'>
      <Text weight='bold' size='small'>{name} {label}</Text>
    </Box>
  )
}

function IndividualHeader({current}) {
  return (
    <Box>
      <Text weight='bold' size='small'>{current.spec.name}</Text>
      <Text size='small' color='dark-3'>{current.spec.description}</Text>
    </Box>
  )
}

export default function Dashboards() {
  const {repo} = useParams()
  const {setBreadcrumbs} = useContext(BreadcrumbsContext)
  const {setOnChange, currentApplication} = useContext(InstallationContext)
  let history = useHistory()
  useEffect(() => {
    setBreadcrumbs([
      {text: 'dashboards', url: '/dashboards'},
      {text: currentApplication.name, url: `/dashboards/${currentApplication.name}`}
    ])
  }, [currentApplication])
  useEffect(() => {
    setOnChange({func: ({name}) => {
      history.push(`/dashboards/${name}`)
    }})
  }, [])
  useEnsureCurrent(repo)

  const [current, setCurrent] = useState(null)
  const {data} = useQuery(DASHBOARDS_Q, {
    variables: {repo: currentApplication.name},
    fetchPolicy: 'cache-and-network'
  })
  useEffect(() => {
    if (data && data.dashboards.length > 0) {
      setCurrent(data.dashboards[0])
    }
  }, [data, currentApplication])

  if (!data) return <LoopingLogo scale='0.75' />

  return (
    <Box fill>
      <Box gap='small' flex={false}>
        <Box
          pad={{vertical: 'small', ...BUILD_PADDING}}
          direction='row' align='center' height='60px'>
          <Box direction='row' fill='horizontal' gap='small' align='center'>
            {hasIcon(currentApplication) && <ApplicationIcon application={currentApplication} size='40px' />}
            {current ? <IndividualHeader current={current} /> :
              <DashboardHeader name={currentApplication.name} label='dashboards' />}
          </Box>
          {current && (
            <Box flex={false} width='200px'>
              <Select
                options={data.dashboards.map((d) => ({value: d, label: d.spec.name}))}
                value={{value: current, label: current.spec.name}}
                onChange={({value}) => setCurrent(value)} />
            </Box>
          )}
        </Box>
      </Box>
      <Box fill>
        {data.dashboards.length > 0 ? (
          current ? <Dashboard repo={currentApplication.name} name={current.id} /> : <LoopingLogo />
        ) : <Text size='small'>No dashboards for this repository, contact the developer to fix this</Text>
        }
      </Box>
    </Box>
  )
}