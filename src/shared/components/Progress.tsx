export function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div className="progress-block">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <meter max="100" min="0" value={value} />
    </div>
  )
}
