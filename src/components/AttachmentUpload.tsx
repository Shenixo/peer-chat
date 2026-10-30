
"use client";

import { FileDropzone } from "./arc/file-dropzone/file-dropzone";

type UploadOptions = {
  onProgress: (progress: number) => void;
  signal: AbortSignal;
};

async function uploadFile(
  file: File,
  { onProgress, signal }: UploadOptions,
): Promise<void> {
  // Dummy upload: simulate progress without sending a real file.
  const totalSteps = 10;

  for (let step = 1; step <= totalSteps; step++) {
    if (signal.aborted) {
      throw new DOMException(
        "Upload cancelled",
        "AbortError",
      );
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });

    onProgress(Math.round((step / totalSteps) * 100));
  }

  console.log("Dummy upload completed:", file.name);
}

export function AttachmentUpload() {
  return (
    <FileDropzone
      accept=".pdf,image/*"
      maxFiles={3}
      
      maxSize={10 * 1024 * 1024}
      onUpload={async (item, { onProgress, signal }) => {
        if (!item.file) {
          throw new Error("No file selected.");
        }

        await uploadFile(item.file, {
          onProgress,
          signal,
        });
      }}
    />
  );
}
