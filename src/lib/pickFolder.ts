type DirectoryHandle = { name: string };
type DirectoryPicker = (options?: { mode?: "read" | "readwrite" }) => Promise<DirectoryHandle>;

/**
 * Asks the person to choose a folder. Resolves to null if they cancel.
 *
 * In a browser this uses the File System Access API (Chrome and Edge only),
 * which exposes the folder's name but never its full path.
 * In the Electron app, replace the body with a call to the main process
 * (dialog.showOpenDialog with the openDirectory property), which returns the full path.
 */
export async function pickFolder(): Promise<string | null> {
  const picker = (window as unknown as { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker;
  if (!picker) {
    throw new Error("This browser can't choose a folder. The desktop app will.");
  }
  try {
    const handle = await picker.call(window, { mode: "readwrite" });
    return handle.name;
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") return null;
    throw reason;
  }
}