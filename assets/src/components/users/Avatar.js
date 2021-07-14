import React from 'react'
import { Box, Text } from 'grommet'

export function initials(name) {
  return name
          .split(' ')
          .map((n) => n.charAt(0).toUpperCase())
          .join('')
}

export default function Avatar({size, user: {backgroundColor, avatar, profile, name}, onClick, round}) {
  const icon = profile || avatar
  return (
    <Box
      flex={false}
      round={round || 'xsmall'}
      style={icon ? {backgroundImage: `url(${icon})`, backgroundPosition: 'center', backgroundSize: 'cover'} : null}
      align='center'
      justify='center'
      width={size}
      height={size}
      onClick={onClick}
      background={!icon ? backgroundColor : null}>
      {!icon && <Text size='small'>{initials(name)}</Text>}
    </Box>
  )
}