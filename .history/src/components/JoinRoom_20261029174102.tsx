import { ActionButton } from "./arc/action-button/action-button";

export function JoinRoom() {
  const generateNewId = () => {};
  return (
    <ActionButton
      label="Join Room"
      pendingLabel="Joining"
      successLabel="Published"
      onAction={generateNewId}
      background={""}
      // onActionError={error => toast.error(String(error))}
    />
    
  );
}



