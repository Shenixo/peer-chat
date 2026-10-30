import { Button } from "./arc/button/button";

export function GenerateKey() {
  const generateNewId = () => {};
  return (
    <Button variant="secondary" size="md" className="bg-red-500"  onClick={generateNewId}>
      New Key
    </Button>
  );
}
