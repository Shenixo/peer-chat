import { Button } from "./arc/button/button";

export function GenerateKey() {
  const generateNewId = () => {};
  return (
    <Button variant="ghost" size="sm"   onClick={generateNewId}>
      New Key
    </Button>
  );
}
