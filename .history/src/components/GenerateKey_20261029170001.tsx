import { Button } from "./arc/button/button";

export function GenerateKey() {
    const generateNewId = () => {

    }
  return (
    <Button variant="primary" className="p-6"  onClick={generateNewId}>
      New Key
    </Button>
  );
}