export type Screen = 'room' | 'chat' | 'transfers'

type NavItem = {
  id: Screen
  label: string
  disabled?: boolean
}

const ITEMS: NavItem[] = [
  { id: 'room', label: 'Room' },
  { id: 'chat', label: 'Chat' },
  { id: 'transfers', label: 'Transfers', disabled: true },
]

const pill =
  'inline-flex h-12 items-center rounded-full border border-line bg-white/5 backdrop-blur-xl backdrop-saturate-150'

type NavbarProps = {
  active: Screen
  onChange: (screen: Screen) => void
  peerCount?: number
}

export default function Navbar({ active, onChange, peerCount = 0 }: NavbarProps) {
  const activeIndex = Math.max(
    0,
    ITEMS.findIndex((item) => item.id === active),
  )
  const connected = peerCount > 0

  return (
    <header className="flex items-center justify-between gap-3">
      <div className={`${pill} gap-2.5 px-5 font-semibold tracking-tight`}>
        <span className="size-3.5 rounded-[5px] bg-accent" aria-hidden="true" />
        Peer Chat
      </div>

      <nav aria-label="Screens" className={`${pill} relative w-72 p-1.5`}>
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-0.75rem)/3)] rounded-full bg-white/10 transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        <ul className="relative grid h-full w-full grid-cols-3">
          {ITEMS.map((item) => {
            const isActive = item.id === active
            return (
              <li key={item.id} className="flex">
                <button
                  type="button"
                  disabled={item.disabled}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.disabled ? 'Coming in a later phase' : undefined}
                  onClick={() => onChange(item.id)}
                  className={`w-full rounded-full text-[15px] font-medium transition-colors ${
                    isActive ? 'text-ink' : 'text-muted hover:text-ink'
                  } disabled:cursor-not-allowed disabled:text-faint disabled:hover:text-faint`}
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div
        className={`${pill} gap-2.5 px-5 text-[15px] font-medium text-muted`}
        aria-live="polite"
      >
        <span
          className={`size-2 rounded-full ${connected ? 'bg-online' : 'bg-faint'}`}
          aria-hidden="true"
        />
        {connected ? `${peerCount} connected` : 'No server'}
      </div>
    </header>
  )
}