import ActionButton from "../components/arc/action-button/action-button";
import { Input } from "../components/arc/input/input";
import Cards from "../components/Cards";
import { CopyId } from "../components/CopyId";
import { GenerateKey } from "../components/GenerateKey";
import { JoinRoom } from "../components/JoinRoom";
import GhostFibers from "../components/GhostFibers";
const Room = () => {
  const generateNewId = () => {};

  return (
    <div className="w-full gap-10 text-center flex items-center justify-between flex-col mt-10 md:max-w-4xl mx-auto">
      <div
        style={{ width: "100%", position: "fixed", inset: 0, zIndex:-1 }}
      >
        <GhostFibers
          glowColor="#8b5cf6"
          layers={3}
          twist={1.2}
          threads={72}
          fiberStyle="dots"
          depthOfField={0.85}
          hoverEffect="focus"
          intro
          mouseInteraction
          lineColor="#dfd1fc"
          secondaryColor="#6f4ac5"
          gradient="depth"
          waves={1}
          volume={0.7}
          spread={1}
          scale={1}
          rotation={18}
          perspective={0.65}
          density={1}
          thickness={1}
          tips={0}
          foldGlow={1}
          speed={0.5}
          flow={0.4}
          rollSpeed={0.15}
          focusDepth={0}
          particles={0.5}
          sparkle={0.5}
          glow={0.8}
          brightness={1}
          vignette={0.3}
          grain={0.06}
          mouseStrength={1}
          pulseOnClick
          lightMode={false}
        />
      </div>
      <h1 className=" text-6xl md:text-7xl max-w-[10ch] text-center font-bold ">
        Talk directly to anyone.
      </h1>
      <p className="text-muted text-xl max-w-none md:max-w-[50ch]">
        Share a room code and your messages travel straight to the other person.
        Nothing sits in the middle.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cards title="Create a room">
          <p className="mb-6 text-left text-muted">
            Send this code to the person you want to talk to.
          </p>

          <div className="rounded-field border border-line bg-elevated p-4">
            <CopyId apiKey="LAJ2HNUE" />
          </div>

          <div className="flex items-center gap-4 mt-6">
            <JoinRoom />
            <GenerateKey />
          </div>
        </Cards>

        <Cards title="Join a room">
          <p className="mb-6 text-left text-muted">
            Send this code to the person you want to talk to.
          </p>
          <Input
            label="Room key"
            className=""
            description="Type the code someone sent you"
            placeholder="XXXXXX"
            type="text"
          />

          <div className="text-start mt-10">
            <ActionButton
              label="Join Room"
              pendingLabel="Joining"
              successLabel="Published"
              onAction={generateNewId}
              background={"#FF9F0A"}
              disabled
              // onActionError={error => toast.error(String(error))}
            />
          </div>
        </Cards>
        <div className="lg:col-span-2 ">
          <Cards title="Private by design">
            <p className="text-white mb-4 text-left">
              Your messages are encrypted on your device and unlocked only on
              theirs. No server sits in between, so nobody in the middle can
              read or store them.
            </p>
            <p className="text-muted text-left">
              Anyone who has your room code can join, so share it only with
              people you trust. If either of you closes the app, the
              conversation pauses until you both come back.
            </p>
          </Cards>
        </div>
      </div>
    </div>
  );
};

export default Room;
