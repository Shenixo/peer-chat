
import Cards from "@/components/Cards";

export default function RoomPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Cards title="Create a room">
        <p className="mb-6 text-muted">
          Send this code to the person you want to talk to.
        </p>

        <div className="rounded-field border border-line bg-elevated p-6">
          <span className="font-mono text-3xl font-semibold tracking-widest text-accent">
            K7QM92XD
          </span>
        </div>
      </Cards>

      <Cards title="Join a room">
        <p className="text-muted">
          Type the code someone sent you.
        </p>
      </Cards>

      <div className="lg:col-span-2">
        <Cards title="Private by design">
          <p className="text-muted">
            Your messages stay private between you and your peer.
          </p>
        </Cards>
      </div>
    </div>
  );
}
