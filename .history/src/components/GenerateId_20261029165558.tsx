import { Button } from "@/components/arc/button/button";

export function GenerateId() {
  return (
    <Button variant="primary" loading={saving} onClick={save}>
      Save changes
    </Button>
  );
}