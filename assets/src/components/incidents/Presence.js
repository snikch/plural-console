import React, { useContext, useEffect, useMemo, useState } from 'react'
import TimedCache from '../utils/TimedCache'
import { Presence } from 'phoenix'
import { Box } from 'grommet'
import { ForgeApiContext } from '../ForgeApi'

export const PresenceContext = React.createContext({})

export const PresenceIndicator = ({border, margin}) => {
  const width = border ? '12px' : '8px'

  return (
    <Box flex={false} background='presence' border={border ? {color: 'white', size: '2px'} : null} 
       width={width} height={width} round='full' margin={margin} />
  )
}

export function PresenceProvider({incidentId, children}) {
  const {socket} = useContext(ForgeApiContext)
  const [channel, setChannel] = useState(null)
  const [present, setPresent] = useState({})
  const [typists, setTypists] = useState([])
  const cache = useMemo(() => new TimedCache(2000, setTypists), [])

  useEffect(() => {
    const channel = socket.channel(`incidents:${incidentId}`)
    setChannel(channel)
    channel.join()
    channel.on("typing", (msg) => cache.add(msg.name))

    const presence = new Presence(channel)
    presence.onSync(() => {
      const ids = presence.list((id) => id).reduce((prev, id) => ({...prev, [id]: true}), {})
      setPresent({...present, ...ids})
    })
    presence.onJoin((id) => setPresent({...present, [id]: true}))
    presence.onLeave((id, current) => {
      if (current.metas.length === 0) {
        setPresent({...present, [id]: false})
      }
    })

    return () => {
      channel.leave()
      setPresent({})
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId])

  return (
    <PresenceContext.Provider value={{present, channel, typists}}>
      {children}
    </PresenceContext.Provider>
  )
}