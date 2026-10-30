import ActionButton from "../components/arc/action-button/action-button";
import { Input } from "../components/arc/input/input";
import Cards from "../components/Cards";
import { CopyId } from "../components/CopyId";
import { GenerateKey } from "../components/GenerateKey";
import { JoinRoom } from "../components/JoinRoom";
const Room = () => {
  const generateNewId = () => {};

  return (
    <div className="w-full gap-10 text-center flex items-center justify-between flex-col mt-10">
      <h1 className="text-7xl max-w-[10ch] text-center font-bold ">
        Talk directly to anyone.
      </h1>
      <p className="text-muted text-xl max-w-[50ch]">
        Share a room code and your messages travel straight to the other person.
        Nothing sits in the middle.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cards title="Create a room">
          <p className="mb-6 text-muted">
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
          <Input
            label="Room key"
            className=""
            description="Type the code someone sent you"
            placeholder="XXXXXX"
            type="text"
          />

                  <div className="">
                      
          <ActionButton
            label="Join Room"
            pendingLabel="Joining"
            successLabel="Published"
            onAction={generateNewId}
            background={"#FF9F0A"}
            // onActionError={error => toast.error(String(error))}
          />
                  </div>
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
  );
};

export default Room;
