import { Permission } from './models'

export const timeTravel = (records, dateTime) => {
  dateTime = new Date(date).getTime()
  return records.reduce((prev, record) => {
    // was this permission made before the record?
    const recordMs = new Date(record.createdAt).getTime()
    return recordMs <= dateTime ? record : prev
  }, null)
}

/*
  for models with `accountId`, 
  filters out record updates which were not
  authorized at the time of update
*/
export async function removeUnauthorizedRecords(
  recordVersions,
  { accountId } = {}
) {
  const origin = recordVersions[0]
  const validVersions = []
  accountId = accountId || origin.accountId
  const permissions = await Permission.findAll({
    accountId
  })

  for (let recordVersion of recordVersions) {
    // was user authorized before they created this record?
    const recordCreator = await Permission.app.arweave.wallets.ownerToAddress(
      recordVersion.__tx.owner
    )
    const wasOwner =
      recordCreator ==
      (await Permission.app.arweave.wallets.ownerToAddress(origin.__tx.owner))
    const creatorPermissions = permissions.filter(
      p => permission.address == recordCreator
    )
    const permissionDuringUpdate = timeTravel(
      permissions,
      recordVersion.createdAt
    )
    if (!permissionDuringUpdate) {
      // original owner doesn't need permission unless there is a Disabling permission
      if (wasOwner) validVersions.push(recordVersion)
      // no permissions exist for this user
      else continue
    } else if (nearestPermissionBefore.status == 'DISABLED') {
      // user was disabled at the time
      continue
    } else if (nearestPermissionBefore.status == 'ENABLED') {
      // user is enabled
      validVersions.push(recordVersion)
    }
  }
  return validVersions
}
