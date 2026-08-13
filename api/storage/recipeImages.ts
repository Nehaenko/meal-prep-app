import { del, put } from "@vercel/blob";
import { randomUUID } from "crypto";

const DATA_IMAGE = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i;

export async function storeRecipeImage(
  image: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!image) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return image;

  const match = image.match(DATA_IMAGE);
  if (!match) return image;
  const extension = match[1].toLowerCase().split("/")[1].replace("jpeg", "jpg");
  const blob = await put(
    `recipes/${userId}/${randomUUID()}.${extension}`,
    Buffer.from(match[2], "base64"),
    {
      access: "public",
      contentType: match[1],
      addRandomSuffix: false,
    }
  );
  return blob.url;
}

export async function deleteRecipeImage(image: string | null | undefined) {
  if (
    !process.env.BLOB_READ_WRITE_TOKEN ||
    !image?.includes(".blob.vercel-storage.com/")
  ) {
    return;
  }
  await del(image);
}
