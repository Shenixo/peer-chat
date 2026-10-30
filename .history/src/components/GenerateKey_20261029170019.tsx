import { Button } from "./arc/button/button";

export function GenerateKey() {
    const generateNewId = () => {

    }
  return (
    <Button variant="primary" size="md"  onClick={generateNewId}>
      New Key
    </Button>
  );
}