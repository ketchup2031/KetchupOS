import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useStorage } from '../system/storage'
import { useWorkspace } from '../system/workspace'

interface CalendarEvent { id: string; date: string; title: string; time: string }
interface EventDraft { id?: string; title: string; time: string }
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function Calendar() {
  const [events, setEvents, storageError] = useStorage<CalendarEvent[]>('events', [])
  const [selected, setSelected] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const [draft, setDraft] = useState<EventDraft | null>(null)
  const { notify } = useWorkspace()
  const today = dateKey(new Date())
  const active = dateKey(selected)
  const year = month.getFullYear()
  const m = month.getMonth()
  const offset = (month.getDay() + 6) % 7
  const days = Array.from({ length: 42 }, (_, index) => new Date(year, m, 1 + index - offset))
  const eventDates = new Set(events.map(event => event.date))
  const agenda = events.filter(event => event.date === active).sort((a, b) => a.time.localeCompare(b.time))

  function select(date: Date) {
    setSelected(date)
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setDraft(null)
  }

  function go(step: number) { select(new Date(year, m + step, 1)) }

  function save(event: FormEvent) {
    event.preventDefault()
    const title = draft?.title.trim()
    if (!draft || !title) return
    const item = { id: draft.id ?? crypto.randomUUID(), title, time: draft.time, date: active }
    setEvents(previous => draft.id ? previous.map(event => event.id === item.id ? item : event) : [...previous, item])
    notify(draft.id ? 'Event updated' : 'Event added', title)
    setDraft(null)
  }

  return <div className="app-stack calendar-app">
    <div className="app-toolbar wrap">
      <CalendarDays size={17} /><button className="icon-button" aria-label="Previous month" title="Previous month" onClick={() => go(-1)}><ChevronLeft size={17} /></button>
      <strong aria-live="polite">{month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</strong>
      <button className="icon-button" aria-label="Next month" title="Next month" onClick={() => go(1)}><ChevronRight size={17} /></button>
      <button className="soft-button push" onClick={() => select(new Date())}>Today</button>
    </div>
    {storageError && <div className="app-alert" role="alert">Browser storage is full or unavailable.</div>}
    <div className="calendar-body app-scroll">
      <div className="calendar-grid" aria-label="Days in month">
        {weekdays.map(day => <span className="weekday" key={day}>{day}</span>)}
        {days.map(date => {
          const key = dateKey(date)
          return <button key={key} data-today={key === today} data-outside={date.getMonth() !== m} aria-pressed={key === active}
            aria-label={date.toLocaleDateString('en', { dateStyle: 'full' }) + (eventDates.has(key) ? ', has events' : '')} onClick={() => select(date)}>
            {date.getDate()}{eventDates.has(key) && <i />}
          </button>
        })}
      </div>
      <section className="agenda" aria-label="Events">
        <div className="agenda-heading"><h2>{selected.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</h2>
          <button className="icon-button" aria-label="Add event" title="Add event" onClick={() => setDraft({ title: '', time: '' })}><Plus size={17} /></button></div>
        {draft && <form className="calendar-form" onSubmit={save}>
          <label>Event name<input aria-label="Event name" autoFocus required maxLength={95} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
          <label>Time (optional)<input aria-label="Event time" type="time" value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} /></label>
          <div><button className="accent-button" type="submit">Save event</button><button className="soft-button" type="button" onClick={() => setDraft(null)}>Cancel</button></div>
        </form>}
        {agenda.length ? agenda.map(item => <article key={item.id}>
          <div><strong>{item.title}</strong><small>{item.time || 'All day'}</small></div>
          <button className="icon-button" aria-label={'Edit ' + item.title} title="Edit event" onClick={() => setDraft({ id: item.id, title: item.title, time: item.time })}><Pencil size={13} /></button>
          <button className="icon-button warning" aria-label={'Delete ' + item.title} title="Delete event" onClick={() => {
            setEvents(previous => previous.filter(event => event.id !== item.id))
            if (draft?.id === item.id) setDraft(null)
            notify('Event deleted', item.title)
          }}><Trash2 size={14} /></button>
        </article>) : !draft && <p>No events for this day.</p>}
      </section>
    </div>
  </div>
}
