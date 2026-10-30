import { Button } from "./arc/button/button";

export function JoinRoom() {
  const generateNewId = () => {};
  return (
    <Button
      variant="primary"
      size="sm"
      className="bg-red-500"
      onClick={generateNewId}
    >
      Join Room
    </Button>
  );
}
