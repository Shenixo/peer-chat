
import { Tabs, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";

type Screen = 'room' | 'chat' | 'transfers'

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

export default function Navbar({
  active,
  onChange,
  peerCount = 0,
}: NavbarProps) {
  const connected = peerCount > 0

  return (
    <header className="flex items-center justify-between gap-3">
      <div className={`${pill} gap-2.5 px-5 font-semibold tracking-tight`}>
        <span
          className="size-3.5 rounded-[5px] bg-accent"
          aria-hidden="true"
        />
        Peer Chat
      </div>

      <Tabs
        value={active}
        onValueChange={(value) => onChange(value as Screen)}
      >
        <TabsList
          aria-label="Screens"
          className={`${pill} w-72 p-1.5`}
        >
          {ITEMS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              disabled={item.disabled}
              title={
                item.disabled
                  ? 'Coming in a later phase'
                  : undefined
              }
              className="flex-1 rounded-full text-[15px] font-medium"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div
        className={`${pill} gap-2.5 px-5 text-[15px] font-medium text-muted`}
        aria-live="polite"
      >
        <span
          className={`size-2 rounded-full ${
            connected ? 'bg-online' : 'bg-faint'
          }`}
          aria-hidden="true"
        />
        {connected ? `${peerCount} connected` : 'No server'}
      </div>
    </header>
  )
}
