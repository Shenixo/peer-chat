import { CopyButton } from "./arc/copy-button/copy-button";

export function CopyId({ apiKey }: { apiKey: string }) {
  return (
    <div className="row flex items-center justify-between">
      <code>{apiKey}</code>
      <CopyButton value={apiKey} label="Copy key"   />
    </div>
  );
}