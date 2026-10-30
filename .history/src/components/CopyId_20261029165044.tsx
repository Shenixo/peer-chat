import { CopyButton } from "./arc/copy-button/copy-button";

export function CopyId({ apiKey }: { apiKey: string }) {
  return (
    <div className="row flex items-center justify-between">
      <code className="font-mono text-3xl font-semibold tracking-widest text-accent" >{apiKey}</code>
      <CopyButton value={apiKey} label="Copy key"   />
    </div>
  );
}