import { Button } from "./arc/button/button";

export function JoinRoom() {
  const generateNewId = () => {};
  return (
    <Button
      variant="primary"
      size="md"
      background={"#FF9F0A"}
      className="border-none"
      onClick={generateNewId}
    >
      Start Room
    </Button>
    
  );
}


import { ActionButton } from "@/components/arc/action-button/action-button";

export function PublishButton() {
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