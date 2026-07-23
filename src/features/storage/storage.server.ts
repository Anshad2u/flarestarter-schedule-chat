/**
 * R2 wrappers for avatar storage. Deliberately thin — all validation lives in
 * the pure `storage.ts`, so these just move bytes to/from the bucket.
 *
 * `BUCKET` is a Cloudflare binding (like DB/CACHE): declared in wrangler.jsonc.
 * If R2 is not enabled in the dashboard, the binding is undefined — we degrade
 * gracefully (avatars simply aren't persisted) instead of crashing the worker.
 */
import { avatarObjectKey } from './storage'

/** Store (overwrite) a user's avatar. Returns the object key written. */
export async function putAvatar(
  bucket: R2Bucket | undefined,
  userId: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<string | null> {
  if (!bucket) return null
  const key = avatarObjectKey(userId)
  await bucket.put(key, body, { httpMetadata: { contentType } })
  return key
}

/** Fetch a user's avatar object (or null). Caller streams `.body` to the response. */
export function getAvatar(bucket: R2Bucket | undefined, userId: string): Promise<R2ObjectBody | null> {
  if (!bucket) return Promise.resolve(null)
  return bucket.get(avatarObjectKey(userId))
}
