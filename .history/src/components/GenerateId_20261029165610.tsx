import { Button } from "./arc/button/button";

export function GenerateId() {
  return (
    <Button variant="primary"  onClick={save}>
      Save changes
    </Button>
  );
}