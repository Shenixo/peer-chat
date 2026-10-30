import { Button } from "./arc/button/button";

export function JoinRo() {
  const generateNewId = () => {};
  return (
    <Button variant="primary" size="sm" className="bg-red-500"  onClick={generateNewId}>
      New Key
    </Button>
  );
}
