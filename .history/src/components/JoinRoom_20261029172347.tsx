import { ActionButton } from "./arc/action-button/action-button";

export function JoinRoom() {
  const generateNewId = () => {};
  return (
    <ActionButton
    va
      label="Publish"
      pendingLabel="Publishing"
      successLabel="Published"
      onAction={generateNewId}
      // onActionError={error => toast.error(String(error))}
    />
    
  );
}



