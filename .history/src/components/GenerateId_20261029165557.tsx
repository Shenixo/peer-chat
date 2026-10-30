import { Button } from "@/components/arc/button/button";

export function Generate() {
  return (
    <Button variant="primary" loading={saving} onClick={save}>
      Save changes
    </Button>
  );
}