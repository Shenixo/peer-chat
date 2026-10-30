import { CopyButton } from "@/components/arc/copy-button/copy-button";

export function ApiKeyRow({ apiKey }: { apiKey: string }) {
  return (
    <div className="row">
      <code>{apiKey}</code>
      <CopyButton value={apiKey} label="Copy key" iconOnly />
    </div>
  );
}