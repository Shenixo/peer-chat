import { Button } from "./arc/button/button";

export function JoinRoom() {
  const generateNewId = () => {};
  return (
    <Button
      variant="primary"
      size="sm"
      background={"#FF9F0A"}
      className="bg-red-500"
      onClick={generateNewId}
    >
      Start Room
    </Button>
  );
}
