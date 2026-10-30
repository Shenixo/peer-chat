import { Button } from "./arc/button/button";

export function GenerateKey() {
    const generateNewId = () => {

    }
  return (
    <Button variant="primary" size="lg"  onClick={generateNewId}>
      New Key
    </Button>
  );
}