import { FileDropzone } from "./arc/file-dropzone/file-dropzone";

export function AttachmentUpload() {
    function uploadFile ()
  return (
    <FileDropzone
      accept=".pdf,image/*"
      maxFiles={3}
      maxSize={10 * 1024 * 1024}
      onUpload={async (item, { onProgress, signal }) => {
        await uploadFile(item.file!, { onProgress, signal });
      }}
    />
  );
}