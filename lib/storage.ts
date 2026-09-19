import fs from "fs/promises";
import path from "path";

export interface IStorageService {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // already exists
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, _mimeType: string): Promise<string> {
    await this.ensureDir();
    const uniqueName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    await fs.writeFile(filePath, fileBuffer);
    return `/uploads/${uniqueName}`;
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export class S3StorageService implements IStorageService {
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || "";
  }

  async uploadFile(_fileBuffer: Buffer, fileName: string, _mimeType: string): Promise<string> {
    if (!this.bucket || !process.env.AWS_ACCESS_KEY_ID) {
      throw new Error("S3 credentials not configured. Please set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in .env");
    }
    // Architecture ready for AWS SDK v3 S3 client
    return `https://${this.bucket}.s3.amazonaws.com/uploads/${Date.now()}-${fileName}`;
  }

  async deleteFile(_fileUrl: string): Promise<boolean> {
    return true;
  }
}

export function getStorageService(): IStorageService {
  const provider = process.env.STORAGE_PROVIDER || "local";
  if (provider === "s3" && process.env.AWS_S3_BUCKET) {
    return new S3StorageService();
  }
  return new LocalStorageService();
}
