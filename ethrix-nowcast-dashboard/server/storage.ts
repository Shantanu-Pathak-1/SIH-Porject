// Storage helper for GeoAlert-NER local and cloud storage
import fs from "fs";
import path from "path";

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string
): Promise<{ key: string; url: string }> {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${Date.now()}_${path.basename(relKey)}`;
  const filePath = path.join(uploadsDir, filename);

  if (typeof data === "string") {
    fs.writeFileSync(filePath, data, "utf-8");
  } else {
    fs.writeFileSync(filePath, data);
  }

  return { key: filename, url: `/uploads/${filename}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  return { key: relKey, url: `/uploads/${relKey}` };
}
