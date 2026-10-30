import { Button } from "./arc/button/button";

export function GenerateKey() {
    const generateNewId = () => {

    }
  return (
    <Button variant="primary" className="p-3"  onClick={generateNewId}>
      New Key
    </Button>
  );
}