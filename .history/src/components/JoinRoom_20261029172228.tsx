import { ActionButton } from "./arc/action-button/action-button";

export function JoinRoom() {
  const generateNewId = () => {};
  return (
 

     <ActionButton
      label="Publish"
      pendingLabel="Publishing"
      successLabel="Published"
      onAction={publish}
      onActionError={error => toast.error(String(error))}
    />
    
  );
}



