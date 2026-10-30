import { CopyButton } from "./arc/copy-button/copy-button";

export function CopyId({ apiKey }: { apiKey: string }) {
  return (
    <div className="row flex -tem">
      <code>{apiKey}</code>
      <CopyButton value={apiKey} label="Copy key" iconOnly  />
    </div>
  );
}