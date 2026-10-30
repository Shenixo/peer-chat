import { Button } from "./arc/button/button";

export function JoinRoom() {
  const generateNewId = () => {};
  return (
    <Button
      variant="primary"
      size="md"
      background={"#FF9F0A"}
      className="border-0"
      onClick={generateNewId}
    >
      Start Room
    </Button>
  );
}
