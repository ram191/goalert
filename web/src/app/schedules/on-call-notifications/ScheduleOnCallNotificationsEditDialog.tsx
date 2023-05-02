import React, { useState } from 'react'

import { EVERY_DAY, mapOnCallErrors, NO_DAY, Value } from './util'
import { useOnCallRulesData, useSetOnCallRulesSubmit } from './hooks'
import FormDialog from '../../dialogs/FormDialog'
import ScheduleOnCallNotificationsForm from './ScheduleOnCallNotificationsForm'
import { DateTime } from 'luxon'

interface ScheduleOnCallNotificationsEditDialogProps {
  onClose: () => void

  scheduleID: string
  ruleID: string
}

export default function ScheduleOnCallNotificationsEditDialog(
  p: ScheduleOnCallNotificationsEditDialogProps,
): JSX.Element {
  const [value, setValue] = useState<Value | null>(null)
  const [slackType, setSlackType] = useState('channel')

  const { q, zone, rules } = useOnCallRulesData(p.scheduleID)

  const rule = rules.find((r) => r.id === p.ruleID)
  const newValue: Value = value || {
    time: rule?.time
      ? DateTime.fromFormat(rule.time, 'HH:mm', { zone }).toISO()
      : null,
    weekdayFilter: rule?.time ? rule.weekdayFilter || EVERY_DAY : NO_DAY,
    slackChannelID:
      rule?.target.type === 'slackChannel'
        ? rule?.target.id
        : rule?.target.id.split(':')[1],
    slackUserGroup:
      rule?.target.type === 'slackUserGroup'
        ? rule?.target.id.split(':')[0]
        : null,
  }
  const { m, submit } = useSetOnCallRulesSubmit(
    p.scheduleID,
    zone,
    newValue,
    ...rules.filter((r) => r.id !== p.ruleID),
  )

  const [dialogErrors, fieldErrors] = mapOnCallErrors(m.error, q.error)

  return (
    <FormDialog
      title='Edit Notification Rule'
      errors={dialogErrors}
      loading={(q.loading && !zone) || m.loading}
      onClose={() => p.onClose()}
      onSubmit={() => submit().then(p.onClose)}
      form={
        <ScheduleOnCallNotificationsForm
          scheduleID={p.scheduleID}
          errors={fieldErrors}
          value={newValue}
          onChange={(value) => setValue(value)}
          slackType={slackType}
          setSlackType={setSlackType}
        />
      }
    />
  )
}
