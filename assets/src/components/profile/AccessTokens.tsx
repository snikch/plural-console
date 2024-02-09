import { Button, Modal } from 'honorable'
import moment from 'moment'
import { Suspense, useMemo, useState } from 'react'
import {
  CopyIcon,
  EmptyState,
  IconFrame,
  InfoIcon,
  ListIcon,
  Table,
  Toast,
  Tooltip,
} from '@pluralsh/design-system'
import { createColumnHelper } from '@tanstack/react-table'
import CopyToClipboard from 'react-copy-to-clipboard'
import {
  AccessTokenAudit,
  AccessTokenFragment,
  AccessTokensDocument,
  useAccessTokensQuery,
  useDeleteAccessTokenMutation,
  useTokenAuditsQuery,
} from 'generated/graphql'
import { ResponsivePageFullWidth } from 'components/utils/layout/ResponsivePageFullWidth'
import isEmpty from 'lodash/isEmpty'
import { useTheme } from 'styled-components'
import { FullHeightTableWrap } from 'components/utils/layout/FullHeightTableWrap'

import {
  Edge,
  mapExistingNodes,
  removeConnection,
  updateCache,
} from '../../utils/graphql'
import { formatLocation } from '../../utils/geo'
import { Confirm } from '../utils/Confirm'
import { DeleteIconButton } from '../utils/IconButtons'
import LoadingIndicator from '../utils/LoadingIndicator'
import { DateTimeCol } from '../utils/table/DateTimeCol'

import { ModalMountTransition } from '../utils/ModalMountTransition'

import { ObscuredToken } from './ObscuredToken'
import { AccessTokensCreateModal } from './AccessTokensCreateModal'
import { AccessTokensScopes } from './AccessTokensScopes'

const TOOLTIP =
  'Access tokens allow you to access the Plural API for automation and active Plural clusters.'

const auditColumnHelper = createColumnHelper<Edge<AccessTokenAudit>>()
const auditColumns = [
  auditColumnHelper.accessor(({ node }) => node?.ip, {
    id: 'ip',
    header: 'IP',
    cell: ({ getValue }) => getValue(),
    meta: { truncate: true },
    enableSorting: true,
  }),
  auditColumnHelper.accessor(
    ({ node }) => formatLocation(node?.country, node?.city),
    {
      id: 'location',
      header: 'Location',
      cell: ({ getValue }) => getValue(),
      meta: { truncate: true },
      enableSorting: true,
    }
  ),
  auditColumnHelper.accessor(({ node }) => new Date(node?.timestamp || 0), {
    id: 'timestamp',
    header: 'Timestamp',
    cell: ({
      getValue,
      row: {
        original: { node },
      },
    }) => node?.timestamp && moment(getValue()).format('lll'),
    meta: { truncate: true },
    enableSorting: true,
    sortingFn: 'datetime',
  }),
  auditColumnHelper.accessor(({ node }) => node?.count, {
    id: 'count',
    header: 'Count',
    cell: ({ getValue }) => getValue(),
    meta: { truncate: true },
    enableSorting: true,
    sortingFn: 'basic',
  }),
]

function TokenAudits({ tokenId }: { tokenId: string }) {
  const theme = useTheme()
  const { data } = useTokenAuditsQuery({
    variables: { id: tokenId },
    fetchPolicy: 'cache-and-network',
  })

  if (!data) {
    return <p css={{ ...theme.partials.text.body2 }}>...</p>
  }

  const { pageInfo, edges } = data.accessToken?.audits || {}

  if (isEmpty(edges) || !pageInfo || !edges) {
    return (
      <p css={{ ...theme.partials.text.body2 }}>Token has yet to be used</p>
    )
  }

  return (
    <FullHeightTableWrap>
      <Table
        css={{
          maxHeight: 'unset',
          height: '100%',
        }}
        data={edges}
        columns={auditColumns}
      />
    </FullHeightTableWrap>
  )
}

function DeleteAccessToken({ token }: { token: AccessTokenFragment }) {
  const theme = useTheme()
  const [confirm, setConfirm] = useState(false)
  const [mutation, { loading, error }] = useDeleteAccessTokenMutation({
    variables: { token: token.token ?? '' },
    update: (cache, { data }) =>
      updateCache(cache, {
        query: AccessTokensDocument,
        update: (prev) =>
          removeConnection(prev, data?.deleteAccessToken, 'accessTokens'),
      }),
    onCompleted: () => setConfirm(false),
  })

  return (
    <>
      <DeleteIconButton
        onClick={() => setConfirm(true)}
        tooltip
      />
      <Confirm
        open={confirm}
        title="Delete Access Token"
        text={
          <div
            css={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.medium,
            }}
          >
            <p>Are you sure you want to delete this api access token?"</p>
            <p>
              <ObscuredToken token={token.token} />
            </p>
          </div>
        }
        close={() => setConfirm(false)}
        submit={() => mutation()}
        loading={loading}
        destructive
        error={error}
      />
    </>
  )
}

function AuditsButton({ token }: { token: AccessTokenFragment }) {
  const [audits, setAudits] = useState(false)

  if (!token.id) {
    return null
  }

  return (
    <>
      <IconFrame
        textValue="Audits"
        tooltip
        clickable
        size="medium"
        icon={<ListIcon />}
        onClick={() => setAudits(true)}
      />
      <Modal
        header="Audit logs"
        open={audits}
        portal
        onClose={() => setAudits(false)}
      >
        <TokenAudits tokenId={token.id} />
      </Modal>
    </>
  )
}

function CopyButton({ token }: { token: AccessTokenFragment }) {
  const [displayCopyBanner, setDisplayCopyBanner] = useState(false)

  return (
    <>
      {displayCopyBanner && (
        <Toast
          severity="success"
          marginBottom="medium"
          marginRight="xxxxlarge"
        >
          Access token copied successfully.
        </Toast>
      )}
      <CopyToClipboard
        text={token.token}
        onCopy={() => {
          setDisplayCopyBanner(true)
          setTimeout(() => setDisplayCopyBanner(false), 1000)
        }}
      >
        <Button
          small
          secondary
          startIcon={<CopyIcon size={15} />}
        >
          Copy token
        </Button>
      </CopyToClipboard>
    </>
  )
}

const tokenColumnHelper = createColumnHelper<AccessTokenFragment>()
const tokenColumns = [
  tokenColumnHelper.accessor((row) => row.token, {
    id: 'token',
    header: 'Token',
    cell: ({ getValue }) => (
      <ObscuredToken
        showFirst={13}
        token={getValue()}
        // reveal
      />
    ),
    meta: { truncate: true },
  }),
  tokenColumnHelper.accessor((row) => row.insertedAt, {
    id: 'createdOn',
    header: 'Created on',
    cell: ({ getValue }) => <DateTimeCol date={getValue()} />,
  }),
  tokenColumnHelper.accessor((row) => row.id, {
    id: 'actions',
    header: '',
    cell: ({ row: { original } }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const theme = useTheme()

      return (
        <div
          css={{
            display: 'flex',
            gap: theme.spacing.xsmall,
          }}
        >
          <CopyButton token={original} />
          <AccessTokensScopes token={original} />
          <AuditsButton token={original} />
          <DeleteAccessToken token={original} />
        </div>
      )
    },
  }),
]

export function AccessTokens() {
  const [open, setOpen] = useState(false)
  const [displayNewBanner, setDisplayNewBanner] = useState(false)
  const { data, loading } = useAccessTokensQuery()

  const tokensList = useMemo(
    () => mapExistingNodes(data?.accessTokens),
    [data?.accessTokens]
  )

  if (loading) return <LoadingIndicator />

  return (
    <ResponsivePageFullWidth
      scrollable={false}
      heading="Access tokens"
      headingContent={
        <div
          css={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexGrow: 1,
          }}
        >
          <Tooltip
            width={315}
            label={TOOLTIP}
          >
            <InfoIcon />
          </Tooltip>
          {!isEmpty(tokensList) && (
            <Button
              secondary
              onClick={() => setOpen(true)}
            >
              Create access token
            </Button>
          )}
        </div>
      }
    >
      {!isEmpty(tokensList) ? (
        <FullHeightTableWrap>
          <Table
            data={tokensList}
            columns={tokenColumns}
            css={{
              maxHeight: 'unset',
              height: '100%',
            }}
          />
        </FullHeightTableWrap>
      ) : (
        <EmptyState message="Looks like you don't have any access tokens yet.">
          <Button
            secondary
            onClick={() => setOpen(true)}
          >
            Create access token
          </Button>
        </EmptyState>
      )}
      <Suspense fallback={null}>
        <ModalMountTransition open={open}>
          <AccessTokensCreateModal
            open={open}
            setOpen={setOpen}
            setDisplayNewBanner={setDisplayNewBanner}
          />
        </ModalMountTransition>
      </Suspense>
      {displayNewBanner && (
        <Toast
          severity="success"
          marginBottom="medium"
          marginRight="xxxxlarge"
          onClose={() => setDisplayNewBanner(false)}
        >
          New access token created.
        </Toast>
      )}
    </ResponsivePageFullWidth>
  )
}
