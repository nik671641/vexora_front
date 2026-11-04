import type { ContentItem } from '../types/product'
import { toneForStatus } from '../utils/status'
import { StatusPill } from './StatusPill'
import { useI18n } from '../../i18n/context'

export function ContentTable({ items }: { items: ContentItem[] }) {
  const { label, contentTime } = useI18n()
  return (
    <div className="content-table">
      {items.map((item) => (
        <div className="content-row" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <p>
              {item.company} / {label(item.type)}
            </p>
          </div>
          <span>{contentTime(item)}</span>
          <StatusPill label={label(item.status)} tone={toneForStatus(item.status)} />
        </div>
      ))}
    </div>
  )
}
