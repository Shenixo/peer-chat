import { ScrollArea } from "arc/scroll-area/scroll-area";

export function ActivityPanel({ events }: { events: { id: string; text: string }[] }) {
  return (
    <ScrollArea maxHeight={320} label="Recent activity">
      <ul>{events.map(event => <li key={event.id}>{event.text}</li>)}</ul>
    </ScrollArea>
  );
}