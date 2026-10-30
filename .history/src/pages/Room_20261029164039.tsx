
import Cards from "../components/Cards"
const Room = () => {
  return (
      <div className="w-full gap-10 text-center flex items-center justify-between flex-col mt-10">
          <h1 className="text-7xl max-w-[10ch] text-center font-bold ">Talk directly to anyone.</h1>
          <p className="text-muted text-xl max-w-[50ch]">Share a room code and your messages travel straight to the other person. Nothing sits in the middle.</p>
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

    </div>
  )
}

export default Room
